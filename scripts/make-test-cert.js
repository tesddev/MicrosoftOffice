// Prints the path of a valid test certificate, for checking the verify page on a deployment.
// Run:  CERT_SECRET=<the secret that deployment uses> node scripts/make-test-cert.js "Ada Obi"
// Then open https://<deployment>/verify/<printed token>. Prints no secret.
const { sign, certId } = require("../lib/token");
const name = (process.argv[2] || "Test Candidate").slice(0, 60);
const cert = sign("cert", { n: name, k: "online", s: 85, d: new Date().toISOString().slice(0, 10) });
console.log("/verify/" + cert);
console.log("Certificate ID: " + certId(cert));
