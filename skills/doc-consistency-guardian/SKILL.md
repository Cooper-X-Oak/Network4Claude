---
name: doc-consistency-guardian
description: Maintain strict documentation consistency for the Network4Claude repository. Use when updating README, AGENTS, CLAUDE, docs, notes, calculator, pricing data, plan baselines, local skills, formulas, cost models, provider comparisons, or when auditing/removing stale project context and contradictory documentation.
---

# Network4Claude Doc Consistency Guardian

## Truth Sources

Use these files as the current source of truth:

- `data/pricing.json`: official API token prices by model and token type.
- `data/plan-baselines.json`: official plan baselines, API-equivalent purchasing power profiles, and subscription capacity assumptions.
- `docs/08-calculator-design.md`: current product model, formulas, scenario model, channel risk model, and decision logic.
- `calculator.html`: current runnable calculator prototype; it must not contradict `data/` and `docs/08-calculator-design.md`.
- `AGENTS.md`: repository operating rules and project-level collaboration constraints.

When an external fact is time-sensitive, verify against official primary sources before updating the truth source. Pricing, plan limits, model names, and provider policies are time-sensitive.

## Audit Surface

For a consistency pass, scan:

- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `docs/`
- `notes/`
- `data/`
- `calculator.html`
- `configs/`
- `scripts/`
- `skills/`

Also scan any generated examples or copied snippets when they embed formulas, prices, model names, plan limits, or recommendation logic.

## Hard Rules

- Keep active documentation aligned with current truth sources.
- Do not leave old thinking, superseded formulas, outdated prices, or contradictory recommendations in active docs.
- Do not preserve stale context for historical interest unless it is moved to an explicit archive and cannot confuse current readers.
- Do not duplicate mutable facts such as prices, plan capacities, or formulas unless the duplicate points back to the truth source or is a worked example.
- Do not introduce ranges where formulas require fixed parameters. Put uncertainty into assumptions, profiles, confidence, or sensitivity tables.
- Do not let a cheaper-but-ineligible plan rank as a recommendation.
- Do not revert unrelated user changes. If unrelated dirty files exist, leave them alone.

## Required Workflow

1. Read the truth sources first.
2. Inspect `git status --short` and note unrelated dirty files.
3. Search for stale claims and conflicting terms with `rg`.
4. Classify each hit:
   - update in place
   - replace with pointer to truth source
   - archive
   - delete
   - leave unchanged with reason
5. Apply the smallest edits that restore consistency.
6. Validate machine-readable files:
   - parse `data/*.json`
   - recompute affected examples when formulas change
7. Re-scan for the stale terms that motivated the pass.
8. Report changed files, archived/deleted files, current truth sources, remaining uncertainty, and git status.

## Search Checklist

Search for stale or fragile content before finalizing. Build the exact patterns from the current truth source and from the change being made; do not preserve old deprecated values in this skill body.

```powershell
rg -n "<deprecated-price-or-formula-pattern>" .
rg -n "<current-model-or-plan-name>" .
rg -n "<channel-risk-term>" .
```

Adjust the patterns when the latest truth source changes.

## Current Model Requirements

- API cost must be split by token type: base input, output, cache read, cache write 5m, and cache write 1h.
- Cache savings must be computed as a price substitution, not as free token deletion:

```text
Savings_cache =
  T_cache_read × (P_input - P_cache_read)
  - T_cache_write × P_cache_write
```

- Official plan value must be expressed as API-equivalent model purchasing power:

```text
Value_api_equivalent =
  Capacity_units_per_month × Avg_api_cost_per_unit
```

- Cross-channel comparison must include:

```text
Model_power_per_cny =
  Value_api_equivalent_usd / Actual_cost_cny
```

- Risk-adjusted comparison must include:

```text
Risk_adjusted_model_power_per_cny =
  Model_power_per_cny
  × Availability_factor
  × Fulfillment_factor
  × Compliance_factor
  × Exit_risk_factor
```

## Channel Risk Rules

- Official API is the stable baseline.
- Official subscriptions are high model-purchasing-power baselines but require workload profiles and confidence labels.
- Transparent proxy services can be compared by upstream cost plus platform margin.
- subscription-pool, sub2api, reverse proxy, and account-pool services require a sustainable floor calculation.
- Black-card, exploit, and below-upstream-cost services must be labeled high risk and should not be recommended.

## Delivery Standard

Finish a consistency pass with:

- files changed
- files archived or deleted
- truth sources used
- formulas or examples recomputed
- validation commands run
- unresolved uncertainty
- `git status --short`

If the user asks for a commit, stage only relevant files and commit with a message that explains the consistency change.
