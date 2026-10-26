const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export const money = (v) => (v === null || v === undefined || v === "" || isNaN(Number(v)) ? null : inr.format(Number(v)));

export function niceDate(v) {
  if (!v) return null;
  const d = new Date(`${v}T00:00:00`);
  if (isNaN(d)) return String(v);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function fileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function elapsed(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

// ---------------------------------------------------------------- English-only display
const DEV_DIGITS = "०१२३४५६७८९";

/** English text only: Devanagari digits become 0-9 and any remaining Marathi words are dropped. */
export function english(s) {
  if (s === null || s === undefined) return null;
  const out = String(s)
    .replace(/[०-९]/g, (d) => DEV_DIGITS.indexOf(d))
    .replace(/[ऀ-ॿ]+/g, " ")
    .replace(/'[^A-Za-z0-9']*'/g, "") // quotes left empty after dropping a Marathi name
    .replace(/\s+([,.;:)])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return /[A-Za-z0-9]/.test(out) ? out : null;
}

const AREA_UNITS = [
  [/चौ\.?\s*फ[ुू]ट/g, "sq. ft"],
  [/चौ\.?\s*मी(टर)?\.?/g, "sq. m"],
  [/हेक्टर/g, "hectare"],
  [/गुंठे|गुंठा/g, "guntha"],
];

export function area(s) {
  if (!s) return null;
  let t = String(s).replace(/^\s*1\)\s*/, "");
  for (const [re, en] of AREA_UNITS) t = t.replace(re, en);
  return english(t);
}

// Longer names first: "विक्री करारनामा" must win over "करारनामा"
const DOC_TYPES = [
  ["विक्री करारनामा", "Agreement for Sale"],
  ["लिव्ह अँड लायसन्स", "Leave and Licence"],
  ["खरेदीखत", "Sale Deed"],
  ["खरेदी खत", "Sale Deed"],
  ["बक्षीसपत्र", "Gift Deed"],
  ["गहाणखत", "Mortgage Deed"],
  ["हक्कसोडपत्र", "Release Deed"],
  ["भाडेपट्टा", "Lease Deed"],
  ["करारनामा", "Agreement"],
];

export function docType(r) {
  if (r.document_type_en) return english(r.document_type_en);
  const mr = r.document_type_mr || "";
  const hit = DOC_TYPES.find(([k]) => mr.includes(k));
  return hit ? hit[1] : english(mr);
}

/** Review points for a result. TDS / interest are calculated in the Excel from the payment date, so they are not review items. */
export const reviewWarnings = (r) =>
  (r.warnings || []).map(english).filter(Boolean).filter((w) => !/^(tds amount|total interest) not found/i.test(w));
