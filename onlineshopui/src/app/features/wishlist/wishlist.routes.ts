import { Routes } from '@angular/router';
import { AppNavRoutes } from '../../core/config/constants/navigation.constants';

export const WishlistRoutes: Routes = [
    {
        path: AppNavRoutes.Wishlist.features.overview,
        loadComponent: () =>
            import('./components/wishlist-page.component').then(m => m.WishlistPageComponent)
    },
    { path: '', redirectTo: AppNavRoutes.Wishlist.features.overview, pathMatch: 'full' }
];
