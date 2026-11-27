import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MOCK_PRODUCTS } from '../../../core/mocks/data/products.mock';
import { EnvironmentConfig } from '../../../core/types/providers/environment-config';
import { NotificationsService } from '../../../core/services/notifications.service';
import { AuthService } from '../../auth/services/auth.service';
import { WishlistService } from './wishlist.service';

describe('WishlistService', () => {
    let service: WishlistService;
    let http: HttpTestingController;
    const session = signal(0);
    const authenticated = signal(true);
    const notifications = { notifySuccess: vi.fn(), notifyError: vi.fn() };
    const auth = {
        session,
        isAuthenticated: authenticated,
        logout: vi.fn(() => {
            session.update(value => value + 1);
            authenticated.set(false);
        })
    };
    const url = 'http://example.test/api/wishlist';

    beforeEach(() => {
        session.set(0);
        authenticated.set(true);
        vi.clearAllMocks();
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: EnvironmentConfig, useValue: { apiUrl: 'http://example.test/api' } },
                { provide: AuthService, useValue: auth },
                { provide: NotificationsService, useValue: notifications }
            ]
        });
        service = TestBed.inject(WishlistService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('loads, retries errors, saves only after confirmation, and retains failed removals', () => {
        const product = MOCK_PRODUCTS[0];
        service.load();
        expect(service.loading()).toBe(true);
        http.expectOne(url).flush('failure', { status: 500, statusText: 'Error' });
        expect(service.error()).toBeTruthy();
        service.load(true);
        http.expectOne(url).flush([]);
        service.save(product);
        expect(service.isPending(product.id)).toBe(true);
        expect(service.isSaved(product.id)).toBe(false);
        service.save(product);
        const save = http.expectOne(`${url}/${product.id}`);
        expect(save.request.method).toBe('POST');
        save.flush(null, { status: 204, statusText: 'No Content' });
        expect(service.isSaved(product.id)).toBe(true);
        expect(notifications.notifySuccess).toHaveBeenCalledOnce();
        service.remove(product.id);
        const remove = http.expectOne(`${url}/${product.id}`);
        expect(remove.request.method).toBe('DELETE');
        remove.flush('failure', { status: 500, statusText: 'Error' });
        expect(service.isSaved(product.id)).toBe(true);
        expect(service.isPending(product.id)).toBe(false);
        expect(service.mutationError()).toBeTruthy();
        service.remove(product.id);
        http.expectOne(`${url}/${product.id}`).flush(null, { status: 204, statusText: 'No Content' });
        expect(service.products()).toEqual([]);
    });

    it('keeps failed saves retryable and does not notify success', () => {
        service.save(MOCK_PRODUCTS[0]);
        http.expectOne(`${url}/${MOCK_PRODUCTS[0].id}`).flush('fail', { status: 404, statusText: 'Not Found' });
        expect(service.isSaved(MOCK_PRODUCTS[0].id)).toBe(false);
        expect(service.isPending(MOCK_PRODUCTS[0].id)).toBe(false);
        expect(notifications.notifySuccess).not.toHaveBeenCalled();
        expect(notifications.notifyError).toHaveBeenCalledOnce();
    });

    it('isolates accounts and ignores responses from old sessions', () => {
        service.load();
        const old = http.expectOne(url);
        session.update(value => value + 1);
        expect(service.products()).toEqual([]);
        service.load();
        http.expectOne(url).flush([MOCK_PRODUCTS[1]]);
        old.flush([MOCK_PRODUCTS[0]]);
        expect(service.products()).toEqual([MOCK_PRODUCTS[1]]);
        session.update(value => value + 1);
        authenticated.set(false);
        expect(service.products()).toEqual([]);
        service.load();
        http.expectNone(url);
    });

    it('clears state and logs out on wishlist 401', () => {
        service.load();
        http.expectOne(url).flush([MOCK_PRODUCTS[0]]);
        service.remove(MOCK_PRODUCTS[0].id);
        http.expectOne(`${url}/${MOCK_PRODUCTS[0].id}`).flush({}, { status: 401, statusText: 'Unauthorized' });
        expect(auth.logout).toHaveBeenCalledOnce();
        expect(service.products()).toEqual([]);
    });

    it('never reports a successful save on authentication failure', () => {
        service.save(MOCK_PRODUCTS[0]);
        http.expectOne(`${url}/${MOCK_PRODUCTS[0].id}`).flush({}, { status: 401, statusText: 'Unauthorized' });
        expect(auth.logout).toHaveBeenCalledOnce();
        expect(service.products()).toEqual([]);
        expect(notifications.notifySuccess).not.toHaveBeenCalled();
    });

    it('reloads after a mutation races an earlier list response', () => {
        service.load();
        const old = http.expectOne(url);
        service.save(MOCK_PRODUCTS[0]);
        http.expectOne(`${url}/${MOCK_PRODUCTS[0].id}`).flush(null, { status: 204, statusText: 'No Content' });
        const fresh = http.expectOne(url);
        old.flush([]);
        fresh.flush([MOCK_PRODUCTS[0], MOCK_PRODUCTS[1]]);
        expect(service.products()).toEqual([MOCK_PRODUCTS[0], MOCK_PRODUCTS[1]]);
    });
});
