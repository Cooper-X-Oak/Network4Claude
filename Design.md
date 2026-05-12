# Design.md — Network4Claude 设计语言

**状态**：v1 草案 · 2026-05-12
**审美锚点**：[claude.ai](https://claude.ai) — Anthropic 官方界面
**对所有 UI 决策具有约束力**。新视觉、新组件、新交互必须先对这份文件，再写代码。

---

## 0. 一句话哲学

**「这是一本暖色调的薄册子，不是一个 SaaS 仪表盘——更不是销售页面。」**

读起来像在读编辑设计的内容物，而不是在"用工具"。如果某个设计决策让页面更像 dashboard（密度↑、色彩↑、按钮亮↑、信息分块化↑），那这个决策大概率错了。

**也不替用户决定**。这是一张**价格地图**，不是推荐引擎：

- 我们让用户**看见自己在地图上的位置**
- 不告诉他"该选 X / 该避开 Y"
- 出现 "推荐 / 建议 / 你应该" 这类句式时，停下来——这一步走偏了

类比锚点：Numbeo（生活成本地图）、Glassdoor（薪资分布）、油价 App——它们不替你做决定，只让你看见分布。

---

## 1. 色彩系统

只有 **3 个家族**：纸（暖白米）、墨（黑灰）、铜（橙）。**禁止引入第四个家族**（不允许青、绿、蓝、紫、粉作为主导色）。

### 1.1 色板

| 角色 | Token | HEX | 用途 |
|---|---|---|---|
| 主背景 | `--color-bg` | `#FAF9F5` | 全站底色，暖纸调 |
| 表面 | `--color-surface` | `#F0EBE0` | 轻微分区（如表格底、引述块） |
| 表面强 | `--color-surface-strong` | `#E8E1D3` | 略深的分区（不常用） |
| 主墨 | `--color-ink` | `#1A1A1A` | 标题、正文核心字 |
| 副墨 | `--color-ink-2` | `#5C5752` | 副标、说明文字 |
| 三级墨 | `--color-ink-3` | `#8B857E` | 元信息、时间戳、占位 |
| 铜橙（强调） | `--color-accent` | `#D97757` | **全站唯一强调色** |
| 铜橙深 | `--color-accent-strong` | `#B45C3F` | 强调色的 hover / active 态 |
| 描边 | `--color-border` | `#E8E1D3` | 默认分割线、卡片描边 |
| 描边强 | `--color-border-strong` | `#D4CCB8` | 需要更明显的分隔 |
| 风险 | `--color-danger` | `#A03B2A` | 仅用于"高风险渠道"等真正的警示 |

### 1.2 使用原则

- **一屏一抹铜橙**：每个独立视口最多出现一次铜橙强调（标题某词的下划线、CTA、当前选中状态——三选一，不并存）。
- **风险色与铜橙不同时出现**：警示信息出现时铜橙退场，否则视觉打架。
- **描边代替阴影**：分层用 1 px 描边，**禁止 box-shadow**（除非是输入框焦点态的极弱 outline）。
- **不调饱和度做层级**：层级用尺寸 / 字重 / 间距区分，不靠"略浅一点的橙"或"半透明蓝"等。

---

## 2. 字体系统

### 2.1 字体栈

```css
--font-serif: "Newsreader", "Source Serif Pro", "Charter", Georgia, serif;
--font-sans:  "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
              "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
--font-mono:  "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace;
```

中文回退用 PingFang / 微软雅黑——衬线在中文环境优雅度不稳定时直接用系统衬线（思源宋体若已安装更好），但**不要为了凑衬线引入巨大的 webfont 包**。

### 2.2 字号梯度（模数 1.25 / 1.333 混合）

| 用途 | size / line-height | 字族 | 字重 |
|---|---|---|---|
| 显示标题 H1 | 56 / 64 px | serif | 500 |
| 段标题 H2 | 36 / 44 px | serif | 500 |
| 小节标题 H3 | 22 / 32 px | serif | 600 |
| 引言 / 副标 | 20 / 32 px | serif italic 或 sans | 400 |
| 正文大 | 18 / 30 px | sans | 400 |
| 正文 | 16 / 26 px | sans | 400 |
| 元信息 | 13 / 20 px | sans | 500 |
| 表格数字 | 16 / 24 px | mono `font-variant-numeric: tabular-nums` | 500 |

**衬线**：仅用于标题（H1-H3）和必要的强调引言。正文绝不用衬线（中英混排会塌）。
**字重**：标题止于 500/600，**禁止 900 / 950 黑体压感**。

### 2.3 文字节奏

- 段落最大行宽：**65–75 ch**（约 540-620 px），超过必须换行或换布局。
- 标题与正文之间间距 ≥ 24 px。
- 段落与段落之间 ≥ 20 px。
- 中文文字默认 `letter-spacing: 0.02em`，英文 0。

---

## 3. 间距 / 半径 / 描边

### 3.1 间距阶梯（4 px 基线）

```
--space-1: 4px    --space-5: 24px   --space-9: 96px
--space-2: 8px    --space-6: 32px   --space-10: 128px
--space-3: 12px   --space-7: 48px
--space-4: 16px   --space-8: 64px
```

不允许出现非 4 px 倍数的间距（除非 1 px 描边）。

### 3.2 圆角

```
--radius-0: 0          锐角，用于分割线、引述
--radius-1: 4px        小元素（标签、徽章）
--radius-2: 8px        默认（按钮、输入框）
--radius-3: 12px       卡片
--radius-4: 24px       特殊大块（不常用）
```

**禁止 pill / 全圆角按钮**（`border-radius: 999px`），太"产品化"，违反编辑物气质。

### 3.3 描边

- 默认 1 px solid `--color-border`
- 强调 1 px solid `--color-border-strong`
- 焦点态 2 px solid `--color-accent`
- **禁止 box-shadow 用于层级表达**

---

## 4. 排版与构图原则

### 4.1 节奏

页面从上到下是**叙述节奏**，不是"信息瀑布"：

```
标题（衬线大字）
  ↓ 32 px
副标（一段散文，告诉用户这是什么）
  ↓ 48 px
主互动（选角色卡——少量，舒展，可横向排或纵向列）
  ↓ 32 px
即时反馈（一段完整的句子结论，不是色块标签）
  ↓ 48 px
延展入口（一个文本链接，不是按钮）"展开看 17 家中转站的对照 →"
  ↓ 96 px
工作台是另一段独立内容（默认折叠）
```

### 4.2 列宽

- 单栏内容：**最宽 720 px** 居中
- 双栏（少用）：左 1.2fr + 右 0.8fr，gap 48 px
- 表格类工作台可以铺到 960 px，但视觉上要明确"我进了一个工作页"

### 4.3 密度

- **禁止 grid-of-cards**：用列表 / 行式排布替代密铺网格
- 卡片之间默认 `--space-5`（24 px）或更大
- 表格行高 ≥ 48 px

### 4.4 居中策略

- 主内容居中
- 文字段落左对齐（绝不 justify）
- 数字列右对齐 + tabular-nums

---

## 5. 文案语气（Voice）

**核心原则**：写句子，不写标签。**且——不卖东西，不替用户决定。**

### 5.1 对照表

两层修正同时存在：① 标签 → 句子；② 销售口吻 → 地图口吻。

| ❌ 标签 + 销售 | ❌ 句子 + 销售 | ✅ 句子 + 地图 |
|---|---|---|
| 推荐：Claude Max 5x | 对你这种用法，Claude Max 5x 是最稳的省法 | 这一档对应官方 Max 5x，月费 ¥700——属于价格地图的最高端 |
| 避开：号池 | 避开号池，断流频繁 | 廉价中转区间是 ¥150–300/月；风险分 0.4，账号封了钱拿不回来 |
| 你像：编程开发 | 你看起来像每天用 AI 写代码的人 | 你这种用量画像，落在「编程开发」这一类 |
| 立即开始 | 现在就开始算吧 | 试试 |
| 当前价格：¥7.4/$1 | 折算下来差不多 ¥7.4 换 1 美元 | 这家折算到 ¥7.4 ≈ 1 美元 API 等值能力 |
| ERROR: 加载失败 | 加载失败，请重试 | 数据没拿到，可能是网卡了，等一下再试 |

### 5.2 "地图口吻"识别

如果你写出来的句子里出现下面这些词，停下来想想是不是又走偏了：

- 推荐 / 建议 / 你应该 / 最好选 / 别选 / 不建议
- 性价比甜点 / 最稳的省法 / 拿钱买稳定
- 立即购买 / 立即订阅 / 限时

**正确的词汇库**：

- 对应 / 落在 / 这一档 / 区间 / 分布
- 折算为 / 按 X 折算
- 看见 / 看到 / 显示
- 价格地图 / 价格分布 / 风险分

### 5.2 数字呈现

- 价格：`¥1,234` 用千分位
- 百分比：保留 1 位小数（除非整数）"4.5%"
- 范围：用中文破折号 `¥150 – 300/月`，不用 `~`
- 不必要的精度删除：`¥7.4` 而不是 `¥7.42`（除非用户在工作台精算）

### 5.3 命名

- 渠道、产品名用真实原名：OpenRouter、AiHubMix、Claude Max 5x（不音译、不汉化）
- 角色卡名中性专业：编程开发、AI 重度依赖、内容创作（不卖萌）

---

## 6. 视觉元素（图形 / 图标 / 插画）

### 6.1 绝对禁止

- ❌ **Emoji 当 icon**（☕📚💻🔥⚙️ 这一整套就是踩雷）
- ❌ **像素艺术**（Stardew Valley 方向已被取代，见 §11）
- ❌ Material / Tabler / Phosphor 等通用 icon 库**直接铺**（要么不用，要么自己画极少几个）
- ❌ 矢量插画素材库（unDraw / Storyset 等通用风）
- ❌ AI 生成插画（"AI 味"过重）

### 6.2 推荐方向

参照 claude.ai 自己的视觉：**抽象几何 + 单色手绘**

- 大色块（铜橙 + 米白）做出极简形状
- 1 px 线性细描，不填色，类似 monoline 手绘
- 几何元素：圆、半圆、弧线、小点；**不要写实人物 / 物件**
- 出现在大段落分隔处、hero 装饰处，每屏 ≤ 1 个

### 6.3 占位策略（未拿到真稿前）

**留白即占位**——不要放任何"art placeholder 虚线框"。

页面靠标题 + 副标 + 铜橙强调 + 留白本身已经能撑住气质。等真稿到位再补。

### 6.4 当真稿到位

新的画师 brief 见 §11 替代品（待写）。简版：

> 给我一组 6 个抽象形状（圆 / 半圆 / 弧 / 三角），用铜橙 + 米白 + 深墨三色组合。每个对应一种使用强度（轻 → 重）。不要人物，不要场景，不要叙事。每个 SVG ≤ 4 KB。

---

## 7. 组件参考

### 7.1 按钮

只有两种：

**Primary（主操作）**
```css
background: var(--color-ink);
color: var(--color-bg);
border: 1px solid var(--color-ink);
padding: 12px 20px;
border-radius: var(--radius-2);
font-weight: 500;
```

**Secondary（次操作）**
```css
background: transparent;
color: var(--color-ink);
border: 1px solid var(--color-border-strong);
padding: 12px 20px;
border-radius: var(--radius-2);
font-weight: 500;
```

**链接（文本内交互）**
```css
color: var(--color-ink);
text-decoration: underline;
text-decoration-color: var(--color-accent);
text-underline-offset: 3px;
text-decoration-thickness: 2px;
```

铜橙下划线就是这个产品的视觉签名。

### 7.2 卡片

- 1 px 描边 + 圆角 12 px + padding 24 px
- 无阴影、无背景色（除非真的需要分区）
- hover 态：描边变 `--color-border-strong`，不放大、不变色

### 7.3 输入

- 底边或四边 1 px 描边
- focus 态：`outline: 2px solid var(--color-accent); outline-offset: 0`
- 不引入 placeholder 灰度作为主要 affordance

### 7.4 表格

- 表头：底部 1 px 描边强，文字 13 px 大写字母间距 0.06em
- 行：行高 48 px，行间 1 px 描边
- 禁止 zebra striping
- 数字列右对齐 + mono + tabular-nums

### 7.5 折叠（details）

- summary 默认是文字链接样式（铜橙下划线）"展开看 17 家中转站对照 →"
- 展开后内容左缩进 24 px
- 不用 `<button>` 当折叠触发

---

## 8. CSS 变量总表（实现层）

```css
:root {
  /* 色彩 */
  --color-bg: #FAF9F5;
  --color-surface: #F0EBE0;
  --color-surface-strong: #E8E1D3;
  --color-ink: #1A1A1A;
  --color-ink-2: #5C5752;
  --color-ink-3: #8B857E;
  --color-accent: #D97757;
  --color-accent-strong: #B45C3F;
  --color-border: #E8E1D3;
  --color-border-strong: #D4CCB8;
  --color-danger: #A03B2A;

  /* 字体 */
  --font-serif: "Newsreader", "Source Serif Pro", "Charter", Georgia, serif;
  --font-sans:  "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
                "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  --font-mono:  "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace;

  /* 间距 */
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
  --space-5: 24px;  --space-6: 32px;  --space-7: 48px;  --space-8: 64px;
  --space-9: 96px;  --space-10: 128px;

  /* 半径 */
  --radius-0: 0;        --radius-1: 4px;
  --radius-2: 8px;      --radius-3: 12px;     --radius-4: 24px;

  /* 容器宽 */
  --w-prose: 720px;
  --w-wide: 960px;
}
```

---

## 9. 反模式速查（绝不做的）

逐条都是过去踩过的坑：

1. ❌ Teal / blue / green / purple 作为主色
2. ❌ Tailwind 默认 button / card 套用不改
3. ❌ Emoji 当 icon（☕📚💻🔥⚙️）
4. ❌ 像素小人 / 小火柴人 / Stardew 风（**这条尤其重要**，前面踩过）
5. ❌ 一屏多种强调色并存
6. ❌ Box-shadow 表层级
7. ❌ Grid-of-cards 密铺
8. ❌ "推荐 / 避开 / 你像" 标签化短文案
9. ❌ Pill / 全圆按钮
10. ❌ Gradient（任何方向）
11. ❌ 950 黑体压感字重
12. ❌ Justify 对齐
13. ❌ "Loading..." 灰转圈（用"数据没拿到，等一下"句子代替）
14. ❌ 通用矢量插画库
15. ❌ 红绿当语义色（用铜橙做选中、深酒红做风险）

---

## 10. 治理

### 10.1 修改这份文件的规则

- 增加新 token（颜色、字号、间距）必须在本文件先注册再用
- 删除已存在 token 之前要确认无引用
- 写新代码时如果发现 token 不够用，**先回来加这份文档，再回去写代码**——不要在代码里临时写"自定义颜色"

### 10.2 取舍的口诀

当你纠结某个设计决策时，问自己一句：

> 这个改动，让页面更像 **claude.ai**，还是更像 **某个 SaaS dashboard**？

像前者就做，像后者就不做。

### 10.3 评审节奏

每加一个新页面 / 新组件，回来对照本文件 5 分钟检查清单：
- [ ] 主色只有铜橙吗？
- [ ] 没用 emoji 当 icon 吗？
- [ ] 标题用衬线吗？
- [ ] 段落写成句子了吗？
- [ ] 没用 box-shadow 吗？
- [ ] 没用 pill 按钮吗？

---

## 11. 已归档 / 已替代的方向

| 之前的方向 | 取代原因 | 处置 |
|---|---|---|
| Stardew Valley 像素小人 | 2026-05-12 用户明确否决——与 claude.ai 锚点冲突 | `docs/design-brief-pixel-cards.md` 标记 **superseded**；`assets/cards/_palette.json` 旧暖色配青绿调色板待清理；`assets/placeholders/card-*.svg` 6 个占位待删 |
| Teal `#0f766e` + Blue `#2563eb` 双主色 | 与"一抹铜橙"的克制冲突 | 旧原型的对应 CSS 变量已随已删除页面一起移除 |
| Emoji icon（☕📚💻🔥⚙️） | 跟编辑物气质冲突 | 见 §6.1 反模式 |
| 网格密铺 8 张角色卡 | dashboard 气质 | 改为 6 张 + 编辑节奏，见 §4.1 |
| "你像 / 先看 / 避开" 短标签 | 标签化 | 改为完整句子，见 §5.1 |

---

## 12. 雷达图 / 数据可视化

### 12.1 雷达图（5 轴）

用于呈现一个画像在多维度上的相对位置。**只展示位置，不评判好坏**。

**结构**：
- 5 条等夹角轴线（72°），从正上方起顺时针
- 4 圈刻度环（值 0.25 / 0.5 / 0.75 / 1.0）
- 1 个数据多边形

**取值范围**：所有轴 0–1。值跨度大时用 `sqrt(value/max)` 压缩；不要用真值，否则极端项会让所有人都贴边。

**样式约束**：

| 元素 | 规范 |
|---|---|
| 刻度环 | 1 px dashed `--color-border` |
| 轴线 | 1 px solid `--color-border-strong` |
| 数据填充 | `--color-accent`, opacity 0.18 |
| 数据描边 | 2 px solid `--color-accent` |
| 数据顶点 | 圆点 r=3, 填 `--color-accent` |
| 轴标签 | serif 13 px, fill `--color-ink-2` |
| 容器 | 320 × 320 viewBox, 可等比缩放 |

**禁止**：3D 投影、渐变填充、阴影、动画（除非首次 reveal 的极轻量 fade-in 200ms）、彩色多条数据线（一条数据多边形足矣）。

### 12.2 价格分布带

用于呈现一个用户在所有可选渠道下的价格落点。

- 三档：最低（廉价）/ 中档（正规）/ 最高（官方）
- 排列：纵向列表，每项一行
- 不用条形图 / 柱状图（dashboard 化）
- 数字用 mono + `tabular-nums`，CNY 千分位
- 每档附**单句来源说明**（"号池 / 拼车，按 ¥2.5/$1 折算"）
- 不标 ✓/✗，不标"推荐"或"避开"

---

## 13. 待写

- [ ] 新版美术 brief（抽象几何手绘方向）—— 写在 `docs/design-brief-v2.md`
- [ ] 暗色模式色板（claude.ai 的暗色版可作参考，但 v1 不做）
- [ ] 移动端断点策略（v1 桌面优先，移动端只保证不溢出）
- [ ] 国际化时英文衬线/中文衬线的搭配验证
- [ ] "你现在付多少"输入框 + 在价格分布带上标位置（自我定位）
