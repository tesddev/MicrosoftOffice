// Signed, stateless tokens. The "type" is mixed into the signature so an
// attempt token can never be used as a certificate token (or the reverse).
const crypto = require("crypto");

function secret() {
  const s = process.env.CERT_SECRET;
  if (!s || s.length < 32) throw new Error("CERT_SECRET is missing or shorter than 32 characters");
  return s;
}
const mac = (type, payload) =>
  crypto.createHmac("sha256", secret()).update(type + "." + payload).digest("base64url");

function sign(type, obj) {
  const payload = Buffer.from(JSON.stringify(obj)).toString("base64url");
  return payload + "." + mac(type, payload);
}

function open(type, token) {
  if (typeof token !== "string") return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(mac(type, payload));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString()); } catch { return null; }
}

// Short human-readable ID derived from the signature (nothing is stored)
const certId = (token) => "ONL-" + String(token).split(".")[1].slice(0, 8).toUpperCase();

module.exports = { sign, open, certId };
