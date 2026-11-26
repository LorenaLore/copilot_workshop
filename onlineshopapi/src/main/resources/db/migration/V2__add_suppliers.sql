CREATE TABLE suppliers
(
    id      UUID         PRIMARY KEY,
    name    VARCHAR(255) NOT NULL,
    contact VARCHAR(255)
);

ALTER TABLE products
    ADD COLUMN supplier_id UUID REFERENCES suppliers (id);

