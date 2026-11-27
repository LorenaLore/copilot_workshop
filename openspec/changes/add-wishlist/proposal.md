## Why

Authenticated users need a persistent place to save products they are interested
in without adding them to their cart. A wishlist connects database persistence,
authenticated REST endpoints, and product browsing in the Angular frontend.

## What Changes

- Add a database table associating users with saved products, with a uniqueness
  constraint preventing duplicate saves.
- Add authenticated endpoints to list, save, and remove the current user's
  wishlist products. Derive ownership from the authenticated principal, never a
  client-supplied user ID.
- Add a save action to the product detail page and a dedicated, protected
  `wishlist/overview` page with a navigation link and removal actions.
- Support the same per-user behavior in frontend mock mode.

## Capabilities

### New Capabilities

- `wishlist`: Persist, display, and manage the authenticated user's saved products.
- `wishlist-access-control`: Require authentication and isolate wishlist data
  between users.

### Modified Capabilities

- None.

## Impact

- Database: new Flyway migration following V2 and local V2.1; existing migrations
  remain unchanged.
- Backend: wishlist entity, repository, service, controller, DTO mapping,
  Spring Security rules, and tests.
- Frontend: wishlist feature, product detail page, route/navigation constants,
  navbar, user-session state handling, and mock interceptor/handler.
- Documentation: feature overview and API documentation.

## Out of Scope

Guest wishlists, sharing wishlists, multiple named lists, bulk removal,
notifications about prices or stock, and add-to-cart actions on the wishlist page.
Existing catalog authentication and other endpoint security behavior are unchanged.
