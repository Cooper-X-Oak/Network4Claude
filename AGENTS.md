# AGENTS.md

This file provides guidance to Codex when working in this repository.

## Project

Network4Claude is a documentation and calculator project for comparing AI access strategies:

- pure network access for official subscriptions
- official API usage
- official subscription capacity and API-equivalent purchasing power
- transparent proxy services
- sub2api / subscription-pool services
- reverse proxies and self-hosted account pools

The project must keep documentation, formulas, data files, and calculator behavior consistent.

## Truth Sources

Use these as the active sources of truth:

- `data/pricing.json`: official API token prices by model and token type.
- `data/plan-baselines.json`: official plan baselines, API-equivalent purchasing power profiles, and Codex/OpenAI credit baselines.
- `docs/08-calculator-design.md`: current product model, formulas, scenarios, channel risk model, and recommendation logic.
- `calculator.html`: current static prototype. It must not contradict `data/` or `docs/08-calculator-design.md`.
- `skills/doc-consistency-guardian/SKILL.md`: repository-specific documentation governance workflow.

Do not add mutable prices, model limits, or formulas to other docs unless they are worked examples or explicitly point back to these truth sources.

## Repository Layout

```text
Network4Claude/
├── data/             # Machine-readable pricing and plan baselines
├── docs/             # Active structured documentation
├── notes/            # Process notes and raw research logs
├── configs/          # Configuration templates
├── scripts/          # Automation scripts
├── skills/           # Project-local Codex skills
├── assets/           # Images and evidence assets
└── calculator.html   # Static calculator prototype
```

## Documentation Governance

When updating any cost, capacity, pricing, model, or recommendation content:

1. Read the truth sources first.
2. Search the whole repo for stale terms and conflicting formulas.
3. Update or remove active stale content.
4. Archive only when historical context is valuable and cannot confuse current readers.
5. Validate JSON data and recompute affected examples.
6. Report changed files and remaining uncertainty.

Use the project skill when the user asks for consistency work:

```text
Use $doc-consistency-guardian to audit and update Network4Claude documentation consistency.
```

## Current Cost Model

API cost must be split by token type:

```text
Cost_api =
  T_uncached_input × P_input
  + T_output × P_output
  + T_cache_read × P_cache_read
  + T_cache_write_5m × P_cache_write_5m
  + T_cache_write_1h × P_cache_write_1h
```

Cache is a price substitution, not free token deletion:

```text
Savings_cache =
  T_cache_read × (P_input - P_cache_read)
  - T_cache_write × P_cache_write
```

Official Plan value must be expressed as API-equivalent model purchasing power:

```text
Value_api_equivalent =
  Capacity_units_per_month × Avg_api_cost_per_unit
```

Cross-channel comparison must include:

```text
Model_power_per_cny =
  Value_api_equivalent_usd / Actual_cost_cny
```

Risk-adjusted comparison must include:

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
- subscription-pool, sub2api, reverse proxy, and account-pool services require sustainable floor analysis.
- Black-card, exploit, and below-upstream-cost services must be labeled high risk and should not be recommended.

## Privacy

- Do not commit real IP addresses.
- Do not commit API keys, cookies, session tokens, or account credentials.
- Use placeholders in configs and examples.

## Git

Keep changes scoped. Do not revert unrelated user changes. If asked to commit, stage only relevant files and use a message that explains the documentation consistency change.
