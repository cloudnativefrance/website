import { readFileSync, writeFileSync } from "node:fs";

const SPEAKERS_EXPORT = "speakers_export.csv";
const COMPANIES_CSV = "imports/speaker-company.csv";
const OUTPUT = "imports/speakers-societe-column.csv";

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (cell !== "" || row.length > 0) { row.push(cell); rows.push(row); row = []; cell = ""; }
        if (c === "\r" && text[i + 1] === "\n") i++;
      } else cell += c;
    }
  }
  if (cell !== "" || row.length > 0) { row.push(cell); rows.push(row); }
  return rows;
}

function rowsToObjects(rows) {
  const [header, ...data] = rows;
  return data.map((r) => {
    const o = {};
    header.forEach((h, i) => { o[h] = r[i] ?? ""; });
    return o;
  });
}

function normalize(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(s) {
  return new Set(normalize(s).split(/\s+/).filter(Boolean));
}

function jaccard(a, b) {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter;
  return inter / union;
}

const speakersRows = parseCSV(readFileSync(SPEAKERS_EXPORT, "utf8"));
const speakers = rowsToObjects(speakersRows);

const companiesRows = parseCSV(readFileSync(COMPANIES_CSV, "utf8"));
const companies = rowsToObjects(companiesRows);

function findCompany(name) {
  if (!name) return { match: "", company: "", score: 0 };
  let best = { match: "", company: "", score: 0 };
  for (const row of companies) {
    const candidate = row["Nom"];
    const s = jaccard(name, candidate);
    if (s > best.score) best = { match: candidate, company: row["Société"] || "", score: s };
  }
  return best;
}

function csvCell(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const out = [["slug", "name", "match_in_companies_csv", "score", "Société"]];
let confident = 0;
let weak = 0;
let none = 0;
for (const sp of speakers) {
  if (!sp.name) continue;
  const { match, company, score } = findCompany(sp.name);
  let s = "";
  if (score >= 0.5 && company && company !== "????") {
    s = company;
    confident++;
  } else if (score > 0 && company && company !== "????") {
    weak++;
  } else {
    none++;
  }
  out.push([sp.slug, sp.name, match, score.toFixed(2), s]);
}

writeFileSync(OUTPUT, out.map((r) => r.map(csvCell).join(",")).join("\n") + "\n");

console.log(`Wrote ${OUTPUT}`);
console.log(`  Total speakers: ${speakers.length}`);
console.log(`  Confident match (Société filled): ${confident}`);
console.log(`  Weak match (left blank, see score column): ${weak}`);
console.log(`  No match: ${none}`);
