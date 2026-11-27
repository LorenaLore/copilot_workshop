## ADDED Requirements

### Requirement: Persist unique saved products

The application MUST persist wishlist associations between users and products
in a new database table. Each user/product pair MUST occur at most once,
including under concurrent save requests.

#### Scenario: Save a product

- **GIVEN** a user is authenticated and the product exists
- **WHEN** the user sends POST `/api/wishlist/{productId}`
- **THEN** the user's association with the product is persisted
- **AND** the response is 204 with no body

#### Scenario: Save a product twice

- **GIVEN** the user has already saved a product
- **WHEN** the user saves it again, including through concurrent requests
- **THEN** the wishlist contains only one association with that product
- **AND** the request succeeds with 204
- **AND** the original save timestamp is unchanged

#### Scenario: Save a missing product

- **WHEN** an authenticated user saves a product ID that does not exist
- **THEN** the response is 404 and no wishlist entry is created

#### Scenario: Supply an invalid product ID

- **WHEN** an authenticated user supplies a non-UUID product ID to a save or removal endpoint
- **THEN** the response is 400 and no wishlist data changes

### Requirement: List saved products

GET `/api/wishlist` MUST return only the current user's saved products as a JSON
array compatible with the existing product response DTO. Products MUST be
ordered by newest save first, with deterministic ordering for timestamp ties.

#### Scenario: List a populated wishlist

- **GIVEN** the user has saved multiple products
- **WHEN** the user loads their wishlist
- **THEN** the response is 200 with those products, newest save first
- **AND** it includes their current product data without duplicates

#### Scenario: List an empty wishlist

- **GIVEN** the user has no saved products
- **WHEN** GET `/api/wishlist` is requested
- **THEN** the response is 200 with `[]`

#### Scenario: Return in a later session

- **GIVEN** a user saved products before signing out
- **WHEN** the same user signs in again and loads their wishlist
- **THEN** their saved products are still available

### Requirement: Remove saved products

DELETE `/api/wishlist/{productId}` MUST remove only the current user's
association and return 204 with no body. Removing an absent association MUST
also return 204 without affecting other users or deleting the product.

#### Scenario: Remove a saved product

- **WHEN** a user removes a product from their wishlist
- **THEN** that association is deleted
- **AND** the product remains in the catalog and other users' wishlists

#### Scenario: Remove an absent product

- **GIVEN** the current user has no association with the supplied product ID
- **WHEN** the user removes it
- **THEN** the response is 204 and no other user's data changes

#### Scenario: Administrator deletes a catalog product

- **GIVEN** users have saved a product
- **WHEN** the product is deleted from the catalog
- **THEN** its wishlist associations are deleted automatically
- **AND** subsequent wishlist responses omit it

### Requirement: Save from the product detail page

Authenticated users MUST be able to save successfully loaded products from
their detail page. The action MUST show pending, saved, and failure states.

#### Scenario: Save from product details

- **WHEN** a signed-in user clicks "Save to wishlist" on a loaded product
- **THEN** the application sends the authenticated save request
- **AND** disables repeated clicks while it is pending
- **AND** shows saved state and a success notification only after success

#### Scenario: Saving fails

- **WHEN** the save request fails
- **THEN** the application shows an error without claiming success
- **AND** the save action becomes retryable

#### Scenario: View an already saved product

- **GIVEN** a product is in the current user's wishlist
- **WHEN** its detail page loads and wishlist data is available
- **THEN** the action displays saved state

### Requirement: Provide a dedicated wishlist page

The application MUST provide a navbar link and protected route at
`wishlist/overview`, showing saved product images, names, prices, detail
navigation, and removal actions, with loading, empty, and error/retry states.

#### Scenario: Open the wishlist page

- **WHEN** a signed-in user opens `wishlist/overview`
- **THEN** their saved products are loaded and displayed
- **AND** clicking a product's detail action navigates to that product's detail page

#### Scenario: Wishlist is empty

- **WHEN** the user has no saved products
- **THEN** the page displays an empty-state message instead of product items

#### Scenario: Loading fails

- **WHEN** the wishlist request fails
- **THEN** the page displays an error and a retry action
- **AND** it does not present the failure as an empty wishlist

#### Scenario: Remove from the page

- **WHEN** the user clicks an item's removal action
- **THEN** its removal control is disabled during the request
- **AND** the item disappears only after successful removal

#### Scenario: Removal fails

- **WHEN** an item's removal request fails
- **THEN** the item remains visible and an error is displayed
- **AND** the removal action becomes retryable

### Requirement: Support wishlist behavior in mock mode

Mock mode MUST reproduce wishlist authentication, per-user ownership, success
and error status codes, duplicate handling, and removal behavior.

#### Scenario: Different mock users save products

- **WHEN** different authenticated mock users manage their wishlists
- **THEN** each sees and changes only their own saved products

#### Scenario: A mock wishlist request fails

- **WHEN** a wishlist mock returns a 4xx status
- **THEN** Angular receives an HTTP error, not a successful response
