## Context

The Angular product detail page loads a `ProductDto` by route ID. The catalog page separately loads the current product list and renders `ProductCardComponent` instances. The feature can remain entirely in the browser and does not need a backend contract.

## Goals / Non-Goals

**Goals**
- Make products visited on their detail page discoverable from the catalog.
- Keep the latest visit first, omit duplicates, and bound persisted history to ten products.
- Display current product data and omit products no longer present in the catalog.
- Restore the product update page's required supplier input and supplier editing flow.

**Non-Goals**
- Syncing history across devices or accounts.
- Adding a control to clear history.
- Tracking catalog impressions or products that were not opened on a detail page.

## Decisions

- Persist only product IDs in `localStorage`, scoped to the browser profile. This avoids persisting stale product details; the catalog resolves IDs against its current product list.
- Record a product only after its detail request succeeds. Update the ordered ID list by removing any previous occurrence, prepending the ID, and keeping at most ten IDs.
- Add the strip to the product catalog overview page (`products/overview`), above the existing product grid. Render it only when at least one stored ID resolves to a product in the loaded catalog.
- Make each strip item navigate to its product detail page when clicked. The strip is for navigation, not a second set of product-card actions.
- Load suppliers on the product update page using the existing `SupplierService` and pass its supplier list to the required `ProductFormComponent` input. Populate the form with the product's supplier ID and include the selected ID in the update request. Surface supplier loading failures and allow retry rather than silently presenting an unusable selector.
- Update product service and page test fixtures to match the existing supplier-aware DTOs and request types, without changing backend contracts.

## Risks / Trade-offs

- Browser-local history is shared by users of the same browser profile and is not available on another device. This is acceptable for a small client-side convenience feature; account-scoped history is out of scope.
- `localStorage` may be unavailable or contain malformed data. The implementation should handle invalid stored IDs safely and keep the catalog usable without history.
- The strip may contain fewer than ten entries when products have been deleted or are absent from the current catalog response.

## Migration Plan

No data migration is required. Existing users start with an empty history; new detail-page visits populate it.

## Open Questions

None.
