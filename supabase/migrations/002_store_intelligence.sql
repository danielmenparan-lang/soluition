-- Store Intelligence: Shopify Admin order + catalog snapshots

CREATE TABLE shop_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  shopify_order_id BIGINT NOT NULL,
  order_number TEXT,
  customer_id BIGINT,
  customer_orders_count INT DEFAULT 1,
  total_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  subtotal_price DECIMAL(12, 2) DEFAULT 0,
  total_tax DECIMAL(12, 2) DEFAULT 0,
  total_discounts DECIMAL(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  financial_status TEXT,
  fulfillment_status TEXT,
  line_item_count INT DEFAULT 0,
  source_name TEXT,
  landing_site TEXT,
  referring_site TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  country_code TEXT,
  is_returning_customer BOOLEAN DEFAULT FALSE,
  ordered_at TIMESTAMPTZ NOT NULL,
  raw_line_items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, shopify_order_id)
);

CREATE INDEX idx_shop_orders_shop ON shop_orders(shop_id);
CREATE INDEX idx_shop_orders_ordered ON shop_orders(shop_id, ordered_at DESC);
CREATE INDEX idx_shop_orders_customer ON shop_orders(shop_id, customer_id);
CREATE INDEX idx_shop_orders_financial ON shop_orders(shop_id, financial_status);

CREATE TABLE shop_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  shopify_product_id BIGINT NOT NULL,
  title TEXT,
  product_type TEXT,
  vendor TEXT,
  status TEXT,
  total_inventory INT DEFAULT 0,
  variant_count INT DEFAULT 0,
  price_min DECIMAL(12, 2) DEFAULT 0,
  price_max DECIMAL(12, 2) DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, shopify_product_id)
);

CREATE INDEX idx_shop_products_shop ON shop_products(shop_id);
CREATE INDEX idx_shop_products_status ON shop_products(shop_id, status);
