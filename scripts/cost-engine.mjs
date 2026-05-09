export function normalizePricing(rawPricing) {
  const models = {};

  for (const [modelId, model] of Object.entries(rawPricing.models || {})) {
    models[modelId] = {
      provider: model.provider || "anthropic",
      displayName: model.display_name || modelId,
      unit: rawPricing.unit || "1M tokens",
      prices: {
        input: number(model.base_input),
        output: number(model.output),
        cachedInput: number(model.cached_input ?? model.cache_read),
        cacheRead: number(model.cache_read ?? model.cached_input),
        cacheWrite5m: number(model.cache_write_5m),
        cacheWrite1h: number(model.cache_write_1h)
      }
    };
  }

  return models;
}

export function normalizePlanBaselines(rawPlanBaselines, usdToCny = 7) {
  const plans = {};
  const openaiPlans = rawPlanBaselines.openai_codex?.chatgpt_plan_baselines || {};
  const claudePlans = rawPlanBaselines.claude?.plans || {};

  for (const [planId, plan] of Object.entries(openaiPlans)) {
    const profileId = firstKey(plan.api_equivalent_value_usd);
    plans[`openai_${planId}`] = {
      provider: "openai",
      planId: `openai_${planId}`,
      displayName: `OpenAI ${planId.replaceAll("_", " ")}`,
      monthlyFeeUsd: number(plan.monthly_fee_usd),
      actualCostCny: number(plan.monthly_fee_usd) * usdToCny,
      apiEquivalentValueUsd: number(plan.api_equivalent_value_usd?.[profileId]),
      profileId
    };
  }

  for (const [planId, plan] of Object.entries(claudePlans)) {
    const profileId = firstKey(plan.api_equivalent_value_usd);
    plans[`claude_${planId}`] = {
      provider: "anthropic",
      planId: `claude_${planId}`,
      displayName: `Claude ${planId.replaceAll("_", " ")}`,
      monthlyFeeUsd: number(plan.monthly_fee_usd),
      actualCostCny: number(plan.monthly_fee_usd) * usdToCny,
      apiEquivalentValueUsd: number(plan.api_equivalent_value_usd?.[profileId]),
      profileId
    };
  }

  return plans;
}

export function calculateUsageRows(rows, pricingModels, options = {}) {
  const usdToCny = number(options.usdToCny ?? 7);
  const normalizedRows = rows.map((row, index) => calculateUsageRow(row, pricingModels, index));
  const totalUsd = sum(normalizedRows.map(row => row.cost.usd));

  return {
    rows: normalizedRows,
    total: {
      usd: totalUsd,
      cny: totalUsd * usdToCny
    },
    byModel: groupCosts(normalizedRows, "model"),
    byProvider: groupCosts(normalizedRows, "provider")
  };
}

export function calculateUsageRow(row, pricingModels, index = 0) {
  const model = pricingModels[row.model];
  if (!model) {
    throw new Error(`Unknown model '${row.model}' in usage row ${index}`);
  }

  const tokens = normalizeUsageTokens(row);
  const p = model.prices;
  const parts = {
    input: tokens.input * p.input,
    output: tokens.output * p.output,
    cachedInput: tokens.cachedInput * p.cachedInput,
    cacheRead: tokens.cacheRead * p.cacheRead,
    cacheWrite5m: tokens.cacheWrite5m * p.cacheWrite5m,
    cacheWrite1h: tokens.cacheWrite1h * p.cacheWrite1h
  };
  const usd = sum(Object.values(parts));

  return {
    ...row,
    provider: row.provider || model.provider,
    model: row.model,
    displayName: model.displayName,
    tokens,
    prices: p,
    cost: {
      usd,
      parts
    }
  };
}

export function calculatePurchasingPower({ apiEquivalentValueUsd, actualCostCny, riskFactor = 1 }) {
  const value = number(apiEquivalentValueUsd);
  const cost = number(actualCostCny);
  const modelPowerPerCny = cost > 0 ? value / cost : 0;

  return {
    apiEquivalentValueUsd: value,
    actualCostCny: cost,
    modelPowerPerCny,
    riskFactor: number(riskFactor),
    riskAdjustedModelPowerPerCny: modelPowerPerCny * number(riskFactor),
    cnyPerApiEquivalentUsd: value > 0 ? cost / value : 0
  };
}

export function calculatePlanPurchasingPower(plan, options = {}) {
  const riskFactor = options.riskFactor ?? 1;
  return calculatePurchasingPower({
    apiEquivalentValueUsd: plan.apiEquivalentValueUsd,
    actualCostCny: options.actualCostCny ?? plan.actualCostCny,
    riskFactor
  });
}

export function normalizeUsageTokens(row) {
  const scale = tokenScale(row.unit);

  return {
    input: number(row.input_tokens ?? row.input ?? row.base_input_tokens ?? row.baseInput) / scale,
    output: number(row.output_tokens ?? row.output) / scale,
    cachedInput: number(row.cached_input_tokens ?? row.cached_input ?? row.cachedInput) / scale,
    cacheRead: number(row.cache_read_tokens ?? row.cache_read ?? row.cacheRead) / scale,
    cacheWrite5m: number(row.cache_write_5m_tokens ?? row.cache_write_5m ?? row.cacheWrite5m) / scale,
    cacheWrite1h: number(row.cache_write_1h_tokens ?? row.cache_write_1h ?? row.cacheWrite1h) / scale
  };
}

export function tokenScale(unit) {
  if (!unit || unit === "M" || unit === "million") return 1;
  if (unit === "token" || unit === "tokens") return 1_000_000;
  if (unit === "K" || unit === "thousand") return 1000;
  throw new Error(`Unsupported token unit '${unit}'`);
}

function groupCosts(rows, key) {
  const grouped = {};
  for (const row of rows) {
    const groupKey = row[key] || "unknown";
    grouped[groupKey] ||= { usd: 0, rows: 0 };
    grouped[groupKey].usd += row.cost.usd;
    grouped[groupKey].rows += 1;
  }
  return grouped;
}

function firstKey(value) {
  return Object.keys(value || {})[0] || "";
}

function sum(values) {
  return values.reduce((total, value) => total + number(value), 0);
}

function number(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
