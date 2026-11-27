## 1. Recently viewed history

- [x] 1.1 Add a product-feature service to read, validate, and update a bounded, deduplicated list of up to ten product IDs in browser-local storage.
- [x] 1.2 Record a product ID after successful product loading on the detail page.
- [x] 1.3 Add unit tests for ordering, deduplication, the ten-product limit, malformed storage, and unavailable storage.

## 2. Catalog strip

- [x] 2.1 Derive the recently viewed products from stored IDs and the current catalog product list.
- [x] 2.2 Render a responsive, horizontally browsable "Recently viewed" strip on `products/overview`, above the product grid; hide it when empty and make each item navigate to its detail page.
- [x] 2.3 Add tests for ten-item ordering, duplicate omission, hidden empty state, missing catalog products, and detail-page navigation.

## 3. Restore product update supplier integration

- [x] 3.1 Load suppliers on the product update page, bind them to the required product-form input, and handle supplier loading errors and retry.
- [x] 3.2 Populate the existing supplier selection and submit the selected supplier ID when updating a product, including products that initially have no supplier.
- [x] 3.3 Add product update page tests for loading, supplier selection, update payload, and supplier loading failure and retry.
- [x] 3.4 Update existing product service test fixtures and create request data to match the supplier-aware DTO and request types.
- [x] 3.5 Update the mock product handler to persist supplier changes and test the mock update flow.

## 4. Verification

- [x] 4.1 Run the frontend development build to confirm the Angular template compiles without the missing `suppliers` input error.
- [x] 4.2 Run the targeted product feature tests and lint checks, including recently viewed products and supplier update flows.
- [ ] 4.3 Run the production build once the local certificate issue preventing Google Fonts retrieval is resolved.

## Archive Notes

Archived on 2026-11-26 with user approval. The user confirmed that the UI loading
issue is resolved and the application works. Production-build verification remains
outstanding; the development build and targeted tests passed.
