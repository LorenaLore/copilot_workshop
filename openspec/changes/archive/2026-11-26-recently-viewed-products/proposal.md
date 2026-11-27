## Why

Shoppers who browse several product detail pages currently have no quick way to return to an item they viewed earlier. 
A recently viewed strip on the catalog page makes those products easy to find again.
The existing product update page also omits a required supplier input, preventing the frontend from compiling and blocking verification of the strip.

## What Changes

- Record successfully viewed product IDs in browser-local storage, most-recent first, without duplicates and capped at ten products.
- Show matching products in a horizontally browsable "Recently viewed" strip on the product catalog page 
(`products/overview`), above the catalog grid.
- Make each strip item navigate to that product's detail page.
- Reuse current catalog product data for the strip so removed or unavailable products are not shown.
- Restore the product update form's supplier integration so the frontend compiles and supplier edits work correctly.

## Capabilities

### New Capabilities
- `recently-viewed-products`: Track and display a shopper's recent product detail views on the product catalog page.
- `product-update-suppliers`: Load, display, and preserve the supplier selection when editing a product.

### Modified Capabilities
- None.

## Impact

- Frontend product detail page, catalog page, product update form, and related services and tests.
- No backend, API, database, or authentication changes.
