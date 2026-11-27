import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import {
    RecentlyViewedProductsService,
    RECENTLY_VIEWED_PRODUCTS_STORAGE_KEY
} from './recently-viewed-products.service';

describe('RecentlyViewedProductsService', () => {
    let service: RecentlyViewedProductsService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({
            providers: [RecentlyViewedProductsService]
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        TestBed.resetTestingModule();
    });

    function injectService(): RecentlyViewedProductsService {
        service = TestBed.inject(RecentlyViewedProductsService);
        return service;
    }

    it('should initialize with no product IDs', () => {
        expect(injectService().productIds()).toEqual([]);
    });

    it('should persist the latest view first without duplicates', () => {
        // Prepare
        const instance = injectService();
        instance.recordView('product-1');
        instance.recordView('product-2');

        // Action
        instance.recordView('product-1');

        // Verify
        expect(instance.productIds()).toEqual(['product-1', 'product-2']);
        expect(
            JSON.parse(localStorage.getItem(RECENTLY_VIEWED_PRODUCTS_STORAGE_KEY) ?? '[]')
        ).toEqual(['product-1', 'product-2']);
    });

    it('should retain only the ten most recent product IDs', () => {
        // Prepare
        const instance = injectService();

        // Action
        for (let id = 1; id <= 11; id++) {
            instance.recordView(`product-${id}`);
        }

        // Verify
        expect(instance.productIds()).toEqual([
            'product-11',
            'product-10',
            'product-9',
            'product-8',
            'product-7',
            'product-6',
            'product-5',
            'product-4',
            'product-3',
            'product-2'
        ]);
    });

    it('should discard malformed and duplicate stored IDs', () => {
        // Prepare
        localStorage.setItem(
            RECENTLY_VIEWED_PRODUCTS_STORAGE_KEY,
            JSON.stringify(['product-1', null, 3, 'product-1', '', 'product-2'])
        );

        // Action
        const instance = injectService();

        // Verify
        expect(instance.productIds()).toEqual(['product-1', 'product-2']);
    });

    it('should remain usable when browser storage is unavailable', () => {
        // Prepare
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('Storage unavailable');
        });
        const instance = injectService();

        // Action
        instance.recordView('product-1');

        // Verify
        expect(instance.productIds()).toEqual(['product-1']);
    });

    it('should initialize with an empty history when stored JSON is malformed', () => {
        // Prepare
        localStorage.setItem(RECENTLY_VIEWED_PRODUCTS_STORAGE_KEY, '{invalid');
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => '{invalid');

        // Action
        const instance = injectService();

        // Verify
        expect(instance.productIds()).toEqual([]);
    });
});
