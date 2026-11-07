import assert from "node:assert/strict";
import {
  Q95_LOG,
  SIGMA,
  brentDensity,
  fallTail,
  jobs,
  middleHalf,
  pathById,
  paths,
  pricePercent,
  riseTail,
} from "./data.js";

assert.equal(Math.round(SIGMA * 1000) / 1000, 0.119);
assert.equal(Math.round(pricePercent(Q95_LOG)), 22);
assert.equal(Math.round(pricePercent(-Q95_LOG)), -18);
assert.equal(Math.round(riseTail() * 100), 6);
assert.equal(Math.round(fallTail() * 100), 3);

const half = middleHalf();
assert.ok(half.lo < 0 && half.hi > 0);
assert.ok(half.lo > -18 && half.hi < 22);

const samples = brentDensity();
const atZero = samples.reduce((best, sample) => (Math.abs(sample.pct) < Math.abs(best.pct) ? sample : best));
const atTwenty = samples.find((sample) => sample.pct === 20);
assert.ok(atZero.density > atTwenty.density);

assert.equal(paths.length, 8);
const ids = new Set(paths.map((path) => path.id));
assert.equal(ids.size, paths.length);
for (const path of paths) {
  assert.ok(path.lo < path.center && path.center < path.hi);
  assert.ok(pathById(path.id) === path);
  assert.match(path.cutoff, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(["open", "quiet", "ahead"].includes(path.status));
}

assert.equal(jobs.actual, 165);
assert.equal(jobs.consensusLo, 59);
assert.equal(jobs.consensusHi, 70);
assert.ok(jobs.consensusHi < jobs.actual && jobs.actual < jobs.scaleMax);

console.log("ledger ok");
