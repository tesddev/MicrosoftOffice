const { open, certId } = require("../lib/token");

module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const token = req.query.t;
  const c = open("cert", token);
  if (!c) return res.status(404).json({ valid: false });
  res.json({ valid: true, name: c.n, track: c.k, score: c.s, date: c.d, id: certId(token) });
};
