# 精算引擎

本文件定义从模型用量输入到实际购买力 / 成本测算的确定计算链。实现位于 [../scripts/cost-engine.mjs](../scripts/cost-engine.mjs)。

## 一、输入结构

精算层使用 `UsageRow[]`。每一行代表一个 provider + model 的用量。

```json
{
  "provider": "anthropic",
  "model": "sonnet_4_6",
  "unit": "M",
  "input": 1100,
  "output": 52.3,
  "cacheRead": 14700,
  "cacheWrite5m": 0,
  "cacheWrite1h": 0
}
```

字段规则：

| 字段 | 含义 |
|------|------|
| `provider` | 平台或渠道，如 `anthropic`、`openai`、`openrouter` |
| `model` | 模型 ID，必须能在价格表中找到 |
| `unit` | token 单位，支持 `M`、`K`、`tokens` |
| `input` | Base input token |
| `output` | Output token |
| `cachedInput` | OpenAI 风格 cached input |
| `cacheRead` | Anthropic 风格 cache read |
| `cacheWrite5m` | Anthropic 5m cache write |
| `cacheWrite1h` | Anthropic 1h cache write |

## 二、成本计算

每一行单独按模型价格计算：

```text
Cost_row =
  input × P_input
  + output × P_output
  + cachedInput × P_cached_input
  + cacheRead × P_cache_read
  + cacheWrite5m × P_cache_write_5m
  + cacheWrite1h × P_cache_write_1h
```

混合模型总成本：

```text
Cost_total = Σ Cost_row
```

精算引擎同时返回：

- row-level cost
- total USD / CNY cost
- byModel aggregation
- byProvider aggregation

## 三、购买力计算

方案购买力：

```text
Model_power_per_cny =
  apiEquivalentValueUsd / actualCostCny
```

风险修正购买力：

```text
Risk_adjusted_model_power_per_cny =
  Model_power_per_cny × riskFactor
```

## 四、验证用例

当前测试覆盖：

- Sonnet 4.6 heavy profile：`$8,494.5`
- 70% Sonnet + 30% Haiku mixed profile：`$6,795.6`
- ChatGPT Plus profile：`$2.88 / ¥1`
- Claude Max 20x heavy profile：`$6.07 / ¥1`

运行：

```powershell
node scripts/cost-engine.test.mjs
```

---

**更新时间**：2026-05-09  
**事实源**：`data/pricing.json`、`data/plan-baselines.json`
