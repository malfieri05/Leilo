export type StockFlag = "red" | "orange" | "yellow" | "green" | "none";

export type StockInput = {
  rowKind: "sku" | "subtotal";
  qtyOnHand: number;
  qtyOnPo: number;
  weeksOnHand: number;
  weeksOnPo: number;
  qtyOnSalesOrder: number;
};

export type StockClassification = {
  flag: StockFlag;
  nearMiss: boolean;
  combinedWeeks: number;
  impliedWeekly: number | null;
  salesOrderWeeks: number | null;
  note: string | null;
  reportingGap: boolean;
  weeksCopiedFromQty: boolean;
};

export function classifyKeheStockRow(input: StockInput): StockClassification {
  const combinedWeeks = input.weeksOnHand + input.weeksOnPo;
  const supply = input.qtyOnHand + input.qtyOnPo;
  const impliedWeekly = combinedWeeks > 0 ? supply / combinedWeeks : null;
  const salesOrderWeeks =
    impliedWeekly && impliedWeekly > 0 ? input.qtyOnSalesOrder / impliedWeekly : null;
  const reportingGap = input.weeksOnHand === 0 && input.weeksOnPo === 0 && supply > 0;
  const weeksCopiedFromQty = input.weeksOnHand > 0 && input.weeksOnHand === input.qtyOnHand;
  const demandTest =
    impliedWeekly !== null && impliedWeekly > 0 && input.qtyOnSalesOrder > 2 * impliedWeekly;
  const weeksGate = input.weeksOnHand > 8 || input.weeksOnPo > 8;

  let flag: StockFlag = "none";
  if (combinedWeeks < 3) flag = "red";
  else if (combinedWeeks < 5) flag = "orange";
  else if (combinedWeeks < 7) flag = "yellow";
  else if (input.rowKind === "sku" && weeksGate && demandTest) flag = "green";

  const nearMiss = input.rowKind === "sku" && flag !== "green" && demandTest && !weeksGate;

  return {
    flag,
    nearMiss,
    combinedWeeks,
    impliedWeekly,
    salesOrderWeeks,
    note: stockNote({ ...input, flag, combinedWeeks, reportingGap, salesOrderWeeks, supply }),
    reportingGap,
    weeksCopiedFromQty,
  };
}

function stockNote(input: {
  flag: StockFlag;
  qtyOnHand: number;
  qtyOnPo: number;
  qtyOnSalesOrder: number;
  combinedWeeks: number;
  reportingGap: boolean;
  salesOrderWeeks: number | null;
  supply: number;
}) {
  if (input.flag === "green") {
    const weeks = input.salesOrderWeeks === null ? "n/a" : input.salesOrderWeeks.toFixed(1);
    return `Sales order is ${weeks} weeks of implied run rate.`;
  }
  if (input.flag !== "red") return null;
  if (input.qtyOnHand === 0 && input.qtyOnPo === 0) {
    return input.qtyOnSalesOrder > 0
      ? "True stockout. Open sales order with nothing on hand and nothing on PO."
      : "True stockout. Nothing on hand and nothing on PO.";
  }
  if (input.reportingGap) {
    return "Reporting gap. Zero weeks reported despite units on hand or on PO. Unverified, not a stockout.";
  }
  if (input.combinedWeeks > 0) return "Genuine low stock. Weeks are real and thin.";
  return "Low combined weeks.";
}

export type IntegrityWarning = { code: string; message: string };

export function stockIntegrityWarnings(input: {
  rows: (StockInput & { dcCode: string; upc: string })[];
  prior?: (StockInput & { dcCode: string; upc: string })[];
}) {
  const warnings: IntegrityWarning[] = [];
  const gap = input.rows.filter((row) => row.rowKind === "sku" && row.weeksOnHand === 0 && row.weeksOnPo === 0 && row.qtyOnHand > 0);
  if (gap.length) {
    warnings.push({
      code: "zero-weeks",
      message: `${gap.length} SKU rows have quantity on hand but zero weeks on hand and zero weeks on PO.`,
    });
  }
  const copied = input.rows.filter(
    (row) => row.rowKind === "sku" && row.weeksOnHand > 0 && row.weeksOnHand === row.qtyOnHand,
  );
  if (copied.length) {
    warnings.push({
      code: "weeks-copied",
      message: `${copied.length} SKU rows have Weeks on Hand equal to Quantity on Hand.`,
    });
  }

  const byDc = new Map<string, { subtotal: number | null; skus: number }>();
  for (const row of input.rows) {
    const current = byDc.get(row.dcCode) ?? { subtotal: null, skus: 0 };
    if (row.rowKind === "subtotal") current.subtotal = row.qtyOnHand;
    else current.skus += row.qtyOnHand;
    byDc.set(row.dcCode, current);
  }
  const mismatches = [...byDc.entries()].filter(
    ([, value]) => value.subtotal !== null && Math.abs(value.subtotal - value.skus) > 0.01,
  );
  if (mismatches.length) {
    warnings.push({
      code: "subtotal",
      message: `${mismatches.length} DC subtotals do not equal the sum of their SKU rows.`,
    });
  }

  if (input.prior?.length) {
    const priorOnHand = new Map(input.prior.filter((row) => row.rowKind === "sku").map((row) => [`${row.dcCode}|${row.upc}`, row]));
    let impossible = 0;
    for (const row of input.rows) {
      if (row.rowKind !== "sku") continue;
      const previous = priorOnHand.get(`${row.dcCode}|${row.upc}`);
      if (!previous) continue;
      if (row.qtyOnHand > previous.qtyOnHand && row.qtyOnPo === 0 && previous.qtyOnPo === 0) impossible += 1;
    }
    if (impossible) {
      warnings.push({
        code: "on-hand-rose",
        message: `${impossible} SKU rows show on-hand up with zero on PO in both pulls. That extract looks wrong.`,
      });
    }
  }

  return warnings;
}
