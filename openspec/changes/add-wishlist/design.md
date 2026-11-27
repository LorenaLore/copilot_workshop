## Context

The backend uses Spring MVC, JPA, PostgreSQL, Flyway, and JWT authentication.
`UserDetailsServiceImpl` identifies principals by user email. Spring Security
already requires authentication for non-auth endpoints; wishlist access should
be explicit and tested rather than relying solely on that catch-all rule.

Angular product detail pages load a `ProductDto`. The root layout is protected
by `authGuard`, and the navbar links to feature routes. HTTP authentication uses
the existing token interceptor. Mock mode intercepts requests to `http://mock-api`.

## Goals / Non-Goals

**Goals**

- Persist a separate wishlist for each authenticated user across sessions.
- Allow saving from product details, listing saved products, and removing them.
- Keep repeated saves duplicate-free and successful, as selected by the user.
- Prevent cross-user reads and removals, including direct API requests.
- Keep real and mock frontend flows consistent.

**Non-Goals**

- Guest storage, wishlist sharing, named lists, and changes to cart/order behavior.
- Changes to authentication policy for existing product routes.
- A configurable wishlist size limit or pagination in this initial feature.

## Decisions

### Persistence

Add `wishlist_items` in `V3__create_wishlist_items.sql`, with UUID `id`, required
`user_id` and `product_id` foreign keys, and required `created_at` timestamp.
Enforce a unique constraint on `(user_id, product_id)` and index user-scoped
listing. Foreign keys cascade on user/product deletion so deleted products do
not block administrative deletion or leave dangling entries.

Do not modify V1, V1.1, V2, or V2.1. The new migration must work both for an
existing database and for a clean database, with and without the local profile.

### Ownership and REST contract

Resolve the current user using `Principal.getName()` and the existing user
repository. Never accept a user ID in a wishlist route or request body. Both
CUSTOMER and ADMIN users can manage their own wishlist.

| Method | Path including API context | Success | Behavior |
|---|---|---|---|
| GET | `/api/wishlist` | 200, `ProductDto[]`-compatible response | Current user's products, newest save first; empty list is `[]` |
| POST | `/api/wishlist/{productId}` | 204, no body | Save an existing product; duplicate save is a successful no-op |
| DELETE | `/api/wishlist/{productId}` | 204, no body | Remove only the current user's association; absent association is a successful no-op |

Missing products on POST return 404 using the existing exception response
format. Invalid UUID path values return 400. Repeated POST does not change the
original save timestamp. Sort timestamp ties by item ID for deterministic output.

Enforce duplicate safety in the database, including concurrent saves. Reuse
existing repository patterns; a PostgreSQL conflict-safe insert is appropriate
if an existence check cannot guarantee concurrent idempotence. Do not swallow
unrelated persistence failures.

### Security

Declare `/wishlist` and `/wishlist/**` authenticated in `SecurityConfig` before
the existing catch-all matcher. Missing, expired, or invalid JWTs must return
401 on wishlist endpoints with an explicit authentication error. Use a
wishlist-scoped authentication entry point if needed to preserve existing
endpoint behavior; do not make the catalog public as part of this change.

All repository reads/deletes are scoped to the resolved user. A removal by user
A must never delete user B's association, even when both saved the same product.

### Angular behavior

Create `features/wishlist/` with a signal-based service and a standalone page at
`wishlist/overview`, nested under the authenticated root layout. Add constants
to `AppNavRoutes` and a navbar link.

Product details offer a "Save to wishlist" action after a successful product
load. Successful saves show saved state and a notification; failed saves display
an error and leave the action retryable. Do not record success before the
server confirms it. Disable the action during its request. Reuse the wishlist
list to determine saved state; keep wishlist loading separate from product loading.

The wishlist page shows current product image, name, and price with a detail
navigation action and a removal action. Reuse `clib` primitives, Tailwind
utilities, design tokens, and registered icons rather than adding a UI library.
Show loading, error/retry, and empty states. Keep an item visible when removal
fails; disable only its pending removal action.

Clear wishlist state on logout or user change; never reuse one account's
cached entries for another. Authentication failures on wishlist requests clear
stale wishlist state and route the user to login using existing auth/navigation
helpers. Do not broadly alter unrelated HTTP error behavior.

### Mock mode

Add a wishlist handler receiving the authentication header and resolving the
mock user's identity using existing auth helpers. Maintain distinct in-memory
lists per mock user. Match API status codes, duplicate handling, product
validation, and ownership.

Ensure wishlist 4xx mock responses enter Angular's HTTP error path rather than
being emitted as successful `HttpResponse` values. Keep other handlers' behavior
outside this change unless a shared adjustment is required and covered by tests.

## File-Level Change Map

- `onlineshopapi/src/main/resources/db/migration/V3__create_wishlist_items.sql`
- `onlineshopapi/src/main/java/msg/onlineshopapi/`: wishlist files under
  `model/`, `repository/`, `service/`, `controller/`, and existing DTO/mapping
  reuse as appropriate; `security/SecurityConfig.java` and scoped auth handling.
- `onlineshopapi/src/test/`: service, repository/migration, and secured endpoint
  tests following the repository's Java/JUnit instructions.
- `onlineshopui/src/app/features/wishlist/`: routes, service, page, and tests.
- `onlineshopui/src/app/features/products/components/pages/product-detail-page/`.
- `onlineshopui/src/app/`: app routes, navigation constants, navbar, auth-session
  integration, and wishlist mock handler/interceptor tests.
- `docs/PROJECT.md`: wishlist functionality and authenticated API contract.

## Risks / Trade-offs

- Authentication tests must exercise the real security chain; controller tests
  using security-disabled test configuration cannot prove endpoint protection.
- Singleton frontend state and in-memory mocks can leak data between accounts
  unless reset/partitioned explicitly.
- Concurrent duplicate saves require more than a service-level existence check.
- Product deletion changes the saved list by cascade; the UI reflects that on
  its next load rather than requiring real-time updates.

## Validation

Use JUnit/Mockito for service behavior and PostgreSQL-backed integration tests
for uniqueness, cascade deletion, migration compatibility, and JWT protection.
Cover Angular service/page behavior with the existing Vitest runner, including
realistic HTTP failures and account switching. Use Podman-compatible
Testcontainers configuration where required by the local environment.

## Open Questions

None. The contracts above are proposed implementation decisions for this change.
