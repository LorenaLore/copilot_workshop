import { routes } from '../../app.routes';
import { authGuard } from '../auth/guards/auth.guard';
import { AppNavRoutes } from '../../core/config/constants/navigation.constants';
import { WishlistRoutes } from './wishlist.routes';

describe('wishlist routing', () => {
    it('is nested under the authenticated layout at wishlist/overview', () => {
        const protectedRoot = routes.find(route => route.children?.some(child => child.path === AppNavRoutes.Wishlist.root));
        expect(protectedRoot?.canActivate).toContain(authGuard);
        expect(WishlistRoutes.some(route => route.path === AppNavRoutes.Wishlist.features.overview && route.loadComponent)).toBe(true);
    });
});
