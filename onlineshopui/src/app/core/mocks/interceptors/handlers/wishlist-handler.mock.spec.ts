import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { MOCK_PRODUCTS } from '../../data/products.mock';
import { mockApiInterceptor } from '../mock-api.interceptor';
import { handleWishlistFeature } from './wishlist-handler.mock';

describe('wishlist mock', () => {
    const userA = 'Bearer mock-jwt-token-user-1';
    const userB = 'Bearer mock-jwt-token-user-2';
    const request = (method: string, path: string, authHeader: string | null = userA) =>
        handleWishlistFeature({ method, path, authHeader })!;
    const id = MOCK_PRODUCTS[0].id;
    const other = MOCK_PRODUCTS[1].id;

    beforeEach(() => {
        for (const user of [userA, userB]) {
            for (const product of [id, other]) request('DELETE', `/wishlist/${product}`, user);
        }
    });

    it('requires authentication and validates product identifiers', () => {
        expect(request('GET', '/wishlist', null).status).toBe(401);
        expect(request('GET', '/wishlist', 'Bearer invalid').status).toBe(401);
        expect(request('POST', '/wishlist/not-a-uuid').status).toBe(400);
        expect(request('DELETE', '/wishlist/not-a-uuid').status).toBe(400);
        expect(request('POST', '/wishlist/00000000-0000-0000-0000-000000000001').status).toBe(404);
    });

    it('isolates users, preserves order on duplicate saves and removes idempotently', () => {
        expect(request('POST', `/wishlist/${id}`).status).toBe(204);
        request('POST', `/wishlist/${other}`);
        request('POST', `/wishlist/${id}`);
        request('POST', `/wishlist/${id}`, userB);
        expect(request('GET', '/wishlist').body).toEqual([MOCK_PRODUCTS[1], MOCK_PRODUCTS[0]]);
        request('DELETE', `/wishlist/${id}`);
        expect(request('DELETE', `/wishlist/${id}`).status).toBe(204);
        expect(request('GET', '/wishlist', userB).body).toEqual([MOCK_PRODUCTS[0]]);
    });

    it('emits wishlist 4xx responses through the HTTP error channel', async () => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(withInterceptors([mockApiInterceptor]))]
        });
        const client = TestBed.inject(HttpClient);
        let error: unknown;
        try {
            await firstValueFrom(client.get('http://mock-api/wishlist'));
        } catch (caught) {
            error = caught;
        }
        expect(error).toBeInstanceOf(HttpErrorResponse);
        expect((error as HttpErrorResponse).status).toBe(401);
    });
});
