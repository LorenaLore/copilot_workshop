# Recently Viewed Products

## Purpose

Help shoppers return to recently visited product detail pages from the catalog.

## Requirements

### Requirement: Track recently viewed products

The application MUST record the ID of a product after its product detail data has loaded successfully. The application MUST persist the history in browser-local storage, place the latest view first, avoid duplicate IDs, and retain no more than ten IDs.

#### Scenario: Visit a product detail page

- **WHEN** a product detail page successfully loads a product
- **THEN** the product ID is added to the front of the recently viewed history
- **AND** the history is persisted in browser-local storage

#### Scenario: View a product that is already in history

- **GIVEN** a product ID is already in the recently viewed history
- **WHEN** that product detail page successfully loads again
- **THEN** the ID appears only once and is moved to the front

#### Scenario: History exceeds ten products

- **GIVEN** the history contains ten product IDs
- **WHEN** another product detail page successfully loads
- **THEN** the new ID is first and only the nine most recently viewed previous IDs are retained

#### Scenario: Product detail fails to load

- **WHEN** a product detail request fails
- **THEN** the failed product ID is not added to the history

### Requirement: Display recent products in the catalog

The product catalog overview page (`products/overview`) MUST show a "Recently viewed" strip above the main product grid when at least one ID in history matches a product in the current catalog data. The strip MUST display no duplicate products, order products most-recent-first, use current catalog product data, and be hidden when it has no products to display. Clicking a strip item MUST navigate to that product's detail page.

#### Scenario: Catalog has matching recent products

- **GIVEN** one or more recently viewed IDs match products in the loaded catalog
- **WHEN** the `products/overview` page is displayed
- **THEN** it shows those products in a "Recently viewed" strip above the product grid
- **AND** the most recently viewed product appears first
- **AND** clicking a product navigates to its detail page

#### Scenario: No recent products are available

- **GIVEN** history is empty or no stored ID matches a product in the loaded catalog
- **WHEN** the `products/overview` page is displayed
- **THEN** the "Recently viewed" strip is hidden

#### Scenario: Duplicate product views

- **GIVEN** a product has been viewed more than once
- **WHEN** the recently viewed strip is displayed
- **THEN** that product appears only once, at the position of its most recent view

#### Scenario: A previously viewed product is no longer in the catalog

- **GIVEN** a product ID is in history but that product is absent from the current catalog data
- **WHEN** the catalog is displayed
- **THEN** that product is omitted from the strip

#### Scenario: Stored history is invalid or unavailable

- **GIVEN** browser-local storage contains malformed history or cannot be read
- **WHEN** the catalog is displayed
- **THEN** the catalog remains usable and does not display invalid history entries
