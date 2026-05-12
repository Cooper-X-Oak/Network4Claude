# 像素卡片资产规格 (Asset Spec)

本文件是 `assets/cards/` 目录下所有美术资产的规格约束。代码和画师交付都必须遵守。

完整设计 Brief 见 [docs/design-brief-pixel-cards.md](../../docs/design-brief-pixel-cards.md)。

---

## 1. 尺寸

| 名称 | 1× | 2× | 3× |
|---|---|---|---|
| 角色主体 | 48×48 | 96×96 | 144×144 |
| 卡片画布 | 220×280 | 440×560 | 660×840 |

## 2. 格式

- 主交付：SVG（每像素 = 一个 `<rect>`，矢量化像素）
- 备份交付：PNG @2×、@3×
- 禁用：JPG、WebP、@1× 位图 PNG

## 3. 调色板

见 `_palette.json`，每卡 ≤ 12 色，光源左上 45°。

## 4. 比例

- 头身比 1:1.5
- 眼睛 2×2 px，不画瞳孔与表情细节
- 道具 ≤ 24×24 px

## 5. 文件组织

```
assets/cards/NN-shortname/
├── card.svg            主资产
├── card@2x.png         视网膜屏适配
├── card@3x.png         高密度屏适配
├── preview.png         浏览缩略图
└── meta.json           画师/版本/调色记录
```

## 6. SVG 内部结构约定

```svg
<svg viewBox="0 0 220 280" ...>
  <g class="card-bg">    <!-- 卡片底色 -->
  <g class="body">       <!-- 人物主体 -->
  <g class="prop">       <!-- 主道具 -->
  <g class="accent">     <!-- 语义符号 -->
  <g class="hover-state" data-state="idle"> <!-- 微动效切换层 -->
</svg>
```

CSS variable 接入：所有色值用 `var(--art-ink)` 等变量引用，便于换肤和暗色模式。

## 7. 状态标识

每张卡在 `_manifest.json` 里有 `status` 字段：

| status | 含义 | 代码引用路径 |
|---|---|---|
| `placeholder` | 占位资产（虚线框 + TBD 文字） | `assets/placeholders/card-NN.svg` |
| `draft` | 画师初稿，待审 | `assets/cards/NN-shortname/card.svg` + 标 draft |
| `revising` | 修改中 | 同上 + 标 revising |
| `final` | 终稿已上线 | `assets/cards/NN-shortname/card.svg` |

代码读 `_manifest.json` 的 `current_path` 字段，自动指向当前 status 对应的文件路径。

## 8. meta.json 模板

```json
{
  "card_id": "01-light-chat",
  "version": "0.1",
  "status": "placeholder",
  "artist": null,
  "artist_url": null,
  "created_at": null,
  "last_revised_at": null,
  "palette_check": false,
  "spec_check": false,
  "review_notes": []
}
```

每次画师交付新版，version 递增（0.1 → 0.2 → 1.0），review_notes 追加而非覆盖。
