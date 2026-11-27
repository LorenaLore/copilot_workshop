## 1. Database persistence

- [x] 1.1 Add V3 to create `wishlist_items` with user/product foreign keys, unique
  user/product pairs, save timestamps, listing index, and deletion cascades.
- [x] 1.2 Add the wishlist entity and repository using existing JPA/Lombok patterns.
- [x] 1.3 Test clean and existing database migration paths, duplicate/concurrent
  save protection, and product/user deletion cascades with PostgreSQL.

## 2. Backend ownership and API

- [x] 2.1 Implement principal-to-user resolution and user-scoped list, duplicate-safe
  save, and idempotent removal in the service layer.
- [x] 2.2 Add controller endpoints and product response mapping matching the GET
  200 array and POST/DELETE 204 contracts; document them in OpenAPI.
- [x] 2.3 Configure explicit wishlist authentication and scoped 401 error handling
  while preserving security behavior for unrelated endpoints.
- [x] 2.4 Add service and secured endpoint tests for both roles, cross-user
  isolation, missing/invalid/expired tokens, 404 products, invalid UUIDs,
  duplicates, list ordering, and removal.

## 3. Angular wishlist flow

- [x] 3.1 Add wishlist API types and a signal-based feature service with explicit
  loading/error state, pending mutations, and auth-session cache invalidation.
- [x] 3.2 Add the detail-page save action with saved state, pending protection,
  success/error notifications, and authentication failure handling.
- [x] 3.3 Create the standalone wishlist page with product detail navigation,
  removal actions, loading/error/retry, and empty states using existing UI primitives.
- [x] 3.4 Wire protected routes, `AppNavRoutes`, and the navbar link; register
  any new icons through the existing icon constants.
- [x] 3.5 Add service, detail-page, route, and wishlist-page tests for successful
  flows, errors, saved state, removal failures, and logout/account switching.

## 4. Mock mode

- [x] 4.1 Implement an authenticated, user-partitioned wishlist mock handler and
  wire it into the existing interceptor.
- [x] 4.2 Ensure wishlist mock failures reach Angular's HTTP error path, with tests
  for authentication, duplicate saves, product validation, and user isolation.

## 5. Documentation and acceptance

- [x] 5.1 Update the project feature overview and authenticated API documentation.
- [x] 5.2 Run targeted backend tests with a supported container runtime, targeted
  frontend tests, changed-file lint checks, and backend/frontend builds.
- [ ] 5.3 Verify the real API flow: log in, save from details, revisit the wishlist,
  remove an item, then switch accounts and confirm isolation.
- [ ] 5.4 Verify the same user-facing flow in mock mode and confirm existing
  product, recently viewed, cart, and order behavior is preserved.

## Verification Notes

Backend package build and 12 focused tests passed against an isolated PostgreSQL
schema. Frontend development build, changed-file lint, and 64 targeted tests
passed. A built API instance verified save, duplicate no-op, listing, removal,
cross-account isolation, and unauthenticated 401 responses; temporary verification
entries were removed afterward. Interactive browser acceptance remains pending.
The existing default Flyway location also discovers local seed scripts recursively;
that pre-existing configuration issue was not changed.
