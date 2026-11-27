import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { EnvironmentConfig } from '../../../core/types/providers/environment-config';
import { ProductDto } from '../../../core/types/dtos/product.dto';
import { NotificationsService } from '../../../core/services/notifications.service';
import { AuthService } from '../../auth/services/auth.service';

type WishlistState = {
    session: number;
    products: ProductDto[];
    loaded: boolean;
    loading: boolean;
    error: string | null;
    mutationError: string | null;
    pending: string[];
};

@Injectable({ providedIn: 'root' })
export class WishlistService {
    private readonly http = inject(HttpClient);
    private readonly auth = inject(AuthService);
    private readonly notifications = inject(NotificationsService);
    private readonly url = `${inject(EnvironmentConfig).apiUrl}/wishlist`;
    private readonly state = signal<WishlistState>(this.emptyState());
    private loadSequence = 0;

    private readonly current = computed(() => {
        const state = this.state();
        return state.session === this.auth.session() && this.auth.isAuthenticated()
            ? state
            : this.emptyState();
    });
    readonly products = computed(() => this.current().products);
    readonly loading = computed(() => this.current().loading);
    readonly error = computed(() => this.current().error);
    readonly mutationError = computed(() => this.current().mutationError);

    constructor() {
        effect(() => {
            const session = this.auth.session();
            if (untracked(() => this.state().session) !== session) {
                this.loadSequence++;
                this.state.set(this.emptyState());
            }
        });
    }

    isSaved(id: string): boolean {
        return this.products().some(product => product.id === id);
    }

    isPending(id: string): boolean {
        return this.current().pending.includes(id);
    }

    load(force = false): void {
        if (!this.prepare()) return;
        const state = this.state();
        if (state.loading || (state.loaded && !force)) return;
        const session = state.session;
        const sequence = ++this.loadSequence;
        this.state.update(value => ({ ...value, loading: true, error: null }));
        this.http.get<ProductDto[]>(this.url).subscribe({
            next: products => {
                if (!this.isCurrent(session) || sequence !== this.loadSequence) return;
                this.state.update(value => ({ ...value, products, loaded: true, loading: false }));
            },
            error: error => {
                if (!this.isCurrent(session) || sequence !== this.loadSequence) return;
                if (this.handleAuthError(error)) return;
                this.state.update(value => ({
                    ...value,
                    loading: false,
                    error: 'Could not load your wishlist. Please try again.'
                }));
            }
        });
    }

    save(product: ProductDto): void {
        if (!this.prepare() || this.isPending(product.id) || this.isSaved(product.id)) return;
        const session = this.state().session;
        this.setPending(product.id);
        this.http.post<void>(`${this.url}/${encodeURIComponent(product.id)}`, null).subscribe({
            next: () => {
                if (!this.isCurrent(session)) return;
                const reload = this.state().loading;
                this.invalidateLoad();
                this.state.update(value => ({
                    ...value,
                    products: [product, ...value.products.filter(item => item.id !== product.id)],
                    pending: value.pending.filter(id => id !== product.id)
                }));
                this.notifications.notifySuccess({
                    title: 'Saved to wishlist',
                    message: `${product.name} was saved to your wishlist.`
                });
                if (reload) this.load(true);
            },
            error: error => this.mutationFailed(session, product.id, error, 'save')
        });
    }

    remove(id: string): void {
        if (!this.prepare() || this.isPending(id)) return;
        const session = this.state().session;
        this.setPending(id);
        this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}`).subscribe({
            next: () => {
                if (!this.isCurrent(session)) return;
                const reload = this.state().loading;
                this.invalidateLoad();
                this.state.update(value => ({
                    ...value,
                    products: value.products.filter(product => product.id !== id),
                    pending: value.pending.filter(item => item !== id)
                }));
                if (reload) this.load(true);
            },
            error: error => this.mutationFailed(session, id, error, 'remove')
        });
    }

    private emptyState(): WishlistState {
        return {
            session: this.auth.session(),
            products: [],
            loaded: false,
            loading: false,
            error: null,
            mutationError: null,
            pending: []
        };
    }

    private prepare(): boolean {
        if (this.state().session !== this.auth.session()) {
            this.loadSequence++;
            this.state.set(this.emptyState());
        }
        return this.auth.isAuthenticated();
    }

    private isCurrent(session: number): boolean {
        return this.auth.isAuthenticated() && this.auth.session() === session;
    }

    private setPending(id: string): void {
        this.state.update(value => ({
            ...value,
            pending: [...value.pending, id],
            mutationError: null
        }));
    }

    private invalidateLoad(): void {
        this.loadSequence++;
        this.state.update(value => ({ ...value, loading: false }));
    }

    private mutationFailed(session: number, id: string, error: unknown, action: string): void {
        if (!this.isCurrent(session)) return;
        if (this.handleAuthError(error)) return;
        const message = `Could not ${action} this product. Please try again.`;
        this.state.update(value => ({
            ...value,
            pending: value.pending.filter(item => item !== id),
            mutationError: message
        }));
        this.notifications.notifyError({ title: 'Wishlist error', message });
    }

    private handleAuthError(error: unknown): boolean {
        if (error instanceof HttpErrorResponse && error.status === 401) {
            this.loadSequence++;
            this.auth.logout();
            this.state.set(this.emptyState());
            return true;
        }
        return false;
    }
}
