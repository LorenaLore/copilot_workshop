CREATE TABLE wishlist_items
(
    id         UUID      PRIMARY KEY,
    user_id    UUID      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    product_id UUID      NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wishlist_user_product UNIQUE (user_id, product_id)
);

CREATE INDEX idx_wishlist_user_created ON wishlist_items (user_id, created_at DESC, id DESC);
