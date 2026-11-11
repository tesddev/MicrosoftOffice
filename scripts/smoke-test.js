// Run from the repo root:  node scripts/smoke-test.js
// Uses a throwaway secret unless CERT_SECRET is already set. Needs Node 18+.
process.env.CERT_SECRET = process.env.CERT_SECRET || require("crypto").randomBytes(32).toString("hex");

const assert = require("assert");
const start = require("../api/start");
const submit = require("../api/submit");
const verify = require("../api/verify");
const { bank, byId, LIMIT_SEC } = require("../lib/exam");

const mkRes = () => {
  const r = {};
  r.status = (c) => { r.code = c; return r; };
  r.json = (o) => { r.body = o; return r; };
  r.setHeader = () => {};
  r.end = () => r;
  return r;
};

// 1. Question bank is well formed
const ids = new Set();
bank.forEach((q) => {
  assert(q.id && !ids.has(q.id), "unique question id: " + q.id);
  ids.add(q.id);
  assert(typeof q.q === "string" && q.q.length > 0, "question text: " + q.id);
  assert(Array.isArray(q.options) && q.options.length >= 2, "options: " + q.id);
  assert(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, "answer index: " + q.id);
});

// 2. Bad names are rejected
["", "A", "x".repeat(61)].forEach((n) => {
  const r = mkRes();
  start({ method: "POST", body: { name: n } }, r);
  assert.strictEqual(r.code, 400, "bad name rejected: " + JSON.stringify(n));
});

// 3. Start returns questions without an answer key
const s = mkRes();
start({ method: "POST", body: { name: "Ada Obi" } }, s);
assert(s.body && s.body.attempt && Array.isArray(s.body.questions), "start returns attempt and questions");
assert(!JSON.stringify(s.body).includes('"answer"'), "no answer key in start response");
const { attempt } = s.body;
const payload = JSON.parse(Buffer.from(attempt.split(".")[0], "base64url").toString());
const right = payload.it.map(([id, perm]) => perm.indexOf(byId.get(id).answer));
const wrong = payload.it.map(() => -1);

const realNow = Date.now;
try {
  // 4. Instant submission is rejected
  let r = mkRes();
  submit({ method: "POST", body: { attempt, answers: right } }, r);
  assert.strictEqual(r.code, 400, "instant submit rejected");

  // 5. Late submission is rejected
  Date.now = () => realNow() + (LIMIT_SEC + 60) * 1000;
  r = mkRes();
  submit({ method: "POST", body: { attempt, answers: right } }, r);
  assert.strictEqual(r.code, 400, "late submit rejected");

  // 6. Wrong answers fail
  Date.now = () => realNow() + 600 * 1000;
  r = mkRes();
  submit({ method: "POST", body: { attempt, answers: wrong } }, r);
  assert.strictEqual(r.body.passed, false, "wrong answers do not pass");

  // 7. Correct answers pass and the certificate verifies
  r = mkRes();
  submit({ method: "POST", body: { attempt, answers: right } }, r);
  assert.strictEqual(r.body.passed, true, "correct answers pass");
  assert.strictEqual(r.body.score, 100);
  assert.strictEqual(r.body.name, "Ada Obi");
  const cert = r.body.cert;

  let v = mkRes();
  verify({ query: { t: cert } }, v);
  assert.strictEqual(v.body.valid, true, "certificate verifies");
  assert.strictEqual(v.body.name, "Ada Obi");
  assert.strictEqual(v.body.track, "online");

  // 8. Tampered certificate is rejected
  v = mkRes();
  verify({ query: { t: cert.slice(0, -2) + "xx" } }, v);
  assert.strictEqual(v.code, 404, "tampered certificate rejected");

  // 9. An attempt token cannot be used as a certificate
  v = mkRes();
  verify({ query: { t: attempt } }, v);
  assert.strictEqual(v.code, 404, "attempt token rejected as certificate");
} finally {
  Date.now = realNow;
}

console.log("All checks passed");
