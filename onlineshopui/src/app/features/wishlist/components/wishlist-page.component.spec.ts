import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { MOCK_PRODUCTS } from '../../../core/mocks/data/products.mock';
import { WishlistService } from '../services/wishlist.service';
import { WishlistPageComponent } from './wishlist-page.component';

describe('WishlistPageComponent', () => {
    const wishlist = {
        products: signal<typeof MOCK_PRODUCTS>([]),
        loading: signal(false),
        error: signal<string | null>(null),
        mutationError: signal<string | null>(null),
        load: vi.fn(),
        remove: vi.fn(),
        isPending: vi.fn().mockReturnValue(false)
    };

    beforeEach(() => {
        wishlist.products.set([]);
        wishlist.loading.set(false);
        wishlist.error.set(null);
        wishlist.mutationError.set(null);
        vi.clearAllMocks();
        TestBed.configureTestingModule({
            imports: [WishlistPageComponent],
            providers: [provideRouter([]), { provide: WishlistService, useValue: wishlist }]
        });
    });

    it('loads and shows the empty state, then renders products with detail and remove actions', () => {
        const fixture = TestBed.createComponent(WishlistPageComponent);
        fixture.detectChanges();
        expect(wishlist.load).toHaveBeenCalledWith(true);
        expect(fixture.nativeElement.textContent).toContain('wishlist is empty');
        wishlist.products.set([MOCK_PRODUCTS[0]]);
        fixture.detectChanges();
        const root = fixture.nativeElement as HTMLElement;
        expect(root.textContent).toContain(MOCK_PRODUCTS[0].name);
        expect(root.textContent).toContain(MOCK_PRODUCTS[0].price.toFixed(2));
        expect(root.querySelector('img')?.getAttribute('src')).toBe(MOCK_PRODUCTS[0].imageUrl);
        expect(root.querySelector('a')?.getAttribute('href')).toBe(`/products/${MOCK_PRODUCTS[0].id}`);
        root.querySelector('button')?.click();
        expect(wishlist.remove).toHaveBeenCalledWith(MOCK_PRODUCTS[0].id);
    });

    it('shows loading, retryable list error, and failed removal without hiding the item', () => {
        wishlist.loading.set(true);
        const fixture = TestBed.createComponent(WishlistPageComponent);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('app-spinner')).toBeTruthy();
        wishlist.loading.set(false);
        wishlist.error.set('Failed to load');
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).not.toContain('wishlist is empty');
        fixture.nativeElement.querySelector('button').click();
        expect(wishlist.load).toHaveBeenCalledTimes(2);
        wishlist.error.set(null);
        wishlist.mutationError.set('Removal failed');
        wishlist.products.set([MOCK_PRODUCTS[0]]);
        wishlist.isPending.mockReturnValue(true);
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain('Removal failed');
        expect(fixture.nativeElement.textContent).toContain(MOCK_PRODUCTS[0].name);
        expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
    });
});
