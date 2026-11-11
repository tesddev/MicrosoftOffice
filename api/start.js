const crypto = require("crypto");
const { sign } = require("../lib/token");
const { bank, NUM_Q, LIMIT_SEC } = require("../lib/exam");

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

module.exports = (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const name = String((req.body && req.body.name) || "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (name.length < 2 || name.length > 60) {
    return res.status(400).json({ error: "Enter your full name (2 to 60 characters)." });
  }

  const chosen = shuffle([...bank]).slice(0, Math.min(NUM_Q, bank.length));
  const items = chosen.map((q) => ({ q, perm: shuffle(q.options.map((_, i) => i)) }));
  const now = Math.floor(Date.now() / 1000);

  // The token holds question ids and option order only. Correct answers never leave the server.
  const attempt = sign("attempt", {
    id: crypto.randomBytes(6).toString("hex"),
    n: name,
    t: now,
    it: items.map(({ q, perm }) => [q.id, perm]),
  });

  const questions = items.map(({ q, perm }) => ({ q: q.q, options: perm.map((i) => q.options[i]) }));
  res.setHeader("Cache-Control", "no-store");
  res.json({ attempt, questions, limitSec: LIMIT_SEC });
};
