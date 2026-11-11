// Run:  node scripts/check-urls.js https://<deployment-url>
// Requests every URL the site served before the migration (migration/old-paths.txt) and
// reports anything that no longer answers 200. Needs Node 18+.
const fs = require("fs");
const base = (process.argv[2] || "").replace(/\/$/, "");
if (!/^https?:\/\//.test(base)) { console.error("Usage: node scripts/check-urls.js https://<deployment-url>"); process.exit(2); }

const paths = fs.readFileSync("migration/old-paths.txt", "utf8").split("\n").map((s) => s.trim()).filter(Boolean);
const urls = new Set(["/"]);
paths.forEach((p) => urls.add("/" + p.split("/").map(encodeURIComponent).join("/")));

(async () => {
  let bad = 0;
  for (const u of urls) {
    try {
      const r = await fetch(base + u, { redirect: "manual" });
      if (r.status !== 200) { bad++; console.log(r.status, u, r.status === 401 ? "(deployment protection may be on; check in a browser)" : ""); }
    } catch (e) { bad++; console.log("ERR", u, e.message); }
  }
  console.log(bad ? bad + " of " + urls.size + " URL(s) failed" : "All " + urls.size + " URLs OK");
  process.exit(bad ? 1 : 0);
})();
