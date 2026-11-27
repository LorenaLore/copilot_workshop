import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../../../clib/components/card/card.component';
import { SpinnerComponent } from '../../../clib/components/spinner/spinner.component';
import { AppNavRoutes } from '../../../core/config/constants/navigation.constants';
import { WishlistService } from '../services/wishlist.service';

@Component({
    selector: 'app-wishlist-page',
    standalone: true,
    imports: [RouterLink, CardComponent, SpinnerComponent],
    templateUrl: './wishlist-page.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WishlistPageComponent implements OnInit {
    readonly wishlist = inject(WishlistService);
    readonly productsRoot = AppNavRoutes.Products.root;

    ngOnInit(): void {
        this.wishlist.load(true);
    }

    handleImageError(event: Event): void {
        (event.target as HTMLImageElement).src = '/placeholder-product.svg';
    }
}
