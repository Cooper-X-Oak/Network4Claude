# Network4Claude

Network4Claude 是一个面向 AI 订阅、官方 API、中转服务与自建方案的文档研究和价格测算项目。

当前仓库同时维护两条主线：

- 网络环境：为 Claude / ChatGPT / Codex 等官方订阅提供稳定、纯净、可复现的访问环境。
- 成本与风险测算：用官方 API 定价、官方 Plan 基线、API 等价购买力和渠道风险因子，统一比较官方 API、官方订阅、透明聚合、中转、sub2api、账号池和自建方案。

## 当前事实源

活动文档、静态页面、数据文件和技能说明必须与以下文件保持一致：

- [data/pricing.json](data/pricing.json)：官方 API token 单价，按模型和 token 类型维护。
- [data/plan-baselines.json](data/plan-baselines.json)：官方 Plan 基线、API 等价购买力 profile、Codex/OpenAI credit rate card。
- [data/personas.json](data/personas.json)：首页“使用画像”定义和典型月度用量画像。
- [data/channels.json](data/channels.json)：渠道目录、价格状态和风险维度。
- [data/channel-presets.json](data/channel-presets.json)：价格带和价格曲线原型的规划参数。
- [docs/08-calculator-design.md](docs/08-calculator-design.md)：当前产品模型、公式、渠道风险模型和比较逻辑。
- [docs/09-precision-calculation-engine.md](docs/09-precision-calculation-engine.md)：精算引擎 schema 与确定性计算链。
- [scripts/cost-engine.mjs](scripts/cost-engine.mjs)：复用型精算实现。
- [index.html](index.html)：当前活动静态入口页，承载价格地图与使用画像体验。
- [assets/cards/_manifest.json](assets/cards/_manifest.json)：首页画像卡资源注册表。
- [skills/doc-consistency-guardian/SKILL.md](skills/doc-consistency-guardian/SKILL.md)：仓库级文档一致性治理流程。

不要在其他文档里复制可变价格、Plan 容量、模型名称或公式，除非它们是 worked example，或明确指回上面的事实源。

## 核心指标

本项目统一使用 API 等价购买力做横向比较：

```text
Model_power_per_cny =
  Value_api_equivalent_usd / Actual_cost_cny
```

并加入风险修正：

```text
Risk_adjusted_model_power_per_cny =
  Model_power_per_cny
  × Availability_factor
  × Fulfillment_factor
  × Compliance_factor
  × Exit_risk_factor
```

这些指标用于比较：

- 官方订阅
- 官方 API
- OpenRouter 一类透明聚合
- sub2api / 订阅转 API
- 反代 / 私有代理
- 自建账号池
- 异常低价渠道

## 仓库结构

- [docs/](docs/)：活动文档与设计说明。
- [data/](data/)：机器可读的价格、Plan、画像和渠道数据。
- [scripts/](scripts/)：精算与前端原型脚本。
- [assets/](assets/)：首页卡片、占位资源与相关 manifest。
- [notes/](notes/)：过程记录和显式归档的历史实验。
- [skills/](skills/)：项目本地技能。
- [index.html](index.html)：当前活动静态入口页。
- [Design.md](Design.md)：当前首页视觉与文案约束。

## 当前状态

- [x] 纯净线路方案决策
- [x] VPS 选择与搭建文档
- [x] 官方 API 定价参数化
- [x] 官方 Plan API 等价购买力建模
- [x] 中转 / sub2api / 账号池风险分层
- [x] 文档一致性治理 skill
- [x] 精算引擎：混合模型用量到成本与购买力
- [x] 首页入口页：`index.html` + `data/personas.json`
- [x] 渠道模板数据：`data/channels.json` + `docs/channel-data-collection.md`
- [ ] 将当前前端原型完整接上 `docs/08` 的分项公式与渠道数据
- [ ] 本地 usage/cache 文件导入与混合模型聚合
- [ ] 自动一致性检查脚本

## 文档治理

本仓库不保留彼此冲突的活动结论。更新价格、公式、模型、Plan 限额、风险标签、入口页语义或渠道目录时，必须同步检查 `README.md`、`AGENTS.md`、`CLAUDE.md`、`docs/`、`notes/`、`data/`、`index.html`、`assets/`、`scripts/` 和 `skills/`。

执行一致性治理时使用：

```text
Use $doc-consistency-guardian to audit and update Network4Claude documentation consistency.
```

## 许可

MIT License
