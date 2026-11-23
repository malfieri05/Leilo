export const primaryNav = [
  { href: "/sales", label: "Sales Overview", hint: "Revenue by channel" },
  { href: "/kehe", label: "KEHE", hint: "Fill rate and sales-through" },
  { href: "/direct", label: "Direct", hint: "Wholesale orders" },
  { href: "/dsd", label: "DSD", hint: "Partner deliveries" },
  { href: "/leads", label: "Lead Generation", hint: "Prospects and outreach" },
  { href: "/spins", label: "SPINS Data", hint: "Scan dollars and units" },
  { href: "/brand", label: "Leilo Brand Kit / Marketing Materials", hint: "Logos and sell sheets" },
  { href: "/skus", label: "SKU Data / Information", hint: "Packs, cases, prices" },
  { href: "/promos", label: "Promotion Calendar", hint: "Windows and channels" },
  { href: "/unfi", label: "UNFI", hint: "Same shape as KEHE" },
  { href: "/tracking", label: "Sample / Order Tracking", hint: "Shipments and samples" },
  { href: "/locator", label: "Auto-Updating Store Locator", hint: "Leilo locations sheet" },
] as const;

export const workspaceNav = [
  { href: "/sources", label: "Data Sources", hint: "Connections and syncs" },
  { href: "/map", label: "Map", hint: "Doors and coverage" },
  { href: "/pipeline", label: "Pipeline", hint: "Deals and openings" },
  { href: "/accounts", label: "Accounts", hint: "Retail and on-prem" },
  { href: "/products", label: "Products", hint: "SKUs and mix" },
  { href: "/territories", label: "Territories", hint: "Regions and velocity" },
  { href: "/team", label: "Team", hint: "Reps and coverage" },
] as const;
