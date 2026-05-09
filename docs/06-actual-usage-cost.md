# 实际用量成本测算

本文件记录一个重度使用 profile 的 API 成本测算。价格参数来自 [../data/pricing.json](../data/pricing.json)，公式来自 [08-calculator-design.md](08-calculator-design.md)。

## 一、输入数据

| 指标 | 数值 | 说明 |
|------|------|------|
| Base Input | 1,100M | 未区分可缓存与不可缓存输入时，先作为输入总量 |
| Output | 52.3M | 输出 token |
| Cache Read | 14,700M | 假设全部为缓存读取 |
| Cache Write | 0M | 未提供写入数据，示例中不计入 |
| 汇率 | 1 USD = 7 CNY | 示例汇率 |

该 profile 是代码/长上下文/高缓存读场景，不代表普通聊天。

## 二、官方 API 成本

### Sonnet 4.6

```text
Input:  1,100M × $3 = $3,300
Output: 52.3M × $15 = $784.5
Cache:  14,700M × $0.3 = $4,410
Total:  $8,494.5 ≈ ¥59,462
```

### Opus 4.7

```text
Input:  1,100M × $5 = $5,500
Output: 52.3M × $25 = $1,307.5
Cache:  14,700M × $0.5 = $7,350
Total:  $14,157.5 ≈ ¥99,103
```

### Haiku 4.5

```text
Input:  1,100M × $1 = $1,100
Output: 52.3M × $5 = $261.5
Cache:  14,700M × $0.1 = $1,470
Total:  $2,831.5 ≈ ¥19,821
```

Haiku 价格低，但不一定能承担同等复杂度任务。模型路由应基于任务质量约束，而不是只按单价排序。

## 三、混合路由示例

### 70% Sonnet + 30% Haiku

```text
Sonnet:
  Input:  770M × $3 = $2,310
  Output: 36.61M × $15 = $549.15
  Cache:  10,290M × $0.3 = $3,087
  Subtotal: $5,946.15

Haiku:
  Input:  330M × $1 = $330
  Output: 15.69M × $5 = $78.45
  Cache:  4,410M × $0.1 = $441
  Subtotal: $849.45

Total: $6,795.60 ≈ ¥47,569
```

相对纯 Sonnet：

```text
Savings = $8,494.5 - $6,795.6 = $1,698.9 ≈ ¥11,892
```

## 四、缓存敏感性

当前 Sonnet profile 中缓存读取成本：

```text
Cache_read_cost = 14,700M × $0.3 = $4,410
Share = $4,410 / $8,494.5 = 51.9%
```

如果缓存读取减少 50%：

```text
Savings = 7,350M × $0.3 = $2,205 ≈ ¥15,435
```

如果缓存命中是从未缓存输入转换而来，节省应按价差计算：

```text
Savings_cache =
  T_cache_read × (P_input - P_cache_read)
  - T_cache_write × P_cache_write
```

## 五、结论

- 该用量在官方 API 下约为 Sonnet `$8,494.5 / 月`。
- 网络成本 ¥29/月 相对 API 成本可忽略，但对稳定性仍重要。
- 真实优化优先级是：模型路由、缓存策略、上下文压缩、批处理、请求去重。
- 若把该 profile 用作官方订阅 API 等价购买力估算，必须明确 profile 和 confidence，不能当成官方固定 token 池。

---

**更新时间**：2026-05-09  
**事实源**：`data/pricing.json`、`docs/08-calculator-design.md`
