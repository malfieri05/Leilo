export const DSD_CAN_PRICE = 2.99;
export const DSD_STICK_PRICE = 1.5;
export const DSD_CANS_PER_CASE = 12;
export const DSD_CANS_PER_4PACK_CASE = 24;

export function dsdThroughPredicate() {
  return `o.source IN ('dsd', 'encompass')
    AND o.direction = 'through'
    AND o.revenue > 0`;
}

export function partnerFilterSql(partner: string | null, params: unknown[]) {
  if (!partner) return "";
  params.push(partner);
  return `AND o.partner = $${params.length}`;
}

/** Dollars win. Otherwise sticks are $1.50 each, and cases become cans at $2.99. */
export function dsdLineRevenue(input: {
  dollars: number | null;
  cases: number | null;
  units: number | null;
  sku: string | null;
  title: string | null;
}) {
  if (input.dollars !== null) return roundMoney(input.dollars);
  const blob = `${input.sku ?? ""} ${input.title ?? ""}`;
  if (isStick(blob)) {
    const count = input.units ?? input.cases;
    if (count === null) return null;
    return roundMoney(count * DSD_STICK_PRICE);
  }
  if (input.cases !== null) {
    const cans = input.cases * (isFourPack(blob) ? DSD_CANS_PER_4PACK_CASE : DSD_CANS_PER_CASE);
    return roundMoney(cans * DSD_CAN_PRICE);
  }
  if (input.units !== null) return roundMoney(input.units * DSD_CAN_PRICE);
  return null;
}

function isStick(blob: string) {
  return /\bsticks?\b/i.test(blob) || /-stick\b/i.test(blob);
}

function isFourPack(blob: string) {
  return /\b4\s?-?\s?packs?\b/i.test(blob) || /\b4pk\b/i.test(blob);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
