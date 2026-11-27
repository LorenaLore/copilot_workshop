import { MOCK_PRODUCTS } from '../../data/products.mock';
import { MOCK_SUPPLIERS } from '../../data/suppliers.mock';
import { ProductDto } from '../../../types/dtos/product.dto';
import { handleProductsFeature } from './products-handler.mock';

describe('mock product supplier updates', () => {
    it('updates and returns the selected supplier', () => {
        const product = MOCK_PRODUCTS[0];
        const response = handleProductsFeature({
            method: 'PUT',
            path: `/products/${product.id}`,
            body: { supplierId: MOCK_SUPPLIERS[1].id }
        });

        expect(response?.status).toBe(200);
        expect((response?.body as ProductDto).supplier).toEqual(MOCK_SUPPLIERS[1]);

        const getResponse = handleProductsFeature({
            method: 'GET',
            path: `/products/${product.id}`,
            body: null
        });
        expect((getResponse?.body as ProductDto).supplier).toEqual(MOCK_SUPPLIERS[1]);
    });

    it('rejects an unknown supplier', () => {
        const response = handleProductsFeature({
            method: 'PUT',
            path: `/products/${MOCK_PRODUCTS[0].id}`,
            body: { supplierId: 'unknown' }
        });

        expect(response?.status).toBe(400);
    });
});
