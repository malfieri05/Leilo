/** KEHE DC codes from Weston's stock-status prompt. */
export const KEHE_DCS: { code: string; name: string }[] = [
  { code: "01", name: "St. Augustine" },
  { code: "12", name: "Aurora" },
  { code: "14", name: "Phoenix" },
  { code: "16", name: "Bloomington" },
  { code: "18", name: "Romeoville" },
  { code: "19", name: "Dallas/Fort Worth" },
  { code: "25", name: "Portland" },
  { code: "27", name: "North East Maryland" },
  { code: "31", name: "Miami" },
  { code: "33", name: "Stockton" },
  { code: "41", name: "Chino" },
  { code: "55", name: "Douglasville" },
];

const byCode = new Map(KEHE_DCS.map((dc) => [dc.code, dc.name]));

/** Connect's grouped stock export names the DC instead of printing the code. */
const cityToCode = new Map<string, string>([
  ["st augustine", "01"],
  ["aurora", "12"],
  ["phoenix", "14"],
  ["bloomington", "16"],
  ["romeoville", "18"],
  ["dallas/fort worth", "19"],
  ["portland", "25"],
  ["north east maryland", "27"],
  ["miami", "31"],
  ["stockton", "33"],
  ["chino", "41"],
  ["chino a", "41"],
  ["douglasville", "55"],
]);

export function keheDcName(code: string) {
  const normalized = normalizeDcCode(code);
  return byCode.get(normalized) ?? (normalized ? `DC ${normalized}` : "Unknown DC");
}

export function normalizeDcCode(value: string) {
  const trimmed = value.trim();
  const city = trimmed.split(",")[0]?.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ") ?? "";
  const mapped = cityToCode.get(city);
  if (mapped) return mapped;
  const digits = trimmed.replace(/^dc\s*/i, "").match(/\d+/);
  if (!digits) return trimmed;
  const number = Number(digits[0]);
  if (!Number.isFinite(number)) return trimmed;
  return String(number).padStart(2, "0");
}
