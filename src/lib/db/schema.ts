export const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS source_connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations (id),
    source text NOT NULL,
    partner text NOT NULL DEFAULT '',
    method text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, source, partner)
  )`,
  `CREATE TABLE IF NOT EXISTS sync_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id uuid NOT NULL REFERENCES source_connections (id),
    started_at timestamptz NOT NULL DEFAULT now(),
    finished_at timestamptz,
    status text NOT NULL,
    row_count integer NOT NULL DEFAULT 0,
    message text
  )`,
  `CREATE INDEX IF NOT EXISTS sync_runs_connection_idx
    ON sync_runs (connection_id, started_at DESC)`,
  `CREATE TABLE IF NOT EXISTS raw_payloads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_run_id uuid NOT NULL REFERENCES sync_runs (id),
    organization_id uuid NOT NULL REFERENCES organizations (id),
    source text NOT NULL,
    partner text NOT NULL DEFAULT '',
    kind text NOT NULL,
    external_id text,
    payload jsonb NOT NULL,
    received_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations (id),
    source text NOT NULL,
    external_id text NOT NULL,
    name text NOT NULL,
    address text,
    region text,
    industry_type text,
    customer_type text,
    ordering_method text,
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, source, external_id)
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations (id),
    source text NOT NULL,
    external_id text NOT NULL,
    account_id uuid REFERENCES accounts (id),
    ordering_method text NOT NULL,
    direction text NOT NULL,
    ship_date date,
    revenue numeric(14, 2),
    currency text,
    tags text NOT NULL DEFAULT '',
    exclude_from_direct boolean NOT NULL DEFAULT false,
    partner text NOT NULL DEFAULT '',
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, source, external_id)
  )`,
  `CREATE INDEX IF NOT EXISTS orders_method_idx
    ON orders (organization_id, ordering_method, direction)`,
  `CREATE TABLE IF NOT EXISTS order_lines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    sku text,
    product_type text,
    quantity numeric(14, 3),
    revenue numeric(14, 2)
  )`,
  `CREATE INDEX IF NOT EXISTS order_lines_order_id_idx ON order_lines (order_id)`,
  `CREATE TABLE IF NOT EXISTS shipments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations (id),
    source text NOT NULL,
    external_id text NOT NULL,
    order_external_id text,
    status text,
    delivered_at timestamptz,
    carrier text,
    tracking_number text,
    relevant_until date,
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, source, external_id)
  )`,
  `INSERT INTO organizations (name)
   VALUES ('Leilo')
   ON CONFLICT (name) DO NOTHING`,
];
