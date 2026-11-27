# Product Update Suppliers

## Purpose

Provide supplier selection and preserve supplier assignments when editing products.

## Requirements

### Requirement: Supply supplier options to the product update form

The product update page MUST load suppliers using the existing supplier service and pass the resulting list to the product form's required `suppliers` input. Supplier loading failures MUST be visible to the user and retryable.

#### Scenario: Suppliers load successfully

- **WHEN** an administrator opens a product update page
- **THEN** the page loads the supplier list
- **AND** passes the list to the product form
- **AND** the form displays the available supplier options

#### Scenario: Supplier loading fails

- **WHEN** the supplier list cannot be loaded
- **THEN** the page displays an error and offers a retry
- **AND** retry attempts to load the suppliers again

#### Scenario: The frontend compiles

- **WHEN** the Angular frontend is built
- **THEN** the product update template satisfies the product form's required `suppliers` input

### Requirement: Preserve and update a product's supplier

The product update form MUST initialize the supplier selection from the loaded product and include the selected supplier ID in the update request. The existing required supplier validation MUST remain in effect.

#### Scenario: Edit a product with a supplier

- **GIVEN** a product has an assigned supplier
- **WHEN** the product update form is displayed
- **THEN** the product's supplier is selected
- **AND** submitting the form includes the selected supplier ID in the update request

#### Scenario: Change a product's supplier

- **GIVEN** a product update form has loaded supplier options
- **WHEN** an administrator selects a different supplier and submits a valid form
- **THEN** the update request contains the newly selected supplier ID

#### Scenario: Edit a product without a supplier

- **GIVEN** a product has no assigned supplier
- **WHEN** the product update form is displayed
- **THEN** no supplier is selected
- **AND** the form requires a supplier selection before it can be submitted
