# 渠道价格数据采集流程

本文件说明 `data/channels.json` 里的价格数据如何从 `estimated`（粗估）升级到 `verified`（核实），以及人工核对的节奏。

---

## 1. 数据状态字段

每条渠道有 `price_data_status` 字段，三种取值：

| status | 含义 | UI 表现 |
|---|---|---|
| `estimated` | 粗估，未人工核实 | ⚠️ "估算" 标签，提示用户自行核对 |
| `verified` | 最近 30 天内已核实 | ✅ "已核实" 标签，附核实日期 |
| `outdated` | 超过 30 天未核实 | 🕒 "需重新核实" 标签 |

任何 channel 都默认从 `estimated` 起步。v1 发布的 16-20 个模板全部是 `estimated`。

---

## 2. 核实流程（半手动）

### 2.1 单条核实

打开渠道官网 → 找到 token 单价表 → 跟 `data/channels.json` 对照：

- `effective_cny_per_usd`：用渠道实际 token 单价反算（详见 §4）
- `monthly_flat_cny`：抓取主要套餐价格区间
- `supports_models`：删除已下架、添加新增
- `tags`：补充新支付方式 / 新限制

更新后修改：
```json
"price_data_status": "verified",
"price_data_updated_at": "2026-XX-XX",
"price_data_source": "实际网页 URL"
```

### 2.2 批量核实节奏

| 节奏 | 范围 | 触发 |
|---|---|---|
| 每月 1 次 | 全部 channels | 月初 |
| 每周 1 次 | 用户标记"价格异常"的条目 | 用户反馈 |
| 即时 | 渠道公开降价 / 涨价 / 跑路新闻 | 事件驱动 |

每次核实后跑一遍 lint（见 §5）。

---

## 3. 自动化路径（v2 才做）

部分渠道开放了公开价格 API，可写脚本自动同步：

- OpenRouter 提供 `https://openrouter.ai/api/v1/models` 公开返回价格
- 其他渠道一般没有，需要爬虫

v1 阶段**只做人工**，不写爬虫——理由：
- 人工核实成本可控（30 分钟 / 月）
- 自动爬虫会被反爬封禁，维护成本高
- 数据状态字段已经诚实告诉用户"这是估算"，不至于误导

v2 阶段：先做 OpenRouter 自动同步，其他渠道继续人工。

---

## 4. effective_cny_per_usd 反算公式

把渠道的实际 token 单价折算到统一可比维度：

```text
effective_cny_per_usd =
  渠道用户实付 CNY 总价
  ÷
  官方 API 同等用量计费的 USD 总价
```

举例：渠道卖 Claude Sonnet 4.6 input 22 CNY/1M，官方是 $3/1M。
```
22 CNY / (3 USD × 7 CNY/USD) ≈ 1.05 → 表示渠道相比官方加价 5%。
但 effective_cny_per_usd 是按 USD 计价：22 / 3 ≈ 7.33 CNY/USD。
```

对应 calculator 的成本公式：用户用量 × `effective_cny_per_usd` ≈ 实付 CNY。

---

## 5. Lint 规则（要加到 doc-consistency-guardian）

- [ ] 所有 channels 的 `price_data_status` 是 `estimated` / `verified` / `outdated` 之一
- [ ] 所有 `verified` 条目 `price_data_updated_at` 不超过 30 天
- [ ] 所有 `verified` 条目 `price_data_source` 非空
- [ ] 所有 `effective_cny_per_usd` 在 0.5-15 范围内（异常值要标记）
- [ ] 所有 `risk` 四维都在 0-1 范围内
- [ ] 同一 `category_id` 内 `effective_cny_per_usd` 不应差距过大（>2 倍要审查）

---

## 6. 何时新增条目

新增条目的门槛比较低，但**必须**满足：
- 公开知名度（用户在 X/小红书/掘金/v2ex 等可以搜到讨论）
- 公开网址（`url` 字段非空，或者明确是"无品牌的群组类"）
- 至少一条 `tags` 描述其差异化

不接受新增的：
- 朋友圈传播的小作坊（无公开页面）
- 已经跑路的渠道（设 `status: outdated` 并不再展示）

---

## 7. 当前状态（2026-05-12）

- 全部 17 个 channels 状态：**estimated**
- 待人工核实优先级排序：
  1. AiHubMix / OhMyGPT / API2D（高知名度，用户使用率高）
  2. OpenRouter（已知有公开 API 可半自动）
  3. 其他中转
  4. 号池类（口径多变，最难核实）
