const { sign, open, certId } = require("../lib/token");
const { byId, LIMIT_SEC, PASS, MIN_SEC_PER_Q } = require("../lib/exam");

module.exports = (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  res.setHeader("Cache-Control", "no-store");

  const { attempt, answers } = req.body || {};
  const a = open("attempt", attempt);
  if (!a || !Array.isArray(answers)) return res.status(400).json({ error: "Invalid attempt." });

  const elapsed = Math.floor(Date.now() / 1000) - a.t;
  if (elapsed > LIMIT_SEC + 15) return res.status(400).json({ error: "Time is up. Start a new attempt." });
  if (elapsed < a.it.length * MIN_SEC_PER_Q) return res.status(400).json({ error: "Submitted too quickly. Start a new attempt." });

  let correct = 0;
  a.it.forEach(([id, perm], i) => {
    const q = byId.get(id);
    const shown = answers[i];
    if (q && Number.isInteger(shown) && perm[shown] === q.answer) correct++;
  });

  const score = Math.round((correct / a.it.length) * 100);
  if (score < PASS) return res.json({ passed: false, score, pass: PASS });

  const date = new Date().toISOString().slice(0, 10);
  const cert = sign("cert", { n: a.n, k: "online", s: score, d: date });
  res.json({ passed: true, score, name: a.n, date, cert, id: certId(cert) });
};
