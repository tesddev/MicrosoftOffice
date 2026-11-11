const bank = require("../data/questions.json");

module.exports = {
  byId: new Map(bank.map((q) => [q.id, q])),
  bank,
  NUM_Q: 20,          // questions per attempt (capped at bank size)
  LIMIT_SEC: 25 * 60, // time limit
  PASS: 70,           // pass mark in percent
  MIN_SEC_PER_Q: 4,   // submissions faster than this are rejected
};
