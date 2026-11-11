// Run from the repo root:  node scripts/migrate-to-public.js
// Moves every file the site currently serves into public/, and records the old URLs in
// migration/old-paths.txt so they can be checked later. Safe to re-run. Exit code 2 = stop.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const stop = (msg) => { console.error("STOP: " + msg); process.exit(2); };
const git = (...a) => execFileSync("git", a, { encoding: "utf8", maxBuffer: 1 << 26 });

if (fs.existsSync("public/index.html")) { console.log("already migrated"); process.exit(0); }
if (!fs.existsSync("index.html")) stop("no index.html at the repo root");

const tracked = git("ls-files", "-z").split("\0").filter(Boolean);

// 1. Refuse if this site already uses folders this feature needs
const RESERVED = ["api", "lib", "data", "scripts", "migration", "public"];
const clash = RESERVED.filter((d) => tracked.some((p) => p.startsWith(d + "/")));
// scripts/ may already hold the files this feature just added; only tracked files count
if (clash.length) stop("these folders already contain tracked files: " + clash.join(", "));

// 2. Work out what the site serves today
const EXCLUDE_TOP = new Set(["node_modules", "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "vercel.json", ...RESERVED]);
const excluded = (p) => {
  const top = p.split("/")[0];
  return EXCLUDE_TOP.has(top) || /^(README|LICENSE|tsconfig|jsconfig)/i.test(top) || top.includes(".config.") || (top.startsWith(".") && top !== ".well-known");
};
const served = tracked.filter((p) => !excluded(p));
if (!served.includes("index.html")) stop("index.html is not tracked by git");

// 3. Record the old paths once
fs.mkdirSync("migration", { recursive: true });
if (!fs.existsSync("migration/old-paths.txt")) fs.writeFileSync("migration/old-paths.txt", served.join("\n") + "\n");

// 4. Move
console.log("Moving " + served.length + " file(s) into public/:");
for (const p of served) {
  fs.mkdirSync(path.join("public", path.dirname(p)), { recursive: true });
  if (fs.existsSync(path.join("public", p))) continue;
  git("mv", p, path.join("public", p));
  console.log("  " + p);
}

// 5. Parity check: everything that was served is still there
const missing = served.filter((p) => !fs.existsSync(path.join("public", p)));
if (missing.length) stop("missing after move: " + missing.join(", "));

const untracked = git("ls-files", "--others", "--exclude-standard", "-z").split("\0").filter(Boolean).filter((p) => !excluded(p) && !RESERVED.includes(p.split("/")[0]));
if (untracked.length) console.log("NOTE: untracked files were NOT moved (they are not deployed from git): " + untracked.join(", "));
console.log("migrated " + served.length + " file(s); parity OK");
