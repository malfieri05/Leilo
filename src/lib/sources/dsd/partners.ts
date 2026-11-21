export type DsdIntake = "DSD Link" | "Email" | "Encompass" | "Manual request" | "Unsure";

export type DsdPartner = {
  slug: string;
  label: string;
  intake: DsdIntake;
  note: string;
};

/** How each partner's retailer sales arrive. No portal logins. */
export const DSD_PARTNERS: DsdPartner[] = [
  { slug: "craft-collective", label: "Craft Collective Homegrown", intake: "DSD Link", note: "Prior 90 days report" },
  { slug: "elite-brands", label: "Elite Brands", intake: "DSD Link", note: "Saved report: YTD Sales Comparison" },
  { slug: "lad", label: "LAD", intake: "DSD Link", note: "Manual report" },
  { slug: "briggs", label: "Briggs Distributing", intake: "Email", note: "Monthly spreadsheet" },
  { slug: "infd", label: "INFD", intake: "Email", note: "Weekly financial report, formerly SMNR" },
  { slug: "premier-island", label: "Premier Island Brokerage", intake: "Manual request", note: "Ask for the report" },
  { slug: "gold-coast", label: "Gold Coast", intake: "Email", note: "Monthly sales report" },
  { slug: "mexcor", label: "MexCor", intake: "Encompass", note: "Partner export until PartnerLink" },
  { slug: "alabev", label: "AlaBev", intake: "Email", note: "Weekly sales" },
  { slug: "6th-city", label: "6th City Distribution", intake: "Manual request", note: "Ask for the report" },
  { slug: "travis-doupe", label: "Travis Doupe", intake: "Manual request", note: "Ask for the report" },
  { slug: "monica-louisiana", label: "Monica in Louisiana", intake: "Manual request", note: "Ask for the report" },
  { slug: "james-mn", label: "James in MN", intake: "Manual request", note: "Ask for the report" },
  { slug: "bellwether", label: "David Bowers / Bellwether", intake: "Manual request", note: "Ask for the report" },
  { slug: "romano", label: "Romano Beverage", intake: "Unsure", note: "Intake not confirmed" },
  { slug: "empire", label: "Empire Beverage", intake: "Unsure", note: "Intake not confirmed" },
  { slug: "john-lenore", label: "John Lenore", intake: "Unsure", note: "Intake not confirmed" },
];

const aliases = new Map<string, string>([
  ["craft collective", "craft-collective"],
  ["craft collective homegrown", "craft-collective"],
  ["elite", "elite-brands"],
  ["elite brands", "elite-brands"],
  ["lad", "lad"],
  ["briggs", "briggs"],
  ["briggs distributing", "briggs"],
  ["infd", "infd"],
  ["smnr", "infd"],
  ["smnr sales", "infd"],
  ["infd formerly smnr", "infd"],
  ["premier island", "premier-island"],
  ["premier island brokerage", "premier-island"],
  ["gold coast", "gold-coast"],
  ["goldcoast", "gold-coast"],
  ["mexcor", "mexcor"],
  ["mex cor", "mexcor"],
  ["alabev", "alabev"],
  ["ala bev", "alabev"],
  ["6th city", "6th-city"],
  ["6th city distribution", "6th-city"],
  ["sixth city", "6th-city"],
  ["sixth city distribution", "6th-city"],
  ["travis doupe", "travis-doupe"],
  ["monica", "monica-louisiana"],
  ["monica in louisiana", "monica-louisiana"],
  ["james", "james-mn"],
  ["james in mn", "james-mn"],
  ["james mn", "james-mn"],
  ["david bowers", "bellwether"],
  ["bellwether", "bellwether"],
  ["david bowers bellwether", "bellwether"],
  ["romano", "romano"],
  ["romano beverage", "romano"],
  ["empire", "empire"],
  ["empire beverage", "empire"],
  ["john lenore", "john-lenore"],
]);

export function normalizePartnerName(input: string) {
  const key = input
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!key) return "";
  return aliases.get(key) ?? key.replace(/ /g, "-");
}

export function partnerLabel(slug: string) {
  return DSD_PARTNERS.find((partner) => partner.slug === slug)?.label ?? slug;
}
