const { open, certId } = require("../lib/token");

// A certificate token is two base64url parts joined by a dot
const SHAPE = /^[A-Za-z0-9_-]{4,2000}\.[A-Za-z0-9_-]{20,200}$/;

module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const token = req.query.t;
    if (typeof token !== "string" || !SHAPE.test(token)) {
      return res.status(400).json({ valid: false, reason: "malformed" });
    }
    const c = open("cert", token);
    if (!c || typeof c.n !== "string" || typeof c.d !== "string" || !Number.isFinite(c.s)) {
      return res.status(404).json({ valid: false, reason: "not_found" });
    }
    res.json({ valid: true, name: c.n, track: c.k, score: c.s, date: c.d, id: certId(token) });
  } catch {
    res.status(500).json({ valid: false, reason: "server" });
  }
};
