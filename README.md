# Network4Claude

Network4Claude 是一个面向 AI 订阅、API、中转站和自建网络方案的成本与网络环境研究项目。

当前项目已经从“纯净线路搭建指南”扩展为两条主线：

- **网络环境**：为 Claude / ChatGPT / Codex 等高级订阅提供稳定、纯净、可复制的访问环境。
- **成本测算**：用官方 API 价格、官方 Plan 基线和 API 等价模型购买力，统一比较官方 API、官方订阅、正规中转站、sub2api、反代、自建号池等方案。

## 当前事实源

所有活跃文档必须与以下文件保持一致：

- [data/pricing.json](data/pricing.json)：官方 API token 单价，按模型和 token 类型维护。
- [data/plan-baselines.json](data/plan-baselines.json)：官方 Plan 基线、API 等价模型购买力 profile、Codex credit rate card。
- [docs/08-calculator-design.md](docs/08-calculator-design.md)：成本计算器的当前产品模型、公式、渠道风险模型和推荐逻辑。
- [calculator.html](calculator.html)：当前静态计算器原型。
- [skills/doc-consistency-guardian/SKILL.md](skills/doc-consistency-guardian/SKILL.md)：本仓库文档一致性治理规则。

## 核心指标

本项目统一使用 **API 等价模型购买力** 做横向比较：

```text
Model_power_per_cny =
  Value_api_equivalent_usd / Actual_cost_cny
```

含义：用户实际花 1 元人民币，获得多少美元的官方 API 等价模型能力。

同时使用风险修正购买力：

```text
Risk_adjusted_model_power_per_cny =
  Model_power_per_cny
  × Availability_factor
  × Fulfillment_factor
  × Compliance_factor
  × Exit_risk_factor
```

这个指标用于比较：

- 官方订阅
- 官方 API
- OpenRouter 类透明中转
- sub2api / 订阅转 API
- 反代 / 私有代理
- 自建号池
- 异常低价渠道

## 文档结构

- [01-决策过程](docs/01-decision.md)：为什么需要纯净网络环境。
- [02-VPS选择](docs/02-vps-selection.md)：VPS 线路和供应商对比。
- [03-搭建指南](docs/03-setup-guide.md)：自建网络环境步骤。
- [04-多用户配置](docs/04-multi-user.md)：小团队共享配置和注意事项。
- [05-成本分析](docs/05-cost-analysis.md)：当前成本模型总览。
- [06-实际用量成本](docs/06-actual-usage-cost.md)：基于真实 token 用量的 API 成本测算。
- [07-订阅容量测算](docs/07-subscription-capacity-calculator.md)：官方 Plan 的 API 等价容量与购买力测算。
- [08-计算器设计](docs/08-calculator-design.md)：计算器产品设计与公式系统。
- [09-精算引擎](docs/09-precision-calculation-engine.md)：从混合模型用量到成本和购买力的确定计算链。

## 项目状态

- [x] 纯净线路方案决策
- [x] VPS 选择与搭建文档
- [x] 官方 API 价格参数化
- [x] 官方 Plan API 等价模型购买力建模
- [x] 中转站 / sub2api / 反代风险模型
- [x] 文档一致性治理 skill
- [x] 精算引擎：混合模型用量到成本与购买力
- [ ] 计算器 UI 完整实现新公式
- [ ] 中转站动态价格库
- [ ] 二阶段：本地 usage/cache 文件导入与混合模型用量聚合
- [ ] 自动一致性检查脚本

## 文档治理

本仓库不保留互相冲突的旧结论。更新价格、公式、模型名、Plan 限额、推荐逻辑时，必须同步检查 README、AGENTS、CLAUDE、docs、notes、data、calculator 和 skills。

执行一致性治理时使用：

```text
Use $doc-consistency-guardian to audit and update Network4Claude documentation consistency.
```

## 许可

MIT License
