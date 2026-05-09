# 成本分析总览

本文件只保留当前成本模型的概览。可入公式的价格参数来自 [../data/pricing.json](../data/pricing.json)，官方 Plan 基线和 API 等价模型购买力来自 [../data/plan-baselines.json](../data/plan-baselines.json)。完整公式见 [08-calculator-design.md](08-calculator-design.md)。

## 一、当前比较口径

本项目不再用“每条消息单价”做主指标，因为消息长度、缓存、模型和上下文窗口差异太大。当前统一使用：

```text
Model_power_per_cny =
  Value_api_equivalent_usd / Actual_cost_cny
```

含义：用户实际花 1 元人民币，获得多少美元的官方 API 等价模型能力。

同时输出风险修正购买力：

```text
Risk_adjusted_model_power_per_cny =
  Model_power_per_cny
  × Availability_factor
  × Fulfillment_factor
  × Compliance_factor
  × Exit_risk_factor
```

## 二、官方 API 基线

官方 API 是稳定价格基线。以 Sonnet 4.6 为例：

| Token 类型       | USD / 1M tokens |
| -------------- | --------------- |
| Base Input     | $3              |
| Cache Write 5m | $3.75           |
| Cache Write 1h | $6              |
| Cache Read     | $0.3            |
| Output         | $15             |

API 成本必须分项计算：

```text
Cost_api_usd =
  T_uncached_input × P_input
  + T_output × P_output
  + T_cache_read × P_cache_read
  + T_cache_write_5m × P_cache_write_5m
  + T_cache_write_1h × P_cache_write_1h
```

缓存不是免费抵消 token，而是把部分 Base Input 计费替换为 Cache Read 计费，并可能增加 Cache Write 成本。

## 三、官方订阅基线

官方订阅的价值不按订阅费直接比较，而是换算为 API 等价模型购买力：

```text
Value_api_equivalent =
  Capacity_units_per_month × Avg_api_cost_per_unit
```

当前默认 profile 示例：

| Plan / profile                       | 订阅成本          | API 等价模型购买力 | 表面购买力      |
| ------------------------------------ | ------------- | ----------- | ---------- |
| ChatGPT Plus / GPT-5.5 light chat    | $20 ≈ ¥140    | $403        | $2.88 / ¥1 |
| ChatGPT Pro 20x / GPT-5.5 light chat | $200 ≈ ¥1,400 | $8,064      | $5.76 / ¥1 |
| Claude Max 20x / Sonnet code-heavy   | $200 ≈ ¥1,400 | $8,495      | $6.07 / ¥1 |

这些数值是 profile 驱动的估算，不是官方承诺的固定 token 池。更长上下文、更高输出比例、更高缓存读取量会提高 API 等价值。

## 四、渠道类型

| 渠道             | 主要成本                   | 适用比较方式        | 风险处理                    |
| -------------- | ---------------------- | ------------- | ----------------------- |
| 官方 API         | 官方 token 成本            | API 成本基线      | 低风险                     |
| 官方订阅           | 月费 + 网络成本              | API 等价模型购买力   | 标注 profile 和 confidence |
| 透明中转           | 上游 API + 平台费 + 支付费     | 相对官方 API 加价倍数 | 看上游透明度                  |
| sub2api / 号池   | 订阅费 + 账号池 + 运维 + 风险准备金 | 订阅转 API 可持续下限 | 扣除号池损耗和封号风险             |
| 反代 / 私有代理      | 上游 API 或订阅 + 网络 + 维护   | 按真实上游类型计算     | 透明度折价                   |
| 黑卡 / 漏洞 / 异常低价 | 成本外部化或未真实支付            | 不作为可持续价格      | 高风险，不推荐                 |

## 五、可持续价格下限

正规渠道不能长期低于真实上游成本。中转站或号池服务的下限为：

```text
Sustainable_floor =
  Upstream_variable_cost
  + Infra_cost_per_token
  + Payment_fee
  + Support_margin
  + Risk_reserve
```

订阅转 API 的下限为：

```text
Safe_capacity =
  Plan_capacity_token_equivalent × Utilization_factor × Stability_haircut

Sub2api_floor =
  (Subscription_fee + Network_cost + Account_ops + Risk_reserve)
  / Safe_capacity
```

如果报价低于上游成本，标记 `below_upstream_cost`。如果报价低于可持续下限但高于上游成本，标记 `below_sustainable_floor`。

## 六、推荐原则

1. 先按实际 token profile 计算官方 API 成本。
2. 再把官方订阅换算为 API 等价模型购买力。
3. 中转站按实际价格表计算，不使用未经验证的市场估算进入公式。
4. 订阅转 API 和反代必须计算风险修正购买力。
5. 低于上游成本的服务不参与推荐，只做风险提示。

---

**更新时间**：2026-05-09  
**事实源**：`data/pricing.json`、`data/plan-baselines.json`、`docs/08-calculator-design.md`
