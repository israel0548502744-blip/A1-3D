// Lists every package that ships in the web app (production dependencies,
// transitively) with its declared license. Usage: node scripts/license-audit.mjs apps/web
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2] ?? "apps/web";
const nm = join(root, "node_modules");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const seen = new Map();
const queue = Object.keys(pkg.dependencies ?? {});
while (queue.length) {
  const name = queue.shift();
  if (seen.has(name)) continue;
  const file = join(nm, name, "package.json");
  if (!existsSync(file)) { seen.set(name, { version: "?", license: "NOT INSTALLED" }); continue; }
  const p = JSON.parse(readFileSync(file, "utf8"));
  const lic = typeof p.license === "string" ? p.license : p.license?.type ?? (p.licenses ? p.licenses.map((l) => l.type).join(" OR ") : "UNKNOWN");
  seen.set(name, { version: p.version, license: lic });
  for (const d of Object.keys(p.dependencies ?? {})) queue.push(d);
  for (const d of Object.keys(p.peerDependencies ?? {})) if (existsSync(join(nm, d))) queue.push(d);
}
const OK = /^(MIT|ISC|Apache-2\.0|BSD-2-Clause|BSD-3-Clause|0BSD|OFL-1\.1|BSL|BSL-1\.0|Zlib|Unlicense|CC0-1\.0)$/;
const rows = [...seen.entries()].sort((a, b) => a[0].localeCompare(b[0]));
console.log("| Package | Version | License | Status |\n|---|---|---|---|");
for (const [n, { version, license }] of rows) {
  const status = OK.test(license) ? "permissive" : license.startsWith("LGPL") ? "LGPL: see notes" : "REVIEW";
  console.log(`| ${n} | ${version} | ${license} | ${status} |`);
}
