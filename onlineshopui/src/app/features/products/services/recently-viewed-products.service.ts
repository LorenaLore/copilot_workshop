import { Injectable, signal } from '@angular/core';

export const RECENTLY_VIEWED_PRODUCTS_STORAGE_KEY = 'recently_viewed_product_ids';
const MAX_RECENT_PRODUCTS = 10;

@Injectable({
    providedIn: 'root'
})
export class RecentlyViewedProductsService {
    private readonly _productIds = signal(this.readProductIds());

    readonly productIds = this._productIds.asReadonly();

    recordView(productId: string): void {
        const productIds = [productId, ...this._productIds().filter(id => id !== productId)].slice(
            0,
            MAX_RECENT_PRODUCTS
        );

        this._productIds.set(productIds);

        try {
            globalThis.localStorage?.setItem(
                RECENTLY_VIEWED_PRODUCTS_STORAGE_KEY,
                JSON.stringify(productIds)
            );
        } catch {
            // Browsing history remains available for this session if storage is unavailable.
        }
    }

    private readProductIds(): string[] {
        try {
            const storedValue = globalThis.localStorage?.getItem(
                RECENTLY_VIEWED_PRODUCTS_STORAGE_KEY
            );
            if (!storedValue) return [];

            const parsed: unknown = JSON.parse(storedValue);
            if (!Array.isArray(parsed)) return [];

            return [
                ...new Set(
                    parsed.filter((id): id is string => typeof id === 'string' && id.length > 0)
                )
            ].slice(0, MAX_RECENT_PRODUCTS);
        } catch {
            return [];
        }
    }
}
