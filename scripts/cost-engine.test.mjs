import assert from "node:assert/strict";
import fs from "node:fs";
import {
  calculatePlanPurchasingPower,
  calculatePurchasingPower,
  calculateUsageRows,
  normalizePlanBaselines,
  normalizePricing
} from "./cost-engine.mjs";

const pricing = normalizePricing(JSON.parse(fs.readFileSync("data/pricing.json", "utf8")));
const plans = normalizePlanBaselines(JSON.parse(fs.readFileSync("data/plan-baselines.json", "utf8")));

const usage = calculateUsageRows([
  {
    provider: "anthropic",
    model: "sonnet_4_6",
    unit: "M",
    input: 1100,
    output: 52.3,
    cacheRead: 14700
  }
], pricing, { usdToCny: 7 });

assert.equal(round(usage.total.usd, 1), 8494.5);
assert.equal(round(usage.total.cny, 1), 59461.5);
assert.equal(round(usage.byModel.sonnet_4_6.usd, 1), 8494.5);

const mixed = calculateUsageRows([
  { model: "sonnet_4_6", unit: "M", input: 770, output: 36.61, cacheRead: 10290 },
  { model: "haiku_4_5", unit: "M", input: 330, output: 15.69, cacheRead: 4410 }
], pricing, { usdToCny: 7 });

assert.equal(round(mixed.total.usd, 1), 6795.6);
assert.equal(round(mixed.total.cny, 1), 47569.2);

const plus = calculatePlanPurchasingPower(plans.openai_plus, { riskFactor: 0.95 });
assert.equal(round(plus.modelPowerPerCny, 2), 2.88);
assertClose(plus.riskAdjustedModelPowerPerCny, 2.735, 0.001);

const claude = calculatePurchasingPower({
  apiEquivalentValueUsd: 8495,
  actualCostCny: 1400,
  riskFactor: 0.95
});
assert.equal(round(claude.modelPowerPerCny, 2), 6.07);
assert.equal(round(claude.riskAdjustedModelPowerPerCny, 2), 5.76);

console.log("cost-engine tests ok");

function round(value, digits) {
  return Number(value.toFixed(digits));
}

function assertClose(actual, expected, tolerance) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} not within ${tolerance} of ${expected}`);
}
