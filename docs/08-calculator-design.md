# 成本计算器设计文档

## 一、计算器概述

### 1.1 目标

帮助用户根据实际用量、官方 Plan API 等价模型购买力和渠道风险，比较官方订阅、官方 API、中转站、sub2api、反代和自建方案。

### 1.2 核心功能

- 输入：用户的 input/output/cache token 用量、官方 Plan、渠道价格表和风险参数
- 输出：各方案成本、API 等价模型购买力、风险修正购买力
- 推荐：只在容量足够且风险可接受的方案中选择

---

## 二、方案对比

### 2.1 官方 API 直接付费

**成本计算**：

```
成本 = API 分项成本 + 网络成本
```

API 分项成本见“八、统一计算公式”，按 Base Input、Output、Cache Read、Cache Write 分别计算。

**优势**：

- 按量付费，用多少付多少
- 缓存便宜（0.1x 输入价格）
- 无封号风险

**劣势**：

- 需要梯子（网络成本）
- 需要信用卡
- 轻度用户不划算

---

### 2.2 官方订阅 Pro ($20/月)

**成本计算**：

```
成本 = $20 × 汇率 + 网络成本 = ¥140 + ¥29 = ¥169
```

**API 等价模型购买力**：

```
Value_api_equivalent =
  Capacity_units_per_month × Avg_api_cost_per_unit
```

具体数值来自 `data/plan-baselines.json` 中的 workload profile，不再使用全局固定倍数。

**优势**：

- 固定成本，可预测
- 中度用户性价比高
- 稳定可靠

**劣势**：

- 有用量限制
- 需要梯子
- 重度用户不够用

---

### 2.3 官方订阅 Max ($200/月)

**成本计算**：

```
成本 = $200 × 汇率 + 网络成本 = ¥1400 + ¥29 = ¥1429
```

**API 等价模型购买力**：

```
Value_api_equivalent =
  Capacity_units_per_month × Avg_api_cost_per_unit
```

Max 5x / 20x 的购买力随 profile 改变；示例见“5.3 API 等价模型购买力”。

**优势**：

- 大用量支持
- 高优先级
- 更少限流

**劣势**：

- 价格高
- 需要梯子
- 轻中度用户浪费

---

### 2.4 普通中转站

**成本计算**：

```
成本 = 中转站分项 API 成本 + 风险成本
```

**定价特点**：

- 默认参数：输入/输出按官方价 1.2 倍，缓存读取按官方价 5 倍
- 实际计算时优先使用用户填入的中转站价格表

**优势**：

- 无需梯子
- 无需信用卡
- 即开即用

**劣势**：

- 缓存贵（重度用户不划算）
- 可能跑路
- 数据隐私风险

---

### 2.5 廉价中转站

**成本计算**：

```
成本 = 中转站分项 API 成本 + 风险成本 × 2
```

**定价特点**：

- 默认参数：输入/输出按官方价 1.5 倍，缓存读取按官方价 10 倍
- 实际计算时优先使用用户填入的中转站价格表

**优势**：

- 轻度用户可能更便宜
- 无需梯子

**劣势**：

- 缓存极贵
- 高风险（跑路、限流）
- 服务质量差

---

### 2.6 自建中转站（团队）

**成本计算**：

```
成本 = API 成本 + 基础设施成本（VPS + 开发维护）
基础设施成本 ≈ ¥500/月（可分摊）
```

**适用场景**：

- 团队 10-20 人
- 月用量 > 10x Pro
- 有技术能力

**优势**：

- 完全可控
- 数据安全
- 成本可分摊

**劣势**：

- 需要技术能力
- 初期投入高
- 维护成本

---

## 三、三种计量方式

### 3.1 用户承担成本

**定义**：用户实际支付的人民币

**计算**：

```
用户成本 = API 成本 + 网络成本 + 风险成本 + 其他隐性成本
```

**示例**：

- 官方 API：¥8,495（API）+ ¥29（网络）= ¥8,524
- 中转站：¥12,000（API）+ ¥0（网络）+ ¥100（风险）= ¥12,100

---

### 3.2 站内货币

**定义**：中转站的积分/点数/余额

**特点**：

- 与美元不是 1:1 关系
- 通常有充值优惠
- 可能有有效期

**换算**：

```
站内货币 = 用户充值金额 / 充值汇率
实际成本 = Token 用量 × 站内价格 × 充值汇率
```

**示例**：

- 充值 ¥100 = 15 美元站内余额（汇率 6.67）
- Sonnet Input: $3/1M → 实际成本 = 3 × 6.67 = ¥20/1M

---

### 3.3 模型货币

**定义**：API 的 token 计费（美元）

**特点**：

- 官方定价标准
- 不同模型价格不同
- 缓存有折扣

**官方 API 定价表**（USD / 1M tokens）：

| 模型                | Base Input | Cache Write 5m | Cache Write 1h | Cache Read | Output |
| ----------------- | ---------- | -------------- | -------------- | ---------- | ------ |
| Claude Opus 4.7   | $5         | $6.25          | $10            | $0.5       | $25    |
| Claude Sonnet 4.6 | $3         | $3.75          | $6             | $0.3       | $15    |
| Claude Haiku 4.5  | $1         | $1.25          | $2             | $0.1       | $5     |

**数据来源**：Anthropic Claude pricing documentation（2026-05-09 校准）。

---

## 四、缓存价格差异

### 4.1 官方缓存定价

**Cache Read**：

- Opus 4.7: $0.5/1M（输入的 10%）
- Sonnet 4.6: $0.3/1M（输入的 10%）
- Haiku 4.5: $0.1/1M（输入的 10%）

**优势**：

- 极低的缓存成本
- 鼓励使用缓存
- 重度用户友好

---

### 4.2 中转站缓存定价

**普通中转站**：

- 默认参数：`cache_read_price = official_cache_read × 5`
- Sonnet 4.6 示例：$0.3 × 5 = $1.5 / 1M tokens

**廉价中转站**：

- 默认参数：`cache_read_price = official_cache_read × 10`
- Sonnet 4.6 示例：$0.3 × 10 = $3 / 1M tokens

**原因**：

- 中转站也要付官方缓存费
- 加上自己的利润和成本
- 缓存管理复杂度高

---

### 4.3 对不同用户的影响

**轻度用户**（缓存 < 1B/月）：

```
官方：1,000M × $0.3 = $300 ≈ ¥2,100
中转站：1,000M × $1.5 = $1,500 ≈ ¥10,500
差额：¥8,400（但总量小，影响有限）
```

**重度用户**（缓存 > 10B/月）：

```
官方：10,000M × $0.3 = $3,000 ≈ ¥21,000
中转站：10,000M × $1.5 = $15,000 ≈ ¥105,000
差额：¥84,000（巨大差异！）
```

**结论**：

- 轻度用户：缓存价格影响小，中转站可接受
- 重度用户：缓存价格影响大，必须用官方

---

## 五、官方 Plan 基线

官方 Plan 是所有方案的参照基线，必须单独维护。它分两类：

- **价格固定**：订阅月费、官方 API 单价、Codex credit rate card 可以直接进入公式。
- **容量基线固定但需转译**：官方通常给的是消息数、任务数、5 小时窗口或倍率，不一定给固定 token 池；计算器需要用用户输入的平均任务 profile 转换成 token-equivalent capacity。

### 5.1 Claude 订阅基线

按官方使用说明，Claude Pro/Max 使用量以 5 小时窗口重置，可作为容量规划基线。月度容量按 30 天、每天 `24 / 5 = 4.8` 个窗口估算。

```
Plan_messages_30d = Messages_per_5h × 24 / 5 × 30
Plan_token_capacity =
  Plan_messages_30d × Avg_tokens_per_message × Utilization_factor
```

| 方案 | 月费 | 短对话消息/5h | 30 天消息基线 | 说明 |
|------|------|---------------|---------------|------|
| Claude Pro | $20 | 45 | 6,480 | 官方示例级别的短对话基线 |
| Claude Max 5x | $100 | 225 | 32,400 | Pro 的 5 倍基线 |
| Claude Max 20x | $200 | 900 | 129,600 | Pro 的 20 倍基线 |

注意：这不是官方承诺的固定 token 池。长上下文、附件、Claude Code、模型选择和系统负载会改变实际可用量，所以计算器要显示 `confidence` 和 `utilization_factor`。

### 5.2 Codex / OpenAI 基线

Codex 需要同时维护两套基线：

- **Plan included usage**：Plus/Pro 等计划内使用量，按官方给出的本地消息数、云任务数或账户 usage dashboard 读取。
- **Credit rate card**：当进入 flexible usage / credit 模式时，按官方每 1M token credit 单价精确计算。

```
Cost_codex_credits =
  T_input × Credit_input
  + T_cached_input × Credit_cached_input
  + T_output × Credit_output
```

计算器实现时，Codex 的 token credit 模式可以精确计算；Plan included usage 则作为固定参照容量，输出消息数/任务数基线和 token-equivalent 估算。

### 5.3 API 等价模型购买力

为了和中转站、sub2api、反代号池统一计价，官方 Plan 需要转换成 **API 等价模型购买力**。

```
Value_api_equivalent =
  Capacity_units_per_month
  × Avg_api_cost_per_unit

Avg_api_cost_per_unit =
  T_input_per_unit × P_input
  + T_cached_input_per_unit × P_cached_input
  + T_output_per_unit × P_output
  + T_cache_read_per_unit × P_cache_read
```

这个值不是订阅售价，而是“如果把同等使用量按 API 购买，需要花多少钱”。中转站实际做的是多个账号共享和号池调度，所以也应该统一用这个价值衡量其真实成本与套利空间。

**ChatGPT Plus / Pro 示例**：

用 GPT-5.5 官方 API 价格估算，假设单条消息平均为 `1500 input + 100 output`，且不计缓存：

```
Avg_cost_per_message = 1,500 / 1M × $5 + 100 / 1M × $30 = $0.0105
Plus monthly messages = 160 × 24 / 3 × 30 = 38,400
Plus API-equivalent value = 38,400 × $0.0105 = $403
Pro 20x API-equivalent value = $403 × 20 = $8,064
```

这解释了“Plus 约 $400、Pro 20x 约 $8,000 模型购买力”的量级。但它依赖 workload profile；如果平均消息更长、输出更多或使用推理模式，API 等价值会更高。

**Claude Max 20x 示例**：

使用 Sonnet 4.6 API 价格和重度 Claude Code-like profile：

```
Avg_cost_per_message =
  8,488 / 1M × $3
  + 404 / 1M × $15
  + 113,426 / 1M × $0.3
  = $0.06555

Max 20x monthly messages = 900 × 24 / 5 × 30 = 129,600
Max 20x API-equivalent value = 129,600 × $0.06555 = $8,495
```

这个 profile 对应代码/长上下文/高缓存读场景，不应用于普通聊天。计算器必须允许用户切换 profile，并展示 API 等价值的敏感性。

### 5.4 每元模型购买力

有了 API 等价模型购买力后，所有方案都可以统一换算成：

```
Model_power_per_cny =
  Value_api_equivalent_usd / Actual_cost_cny
```

含义：用户实际花 1 元人民币，买到了多少美元的官方 API 等价模型能力。

反过来也可以计算：

```
Cny_per_api_equivalent_usd =
  Actual_cost_cny / Value_api_equivalent_usd
```

含义：买到 1 美元官方 API 等价能力，实际需要花多少人民币。

示例：

```
ChatGPT Plus:
  Value_api_equivalent = $403
  Actual_cost = $20 × 7 = ¥140
  Model_power_per_cny = 403 / 140 = $2.88 / ¥1

ChatGPT Pro 20x:
  Value_api_equivalent = $8,064
  Actual_cost = $200 × 7 = ¥1,400
  Model_power_per_cny = 8064 / 1400 = $5.76 / ¥1

Claude Max 20x heavy profile:
  Value_api_equivalent = $8,495
  Actual_cost = $200 × 7 = ¥1,400
  Model_power_per_cny = 8495 / 1400 = $6.07 / ¥1
```

这个指标适合横向比较：
- 官方订阅：实际成本低，API 等价值高，模型购买力倍数通常最高。
- 官方 API：`Model_power_per_cny ≈ 1 / 汇率`，是稳定基线。
- 正规中转站：应低于或接近官方 API 基线，差额来自平台费、支付费和售后。
- 订阅转 API / sub2api：可能高于官方 API 基线，但必须扣除号池损耗、封号风险、维护成本。
- 黑卡、漏洞、异常低价：表面购买力可能极高，但风险修正后应大幅折价，甚至不参与推荐。

---

## 六、隐性成本

### 6.1 网络成本

**官方方案必需**：

- 自建 VPS：¥29/月（搬瓦工）
- 商业梯子：¥17-50/月
- 企业专线：¥200+/月

**中转站不需要**：

- 直接访问，无需梯子
- 但可能有其他限制

---

### 6.2 合规成本

**企业用户**：

- 数据合规审查
- 安全评估
- 合同签署
- 可能需要私有化部署

**成本**：

- 小企业：¥0-1,000/月
- 中大企业：¥5,000-50,000/月

---

### 6.3 身份成本

**官方**：

- 需要国外手机号/邮箱
- 需要信用卡
- 可能需要身份验证

**中转站**：

- 通常只需邮箱
- 支持支付宝/微信
- 门槛低

---

### 6.4 风险成本

**被封号风险**：

- 官方：低（遵守规则即可）
- 中转站：中高（可能被官方封禁）

**服务中断风险**：

- 官方：极低
- 中转站：中高（可能跑路）

**数据泄露风险**：

- 官方：低
- 中转站：中高（不可控）

**量化**：

```
风险成本 = 潜在损失 × 发生概率
示例：被封号导致业务中断，损失 ¥10,000，概率 10%
风险成本 = ¥10,000 × 10% = ¥1,000/月
```

---

## 七、不同用户群体分析

### 7.1 轻度用户（< 100M input/月）

**特征**：

- 偶尔使用
- 对价格敏感
- 对稳定性要求不高

**推荐逻辑**：

1. 如果中转站价格高于可持续下限且风险修正购买力合理，可以选择中转站。
2. 如果重视稳定性和隐私，优先官方订阅 + 纯净线路。
3. 低于上游成本或来源不明的异常低价渠道不参与推荐。

**原因**：

- 总成本低，差异不大
- 无需折腾梯子
- 风险可接受

---

### 7.2 中度用户（100-500M input/月）

**特征**：

- 日常使用
- 需要稳定性
- 有一定预算

**推荐逻辑**：

1. Pro 订阅 + 纯净线路
2. 官方 API（如果用量波动大或需要精确可控）
3. 透明中转（如果价格、售后和合规风险可接受）

**原因**：

- 固定成本可预测
- 稳定性好
- 性价比高

---

### 7.3 重度用户（> 500M input/月）

**特征**：

- 高频使用
- 大量缓存
- 对稳定性要求高

**推荐逻辑**：

1. 官方 API + 纯净线路
2. Max 订阅（如果在容量基线内）
3. sub2api / 号池只做风险修正后比较

**原因**：

- 缓存便宜，节省大量成本
- 稳定可靠
- 按量付费更灵活

---

### 7.4 团队用户（10-20 人）

**特征**：

- 多人使用
- 用量巨大（可能 > 10x Pro）
- 需要统一管理

**推荐逻辑**：

1. 自建中转站
2. 多个 Max 订阅
3. 企业 API 账号

**原因**：

- 成本可分摊
- 统一管理方便
- 数据安全可控

**成本对比**：

```
方案 A：20 个 Pro 订阅 = 20 × ¥169 = ¥3,380/月
方案 B：自建中转站 = API 成本 + 基础设施 + 运维 + 风险准备金
方案 C：10 个 Max 订阅 = 10 × ¥1,429 = ¥14,290/月（如果用量极大）
```

---

## 八、统一计算公式

### 8.1 Token 口径

缓存不能直接把 token 成本抵消为 0。正确口径是：缓存命中的输入不再按 Base Input 计费，而是按 Cache Read 计费；首次写入缓存还要按 Cache Write 计费。

```
T_cacheable_input = 可缓存输入 Token
T_cache_read = T_cacheable_input × cache_hit_ratio
T_uncached_input = T_input - T_cache_read
T_cache_write = T_cacheable_input × cache_write_ratio
```

如果用户只有粗略估算，可以先用：

```
T_cacheable_input = T_input
T_cache_write = T_input × (1 - cache_hit_ratio)
```

### 8.2 API 成本

```
Cost_api_usd =
  T_uncached_input × P_input
  + T_output × P_output
  + T_cache_read × P_cache_read
  + T_cache_write_5m × P_cache_write_5m
  + T_cache_write_1h × P_cache_write_1h
```

说明：

- 所有 token 输入以 M 为单位时，价格使用 USD / 1M tokens。
- 如果不知道 5m / 1h 缓存写入比例，默认全部按 5m 计算，并在结果里标注假设。
- 人民币成本：`Cost_api_cny = Cost_api_usd × USD_TO_CNY`。

### 8.3 方案成本

```
Cost_scheme =
  Cost_usage
  + Subscription_fee
  + Network_cost
  + Infrastructure_cost
  + Risk_cost
```

各方案映射：

- 官方 API：`Cost_usage = Cost_api_cny`，`Subscription_fee = 0`。
- 官方订阅：`Cost_usage = 0`，`Subscription_fee = plan_price`，但必须先检查 `eligible = T_used <= estimated_capacity`。
- 中转站：使用用户输入的中转站价格表计算 `Cost_usage`，不使用价格范围进入公式。
- 自建中转站：`Cost_usage = Cost_api_cny`，再加 VPS、域名、维护等基础设施成本。

最优方案只从 `eligible = true` 的方案里选择：

```javascript
eligibleSolutions = solutions.filter(solution => solution.eligible)
best = eligibleSolutions.sort((a, b) => a.cost - b.cost)[0]
```

### 8.4 边界提示

边界不是固定阈值，而是当前方案和候选方案成本函数的交点。

```
Cost_current(T) = Fixed_current + T × Unit_current
Cost_next(T) = Fixed_next + T × Unit_next

T_break_even = (Fixed_next - Fixed_current) / (Unit_current - Unit_next)
Delta_T = T_break_even - T_current
```

输出规则：

- `Delta_T > 0`：提示“再多用 Delta_T token，就该比较/切换到 next 方案”。
- `Delta_T <= 0`：说明当前用量已经越过边界，应优先推荐 next 方案。
- 对订阅方案，先判断容量是否足够；超限订阅只展示，不参与最优推荐。

### 8.5 缓存优化建议

缓存节省不是“总 token × 命中率 × 单一 token 价格”，而是命中输入从 Base Input 价格降到 Cache Read 价格后产生的差额。

```
Savings_cache =
  T_cache_read × (P_input - P_cache_read)
  - T_cache_write × P_cache_write
```

如果比较“命中率从 A 提升到 B”：

```
Delta_hit = B - A
Additional_savings =
  T_cacheable_input × Delta_hit × (P_input - P_cache_read)
```

建议文本示例：

- “当前命中率 40%，如果提升到 70%，按 Sonnet 4.6 价格估算，每月可节省约 ¥X。”
- “缓存写入成本较高，短会话或一次性任务不建议强行缓存。”

### 8.6 团队分摊

团队分摊复用个人成本计算，先算团队总成本，再按规则分摊。

```
Cost_total = Cost_usage_total + Fixed_team_cost
Cost_per_person_avg = Cost_total / N
Cost_per_person_usage_i = T_i / ΣT_i × Cost_usage_total
Cost_per_person_mixed_i =
  Fixed_team_cost / N
  + T_i / ΣT_i × Cost_usage_total
Savings_i = Cost_individual_i - Cost_per_person_mixed_i
```

默认推荐混合分摊：VPS、订阅、维护等固定成本平均分；API token 变量成本按量分。

---

## 九、渠道动态模型

中转站不能只按“便宜/贵”分类。它至少分为四类，每类的可持续成本下限不同。

| 渠道 | 成本结构 | 可持续价格下限 | 风险判断 |
|------|----------|----------------|----------|
| 官方 API | 官方 token 单价 + 支付成本 | `Official_api_cost` | 最稳定，基线价格 |
| 官营/透明中转（如 OpenRouter 类） | 上游 API 成本 + 平台费 + 支付费 | `Official_api_cost + Platform_margin` | 可持续，适合做横向基准 |
| sub2api / 订阅转 API | 订阅费摊销 + 账号池 + 网络 + 运维 + 风险准备金 | `(Subscription_fee + Infra + Ops + Risk_reserve) / Safe_capacity` | 取决于账号来源和容量控制 |
| 反代 / 私有代理 | 上游 API 或订阅成本 + 网络 + 维护 | 按真实上游类型计算 | 透明度低，需要风险折价 |
| 黑卡 / 漏洞 / 异常低价 | 未真实支付上游成本，或把成本外部化 | 不应视为可持续商业模型 | 标记高风险，不参与推荐 |

### 9.1 可持续价格下限

```
Sustainable_floor =
  Upstream_variable_cost
  + Infra_cost_per_token
  + Payment_fee
  + Support_margin
  + Risk_reserve
```

如果报价低于 `Upstream_variable_cost`，需要标记为异常：

```
if Quoted_price < Upstream_variable_cost:
  risk = "below_upstream_cost"
```

如果报价低于 `Sustainable_floor` 但高于上游成本，说明可能靠无售后、限流、充值沉淀、账号池超卖或服务不稳定维持：

```
if Upstream_variable_cost <= Quoted_price < Sustainable_floor:
  risk = "below_sustainable_floor"
```

### 9.2 风险修正购买力

横向对比时不能只看表面购买力，还要扣除服务风险。

```
Risk_adjusted_model_power_per_cny =
  Model_power_per_cny
  × Availability_factor
  × Fulfillment_factor
  × Compliance_factor
  × Exit_risk_factor
```

建议默认因子：

| 渠道 | Availability | Fulfillment | Compliance | Exit risk | 说明 |
|------|--------------|-------------|------------|-----------|------|
| 官方订阅 | 0.95-1.00 | 0.90-1.00 | 1.00 | 0.95-1.00 | 稳定，容量动态调整 |
| 官方 API | 0.99 | 1.00 | 1.00 | 1.00 | 最稳定基线 |
| 正规中转站 | 0.90-0.98 | 0.85-0.98 | 0.80-0.95 | 0.80-0.95 | 看上游透明度和售后 |
| sub2api / 号池 | 0.70-0.95 | 0.60-0.90 | 0.50-0.80 | 0.50-0.85 | 看账号来源、超卖率和封号率 |
| 黑卡 / 漏洞 | 0.10-0.60 | 0.10-0.70 | 0.00-0.30 | 0.00-0.50 | 默认高风险，不推荐 |

输出时同时展示：
- 表面购买力：`1 元 = N 美元 API 等价模型购买力`
- 风险修正购买力：`1 元 = N' 美元风险修正模型购买力`
- 风险标签：`official` / `transparent_proxy` / `subscription_pool` / `below_floor` / `below_upstream_cost`

### 9.3 订阅转 API 下限

订阅套利类服务不能直接拿官方 API 单价做下限，应使用订阅容量基线折算：

```
Plan_value_api_equivalent =
  Capacity_units_per_month × Avg_api_cost_per_unit

Safe_capacity =
  Plan_capacity_token_equivalent × Utilization_factor × Stability_haircut

Sub2api_floor =
  (Subscription_fee + Network_cost + Account_ops + Risk_reserve)
  / Safe_capacity

Gross_arbitrage_ratio =
  Plan_value_api_equivalent / Subscription_fee
```

如果一个服务价格长期低于 `Sub2api_floor`，商业模式大概率依赖高风险来源、超卖、跑路或低质量售后。`Gross_arbitrage_ratio` 用来衡量官方订阅本身的模型购买力杠杆，例如 Plus 的某个 profile 可能约为 `$403 / $20 = 20.2x`，Pro 20x 可能约为 `$8,064 / $200 = 40.3x`。

---

## 十、场景公式

| 场景        | 输入                             | 核心公式/逻辑                                                            | 输出                      | 可视化/提示          |
| --------- | ------------------------------ | ------------------------------------------------------------------ | ----------------------- | --------------- |
| 个人用户选方案   | 月使用量，或对话数 × 平均长度               | 分项计算 API / 订阅 / 中转站 / 自建成本；过滤超限方案后选最低成本                            | 6 种方案成本对比、最优方案、经济边界、每元模型购买力     | 条形图、最优高亮、临界点    |
| 开发者评估应用成本 | DAU、RPU、单次 input/output、缓存命中率  | `T_input_month = DAU × RPU × input_per_request × days`；再套 API 分项公式 | 月度 API 成本、用户规模成本曲线、优化建议 | DAU 成本曲线、缓存节省提示 |
| 中转站定价透明化  | 中转站 input/output/cache 单价、充值汇率、渠道类型 | `Cost_proxy / Cost_official` 得到加价倍数；再计算表面/风险修正模型购买力                  | 官方倍率、横向对比、适用人群、风险标签          | 条形图、倍率标签、风险折价        |
| 团队成本分摊    | 总方案、人数、各人用量                    | 固定成本平均分，变量成本按量分                                                    | 每人成本、相比单独购买节省           | 分摊表、饼图、节省条形图    |
| 订阅容量规划    | 订阅类型、使用比例、估算容量                 | 按订阅估算容量分配 input/output/cache；超限部分按 API 价格计算                        | token 容量、可用对话数、超限成本     | 进度条、超限警告        |

---

## 十一、计算器实现

### 11.1 输入参数

- 模型类型（Sonnet/Opus/Haiku）
- 输入 Token (M)
- 输出 Token (M)
- 可缓存输入 Token (M)
- 缓存命中率
- Cache Write 类型（5m / 1h）
- 网络成本（¥/月）
- 风险成本（¥/月）
- 中转站实际单价（可选）

### 11.2 输出结果

- 各方案成本对比（卡片形式）
- 最优方案标记
- 详细成本构成
- 超限方案提示
- 经济边界提示
- 缓存优化建议
- 每元 API 等价模型购买力
- 风险修正后的每元模型购买力

---

## 十二、使用示例

### 示例 1：官方订阅购买力

**输入**：

- ChatGPT Plus
- GPT-5.5 light chat profile
- 实际成本：$20 × 7 = ¥140
- API 等价模型购买力：$403

**输出**：

```text
Model_power_per_cny = 403 / 140 = $2.88 / ¥1
```

### 示例 2：重度 Claude Code-like profile

**输入**：

- Input: 1,100M
- Output: 52.3M
- Cache Read: 14,700M
- Model: Sonnet 4.6

**输出**：

```text
API cost = 1,100 × $3 + 52.3 × $15 + 14,700 × $0.3
         = $8,494.5 ≈ ¥59,462
```

如果该 profile 用于 Claude Max 20x 购买力估算：

```text
Value_api_equivalent ≈ $8,495
Model_power_per_cny = 8495 / 1400 = $6.07 / ¥1
```

### 示例 3：中转站风险比较

**输入**：

- 官方 API 等价成本：$100
- 用户实际支付：¥100
- 风险因子乘积：0.55

**输出**：

```text
Surface model power = 100 / 100 = $1.00 / ¥1
Risk-adjusted model power = 1.00 × 0.55 = $0.55 / ¥1
```

如果报价低于上游 API 成本或低于订阅转 API 可持续下限，结果必须标记风险，不参与推荐。

---

## 十三、总结

### 13.1 关键发现

1. **统一计价核心**：所有方案都换算成 API 等价模型购买力。
2. **缓存是关键**：缓存命中是价格替换，不是免费抵消 token。
3. **订阅有边界**：官方 Plan 是高购买力基线，但必须绑定 workload profile 和 confidence。
4. **渠道要风险折价**：异常低价不能只看表面成本，必须计算可持续下限和风险修正购买力。

### 13.2 决策树

```
是否有官方 Plan 容量可覆盖？
  ├─ 是 → 计算每元 API 等价模型购买力
  └─ 否 → 进入官方 API / 透明中转 / 自建方案比较

是否使用中转或号池？
  ├─ 是 → 检查上游成本、可持续下限、风险修正购买力
  └─ 否 → 按官方 API 或官方订阅推荐
```

### 13.3 未来优化

- 将 `calculator.html` 完整升级到 `docs/08` 的分项公式。
- 添加中转站动态价格库。
- 添加自动一致性检查脚本。
- 支持多模型、多 profile 敏感性分析。

---

**更新时间**：2026-05-09
**版本**：v1.0
