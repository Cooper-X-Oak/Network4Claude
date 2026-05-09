# 官方订阅容量与 API 等价购买力

本文件只保留当前订阅容量模型。官方 Plan 不视为固定 token 池，而是用官方消息/任务基线、用户 workload profile 和官方 API 价格换算成 API 等价模型购买力。

数据源：

- [../data/plan-baselines.json](../data/plan-baselines.json)
- [../data/pricing.json](../data/pricing.json)
- [08-calculator-design.md](08-calculator-design.md)

## 一、核心公式

```text
Value_api_equivalent =
  Capacity_units_per_month × Avg_api_cost_per_unit
```

```text
Model_power_per_cny =
  Value_api_equivalent_usd / Actual_cost_cny
```

```text
Risk_adjusted_model_power_per_cny =
  Model_power_per_cny
  × Availability_factor
  × Fulfillment_factor
  × Compliance_factor
  × Exit_risk_factor
```

## 二、ChatGPT / Codex 示例

默认 light chat profile：

```text
Model: GPT-5.5
Input per message: 1,500 tokens
Output per message: 100 tokens
API cost per message: $0.0105
```

Plus 30 天消息基线：

```text
Messages_30d = 160 × 24 / 3 × 30 = 38,400
Value_api_equivalent = 38,400 × $0.0105 = $403
Actual_cost = $20 × 7 = ¥140
Model_power_per_cny = $403 / ¥140 = $2.88 / ¥1
```

Pro 20x：

```text
Value_api_equivalent = $403 × 20 = $8,064
Actual_cost = $200 × 7 = ¥1,400
Model_power_per_cny = $8,064 / ¥1,400 = $5.76 / ¥1
```

## 三、Claude 示例

默认 heavy Claude Code-like profile：

```text
Model: Claude Sonnet 4.6
Input per message: 8,488 tokens
Output per message: 404 tokens
Cache read per message: 113,426 tokens
API cost per message: $0.06555
```

Claude Max 20x 30 天消息基线：

```text
Messages_30d = 900 × 24 / 5 × 30 = 129,600
Value_api_equivalent = 129,600 × $0.06555 = $8,495
Actual_cost = $200 × 7 = ¥1,400
Model_power_per_cny = $8,495 / ¥1,400 = $6.07 / ¥1
```

## 四、为什么不再使用固定倍数

过去用某个个人 workload 反推固定订阅倍数，容易把样本误当成官方容量。当前口径改为：

1. 官方 Plan 提供容量基线。
2. workload profile 定义每次消息/任务的 token 结构。
3. 官方 API 价格计算每次消息/任务的 API 等价成本。
4. 三者相乘得到 API 等价模型购买力。

因此，订阅价值不是一个全局固定倍数，而是随 profile 改变。

## 五、用于中转站比较

中转站、sub2api 和号池服务通常会把多个账号共享并尽量榨干月度容量。因此横向比较时，应把官方订阅换算为：

```text
Gross_arbitrage_ratio =
  Plan_value_api_equivalent / Subscription_fee
```

再结合：

```text
Sub2api_floor =
  (Subscription_fee + Network_cost + Account_ops + Risk_reserve)
  / Safe_capacity
```

低于上游成本或低于可持续下限的服务，需要标记风险，不参与正常推荐。

---

**更新时间**：2026-05-09  
**事实源**：`data/plan-baselines.json`、`data/pricing.json`
