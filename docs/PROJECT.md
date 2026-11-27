# Online Shop

This project represents a small-scale e-commerce application.

## Local Database Migrations

The `local` backend profile enables development seed migrations. V1.1 contains
the original product seed data; V2 creates the supplier schema, and V2.1 seeds
suppliers and assigns them to existing products without replacing assigned suppliers.
Do not edit already-applied migrations: add a later migration for new changes.

## User Roles

The application supports two user roles:

- **Customer** - Standard user with shopping capabilities
- **Administrator** - User with management privileges

## Features

### Customer Features

- **Product Catalog**
    - Browse products with essential details (name, price, description, etc.)
    - View detailed product information on dedicated product pages
- **User Authentication**
    - Register a new account
    - Sign in and sign out securely
- **Shopping Cart**
    - Add products to cart from catalog or product detail pages
    - Modify item quantities or remove products from cart
- **Wishlist**
    - Save products from their detail pages while signed in
    - View saved products at `wishlist/overview`, newest saves first
    - Remove saved products without deleting them from the catalog
    - Saved products belong to the signed-in account and persist across sessions
- **Order Management**
    - Place orders from current cart items
    - Review order history and view detailed order information

### Administrator Features

- Includes all customer features
- **Product Management**
    - Create new products
    - Update existing product information
    - Delete products from the catalog
- **Order Administration**
    - Access and review orders from all users

## Wishlist API

All wishlist endpoints require a valid bearer JWT. Ownership is derived from
the authenticated user; clients do not supply a user ID. Both customer and
administrator accounts manage only their own wishlist.

| Method | Endpoint | Result |
|---|---|---|
| GET | `/api/wishlist` | 200 with an array of current product details; an empty wishlist returns `[]` |
| POST | `/api/wishlist/{productId}` | 204; saving an already-saved product is a successful no-op |
| DELETE | `/api/wishlist/{productId}` | 204; removing an absent association is a successful no-op |

Missing or invalid authentication returns 401. Saving a missing product returns
404; malformed product UUIDs return 400. Deleting a catalog product also removes
its wishlist associations. V3 adds the wishlist table without changing earlier
migrations.
