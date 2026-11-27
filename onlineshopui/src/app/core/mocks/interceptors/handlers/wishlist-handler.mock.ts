import { HttpResponse } from '@angular/common/http';
import { resolveMockUser } from './auth-handler.mock';
import { getMockProducts } from './products-handler.mock';

const wishlists = new Map<string, string[]>();
const validId = /^(?:prod-\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export function handleWishlistFeature(context: {
    method: string;
    path: string;
    authHeader: string | null;
}): HttpResponse<unknown> | null {
    const { method, path, authHeader } = context;
    if (path !== '/wishlist' && !path.startsWith('/wishlist/')) return null;

    const user = resolveMockUser(authHeader);
    if (!user) {
        return new HttpResponse({
            status: 401,
            statusText: 'Unauthorized',
            body: { message: 'Authentication required' }
        });
    }

    const products = getMockProducts();
    const ids = (wishlists.get(user.id) ?? []).filter(id => products.some(p => p.id === id));
    wishlists.set(user.id, ids);
    if (method === 'GET' && path === '/wishlist') {
        return new HttpResponse({
            status: 200,
            body: ids.map(id => products.find(product => product.id === id))
        });
    }
    const id = path.slice('/wishlist/'.length);
    if ((method === 'POST' || method === 'DELETE') && path.startsWith('/wishlist/')) {
        if (!validId.test(id)) {
            return new HttpResponse({
                status: 400,
                statusText: 'Bad Request',
                body: { message: 'Invalid product ID' }
            });
        }
        if (method === 'POST') {
            if (!products.some(product => product.id === id)) {
                return new HttpResponse({
                    status: 404,
                    statusText: 'Not Found',
                    body: { message: 'Product not found' }
                });
            }
            if (!ids.includes(id)) wishlists.set(user.id, [id, ...ids]);
        } else {
            wishlists.set(user.id, ids.filter(item => item !== id));
        }
        return new HttpResponse({ status: 204 });
    }
    return null;
}
