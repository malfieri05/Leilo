export const kpis = [
  { label: "Net revenue (MTD)", value: "$428k", delta: "+12.4% vs last month", tone: "up" as const },
  { label: "Cases sold (MTD)", value: "18,240", delta: "+8.1% vs last month", tone: "up" as const },
  { label: "New doors opened", value: "46", delta: "Target 60", tone: "flat" as const },
  { label: "Pipeline coverage", value: "2.1x", delta: "Below 3.0x goal", tone: "down" as const },
];

export const weeklyTrend = [42, 48, 45, 61, 58, 72, 68, 81, 76, 90, 88, 94];

export const flavorMix = [
  { name: "Lime Margarita", share: 22, color: "bg-[#c5d86a]" },
  { name: "Tangerine Mango", share: 18, color: "bg-mango" },
  { name: "Raspberry Hibiscus", share: 16, color: "bg-hibiscus" },
  { name: "Piña Colada", share: 15, color: "bg-[#f0d7a4]" },
  { name: "Moscow Mule", share: 14, color: "bg-[#8fb9a8]" },
  { name: "Blackberry Orange", share: 15, color: "bg-[#c4a0c8]" },
];

export const accounts = [
  { name: "Whole Foods Market — Northeast", type: "Retail", status: "Active", cases: 2140, owner: "A. Chen" },
  { name: "Total Wine & More — Southeast", type: "Retail", status: "Expanding", cases: 1860, owner: "M. Ortiz" },
  { name: "Sprouts Farmers Market", type: "Retail", status: "Active", cases: 1320, owner: "A. Chen" },
  { name: "Equinox Clubs — NYC", type: "On-prem", status: "Pilot", cases: 410, owner: "J. Hale" },
  { name: "GoPuff — National", type: "E-comm", status: "Active", cases: 980, owner: "M. Ortiz" },
  { name: "Kroger — Midwest", type: "Retail", status: "In pitch", cases: 0, owner: "R. Patel" },
];

export const pipeline = [
  { account: "Kroger Midwest", stage: "Proposal", value: "$210k", close: "Nov 22" },
  { account: "Target Mid-Atlantic", stage: "Discovery", value: "$340k", close: "Dec 12" },
  { account: "H-E-B Texas", stage: "Negotiation", value: "$180k", close: "Nov 30" },
  { account: "Wegmans", stage: "Verbal yes", value: "$95k", close: "Nov 18" },
  { account: "BevMo West", stage: "New", value: "$70k", close: "Jan 8" },
];

export const territories = [
  { region: "Northeast", revenue: "$118k", doors: 142, velocity: "high" },
  { region: "Southeast", revenue: "$96k", doors: 121, velocity: "high" },
  { region: "West", revenue: "$88k", doors: 98, velocity: "med" },
  { region: "Midwest", revenue: "$72k", doors: 76, velocity: "med" },
  { region: "Southwest", revenue: "$54k", doors: 61, velocity: "low" },
];

export const team = [
  { name: "Avery Chen", role: "Regional Manager", region: "Northeast", quota: "112%" },
  { name: "Maya Ortiz", role: "Regional Manager", region: "Southeast", quota: "104%" },
  { name: "Jules Hale", role: "On-prem lead", region: "NYC / National", quota: "91%" },
  { name: "Ravi Patel", role: "Key accounts", region: "Midwest", quota: "78%" },
  { name: "Sam Brooks", role: "Distributor ops", region: "West", quota: "—" },
];
