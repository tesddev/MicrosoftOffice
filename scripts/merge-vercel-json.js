// Run from the repo root:  node scripts/merge-vercel-json.js
// Creates vercel.json, or merges the two settings this feature needs into an existing one.
// Safe to re-run. Exit code 2 means "stop and ask a human".
const fs = require("fs");
const FILE = "vercel.json";
const REWRITE = { source: "/verify/:token", destination: "/verify.html" };
const stop = (msg) => { console.error("STOP: " + msg); process.exit(2); };

let cfg = {};
const prev = fs.existsSync(FILE) ? fs.readFileSync(FILE, "utf8") : null;
if (prev !== null) {
  try { cfg = JSON.parse(prev); } catch { stop("vercel.json is not valid JSON"); }
}
if (cfg.routes || cfg.builds) stop("vercel.json uses legacy routes/builds");
if (cfg.outputDirectory && cfg.outputDirectory !== "public") stop("vercel.json already sets outputDirectory to " + cfg.outputDirectory);
if (cfg.rewrites !== undefined && !Array.isArray(cfg.rewrites)) stop("vercel.json rewrites is not an array");

cfg.outputDirectory = "public";
cfg.rewrites = cfg.rewrites || [];
const same = cfg.rewrites.find((r) => r.source === REWRITE.source);
if (same && same.destination !== REWRITE.destination) stop("an existing rewrite already uses " + REWRITE.source);
if (!same) cfg.rewrites.unshift(REWRITE); // first, so no catch-all rewrite can swallow it

const next = JSON.stringify(cfg, null, 2) + "\n";
if (prev === next) console.log("unchanged");
else { fs.writeFileSync(FILE, next); console.log(prev === null ? "created" : "updated"); }
