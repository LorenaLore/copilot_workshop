## ADDED Requirements

### Requirement: Require authenticated wishlist access

All `/api/wishlist` and `/api/wishlist/**` endpoints MUST require a valid
authenticated user. Missing, expired, or invalid JWTs MUST produce 401 with an
explicit authentication error. The existing authentication policy for unrelated
endpoints MUST remain unchanged.

#### Scenario: Request without authentication

- **WHEN** a caller requests any wishlist endpoint without a JWT
- **THEN** the response is 401
- **AND** no wishlist data is returned or changed

#### Scenario: Request with invalid or expired authentication

- **WHEN** a caller uses an invalid or expired JWT on a wishlist endpoint
- **THEN** the response is 401
- **AND** no wishlist data is returned or changed

#### Scenario: Authenticated roles

- **WHEN** an authenticated CUSTOMER or ADMIN requests wishlist operations
- **THEN** the user can manage their own wishlist
- **AND** neither role grants access to another user's wishlist

### Requirement: Derive ownership from the authenticated principal

Wishlist operations MUST resolve the user from the authenticated principal
and scope every read and deletion to that user. The API MUST NOT accept a
client-supplied user ID to select a wishlist owner.

#### Scenario: Separate users save the same product

- **GIVEN** users A and B have both saved the same product
- **WHEN** user A removes that product
- **THEN** only user A's association is removed
- **AND** user B still sees the product in their wishlist

#### Scenario: User cannot read another wishlist

- **GIVEN** user B has saved products that user A has not
- **WHEN** user A lists their wishlist
- **THEN** the response contains none of user B's private associations

### Requirement: Protect frontend access and isolate session state

The wishlist page and save action MUST require authentication. Cached wishlist
data MUST be cleared on logout or account change. A wishlist authentication
failure MUST clear stale wishlist state and direct the user to login.

#### Scenario: Signed-out navigation

- **WHEN** a signed-out user navigates directly to `wishlist/overview`
- **THEN** the application redirects to login and does not load a private wishlist

#### Scenario: Authentication expires while saving

- **WHEN** a save request returns 401
- **THEN** the application does not show save success
- **AND** it clears stale wishlist state and directs the user to login

#### Scenario: Switch accounts

- **GIVEN** user A's wishlist was loaded
- **WHEN** user A signs out and user B signs in
- **THEN** user A's cached wishlist is not displayed to user B
- **AND** user B's wishlist is fetched using user B's authentication
