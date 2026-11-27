import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from '../../auth/services/auth.service';
import { EnvironmentConfig } from '../../../core/types/providers/environment-config';
import { MOCK_PRODUCTS } from '../../../core/mocks/data/products.mock';
import { MOCK_USERS } from '../../../core/mocks/data/users.mock';
import { WishlistService } from './wishlist.service';

describe('wishlist authentication sessions', () => {
    it('clears cache on real logout and login, and ignores stale profile and wishlist responses', () => {
        localStorage.removeItem('access_token');
        const router = { navigate: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: EnvironmentConfig, useValue: { apiUrl: 'http://example.test/api' } },
                { provide: Router, useValue: router }
            ]
        });
        const auth = TestBed.inject(AuthService);
        const wishlist = TestBed.inject(WishlistService);
        const http = TestBed.inject(HttpTestingController);
        const api = 'http://example.test/api';
        auth.login({ email: MOCK_USERS[0].email, password: 'password' }).subscribe();
        http.expectOne(`${api}/auth/login`).flush({ access_token: 'a' });
        const oldProfile = http.expectOne(`${api}/auth/profile`);
        wishlist.load();
        const oldWishlist = http.expectOne(`${api}/wishlist`);
        auth.logout();
        expect(wishlist.products()).toEqual([]);
        expect(router.navigate).toHaveBeenCalled();
        auth.login({ email: MOCK_USERS[1].email, password: 'password' }).subscribe();
        http.expectOne(`${api}/auth/login`).flush({ access_token: 'b' });
        http.expectOne(`${api}/auth/profile`).flush(MOCK_USERS[1]);
        wishlist.load();
        http.expectOne(`${api}/wishlist`).flush([MOCK_PRODUCTS[1]]);
        oldProfile.flush(MOCK_USERS[0]);
        oldWishlist.flush([MOCK_PRODUCTS[0]]);
        expect(auth.getUser()()).toEqual(MOCK_USERS[1]);
        expect(wishlist.products()).toEqual([MOCK_PRODUCTS[1]]);
        auth.logout();
        expect(wishlist.products()).toEqual([]);
        http.verify();
    });
});
