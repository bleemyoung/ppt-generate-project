# Prototype：固定渲染器与数据驱动 PPT

> 状态：设计验证记录，尚未进入生产实现。
>
> 本原型用于回答一个问题：能否保留当前分阶段 PPT 流程的可控性、可编辑性和可复现性，同时避免每次任务都让模型重新生成数百行 `build.mjs`？

## 一、结论假设

当前流程方向合理，Token 浪费主要不在 `lecture.md` 和 `storyboard.md`，而在以下环节：

- Agent 多轮重复携带系统规则、Skills、历史消息和工具结果；
- 每份 PPT 都重新生成并检查完整的 PptxGenJS 构建脚本；
- 构建错误会触发新的读取、推理、修改和验证轮次；
- 思考 Token、工具调用和代码输出远高于最终可见文案。

推荐把 PPT 渲染能力收进固定的深 Module。模型只负责生成页面稿，不再负责重复实现字体、配色、页码、卡片、表格、备注和文件输出逻辑。页面稿确认后，由确定性转换程序生成渲染数据。

## 二、目标结构

```text
原始材料
    ↓
intermediate/lecture.md
    ↓
intermediate/storyboard.md
    ↓
intermediate/deck.json          # 由页面稿确定性生成，可删除重建
    ↓
scripts/render.mjs              # 固定渲染入口，不按任务重写
    ↓
templates/                      # 固定布局与样式实现
    ↓
output/*.generated.pptx
    ↓
output_final/*.final.pptx
```

### Module 与 Interface

`storyboard.md` 是页面内容的唯一事实来源。它采用 Markdown 外壳与每页严格 JSON 块，既供人工审阅，也供程序确定性读取。`deck.json` 不是第二份页面稿，而是转换程序产生的机器输入；任何内容修改都必须先落到 `storyboard.md`，再重新生成 `deck.json`。

`scripts/render.mjs` 是渲染 Module，对 Agent 暴露的 Interface 只包含：

```text
输入：deck.json 路径、输出 PPTX 路径
输出：可编辑的 .generated.pptx、构建摘要、明确的失败信息
```

字体、主题、页面布局、PptxGenJS 调用、目录创建、页码、备注和文件写入都属于 Module 的内部实现。普通任务不允许模型修改这些实现；只有新增布局能力时才修改渲染 Module。

## 三、两种运行模式

### 快速模式

适用于内部分享、一次性交付、材料结构清楚且排版要求一般的任务。

快速模式必须由用户明确选择，不作为默认路径。

```text
材料 + 简短 Brief
→ storyboard.md（不暂停确认）
→ 确定性生成 deck.json
→ 固定渲染器
→ 人工检查
```

特点：

- 不重复检查已经就绪的环境；
- 不进行多轮需求拷问；
- `lecture.md` 和 `storyboard.md` 可以合并为一次内部整理；
- 目标是尽快得到可编辑初稿。

### 标准模式

适用于正式汇报、关键数据、多人协作、需要审计或长期维护的任务。

标准模式是新任务的默认路径。

```text
材料
→ 确认 lecture.md
→ 确认 storyboard.md
→ 确定性生成 deck.json
→ 固定渲染器
→ 视觉 QA
→ 人工定稿
```

特点：

- 保留事实与页面两次确认；
- 支持业务纠错同步回长期文件；
- 以稳定质量和可交接性为优先目标。

## 四、`deck.json` 最小渲染数据契约

`deck.json` 由已确认的 `storyboard.md` 确定性生成，不由模型或人工独立编写。首版只覆盖当前案例真正需要的字段，不提前设计完整排版语言。

### 结构化页面稿

每一页使用 Markdown 二级标题标识页码与名称，紧跟一个严格 JSON 代码块。转换程序只读取 JSON 块，不猜测自由文本含义。

文件开头包含一个全局 JSON 块：

````markdown
# storyboard.md — 页面与版式契约

```json
{
  "schemaVersion": 1,
  "mode": "standard",
  "theme": "business-blue",
  "outputName": "示例.generated.pptx"
}
```
````

- `schemaVersion` 必填；渲染器遇到不支持的版本必须停止；
- `mode` 默认为 `standard`，只有用户明确选择时才允许写为 `quick`；
- `theme` 只能引用已注册的命名主题；
- `outputName` 只能填写文件名，不能包含目录，且必须以 `.generated.pptx` 结尾；
- 渲染器固定把自动版写入当前任务的 `output/`。

````markdown
## 页面 2：议程

```json
{
  "layout": "agenda",
  "title": "议程",
  "items": [
    "背景与痛点",
    "产出链路",
    "实践经验",
    "结论"
  ],
  "notes": "全篇约 14 页，重点介绍产出链路。",
  "sources": ["lecture §一"]
}
```
````

JSON 块必须能被 Node.js 内置 `JSON.parse` 直接解析，不引入 YAML 解析依赖。Markdown 页面标题用于人工快速浏览，JSON `title` 用于渲染；两处允许镜像同一标题，但页码和标题必须完全一致，发生冲突时停止构建，不自动选择任何一方。

### 页面稿模板

工作区在 `templates/storyboard-template.md` 提供唯一页面稿模板。新任务或新 Agent 会话不得从空白自由发挥，必须先读取模板，再以它为起点生成 `intermediate/storyboard.md`。模板至少包含：

- 全局设置与页面总览；
- 每页标题和 JSON 块的固定结构；
- 必填字段、可选字段与字段说明；
- 支持的布局枚举及对应数据字段；
- 演讲备注、来源引用和强调文本的表达方式；
- 一个最小可运行示例和常见校验错误。

### 强制契约

模板约束不只依赖提示词，必须同时落在以下三处：

1. `templates/storyboard-template.md`：页面稿格式的唯一模板源；
2. `.agents/skills/build-ppt-from-source/SKILL.md`：要求新 Agent 会话在创建页面稿前读取模板；
3. 页面稿转换程序：在生成 `deck.json` 前执行强制校验。

转换程序至少校验：

- 页面编号连续且无重复；
- Markdown 页面标题中的页码、标题与对应 JSON 完全一致；
- 每页只有一个 `json` 代码块；
- JSON 能被 `JSON.parse` 直接解析；
- 通用必填字段存在且类型正确；
- `layout` 属于已注册枚举；
- 当前布局要求的字段齐全，且不存在未知字段；
- 演讲备注和来源字段符合约定格式。

渲染器应为不同布局提供稳定默认值，页面稿只描述内容与有限布局选择，不要求 Agent 重复填写字体、颜色、坐标和常规间距。

任何校验失败都必须停止构建，返回页码、字段路径、错误原因和修改建议。转换程序不得猜测缺失内容、静默补字段或调用模型修复。

```json
{
  "meta": {
    "title": "AI 辅助 PPT 实践",
    "author": "Portable PPT Workspace",
    "layout": "LAYOUT_16x9"
  },
  "theme": "business-blue",
  "slides": [
    {
      "layout": "title",
      "title": "用 AI 把材料做成可编辑 PPT",
      "subtitle": "分阶段、可复现、可交接",
      "notes": "说明本次汇报目标。"
    },
    {
      "layout": "three-cards",
      "title": "核心经验",
      "items": [
        { "title": "先确认事实", "body": "避免错误进入页面实现。" },
        { "title": "再确认结构", "body": "减少成稿后的大范围返工。" },
        { "title": "最后生成", "body": "自动版和人工定稿版分开。" }
      ],
      "notes": "逐项说明三阶段的价值。"
    }
  ]
}
```

首版建议支持的布局：

- `title`
- `agenda`
- `section`
- `text`
- `two-columns`
- `three-cards`
- `table`
- `comparison`
- `timeline`
- `summary`

布局名称必须是有限枚举。模型在页面稿中只能选择已有布局；转换程序负责校验并生成 `deck.json`，不能在其中注入任意 JavaScript。

- 找不到合适布局时必须停止并报告缺少的布局，不得静默替换为相似布局；
- 普通 PPT 任务不得修改固定渲染器；
- 新增布局必须作为独立任务，经用户确认后同步修改渲染器、页面稿模板和字段校验；
- `sources` 用于事实追溯，默认不显示在页面上，可保留在渲染数据或演讲备注中。

## 五、原型范围

使用 `examples/随身行PPT实践/` 作为唯一验证案例：

1. 从现有 `scripts/build.mjs` 提取可复用主题、页眉、页脚、文本、卡片、表格和备注逻辑；
2. 建立固定的 `scripts/render.mjs`；
3. 建立页面稿模板，并把案例迁移为“Markdown 标题 + 每页严格 JSON 块”；
4. 建立从结构化 `storyboard.md` 到 `intermediate/deck.json` 的确定性转换；
5. 使用转换结果和固定渲染器重新生成 14 页自动版；
6. 对比现有终稿，确认内容、页数、备注和主要布局没有明显回归；
7. 记录迁移前后模型 Token、构建时间、错误次数和人工修正次数。

原型不处理：

- 任意坐标和任意形状编辑；
- 完整 PowerPoint 动画；
- 所有可能的图表与 SmartArt；
- 自动兼容所有历史 PPT；
- 在首版抽象复杂插件系统。

## 六、一条命令运行

原型最终应提供一个无需进入子目录的命令：

```powershell
pnpm prototype:render
```

该命令读取固定案例的 `storyboard.md`，先重建 `deck.json`，再生成：

```text
examples/随身行PPT实践/output/随身行PPT实践.generated.pptx
```

实现阶段可在 `package.json` 中把该命令映射到 `scripts/render.mjs`。原型生成的 `output/` 继续保持 Git 忽略。

`intermediate/deck.json` 只作为本地调试文件，不提交到版本库；根目录与参考案例都应通过 Git 忽略规则排除该文件。

## 七、验收标准

原型只有同时满足以下条件才证明方案可行：

- 一条命令可以从不存在的 `output/` 开始完成生成；
- 生成文件可以被 PowerPoint 正常打开并继续编辑；
- 页数、演讲备注和核心内容与现有案例一致；
- 不出现明显的文字裁切、重叠和表格溢出；
- 页面稿在转换阶段执行布局级标题、正文和列表长度限制，超限时停止并指出字段；
- `render.mjs` 不包含“随身行”案例专用文案；
- 修改标题、卡片内容或页面顺序时，只需修改 `storyboard.md`，`deck.json` 可被完整重建；
- 新开的 Agent 会话能依据统一模板生成可直接通过解析与校验的 `storyboard.md`；
- 任一契约错误都会在写入 PPTX 前被定位并阻止构建；
- 普通 PPT 任务不再生成或重写完整 PptxGenJS 脚本；
- 相同模型、相同 Harness 下，达到同等验收质量所需的 Token 和人工修正次数低于当前流程。

日常标准模式继续遵循工作区现有规则，不默认渲染页面图片；只有用户明确要求或执行原型基准时才进行视觉 QA。

## 八、基准记录

每次对比至少记录：

| 指标 | 说明 |
| --- | --- |
| Harness 与版本 | Kilo、DeepSeek Harness Standard 或 Minimal |
| 模型与 Provider | 不能只记录模型名称 |
| 缓存输入 | 命中与未命中分别记录 |
| 输出与 Reason | Reason 包含在输出中，不重复计费 |
| Agent 步数 | API 请求数、工具调用数、错误与重试次数 |
| 时间 | 总耗时、模型等待时间、人工介入时间 |
| 质量 | 内容覆盖、事实错误、视觉问题、可编辑性 |
| 费用 | 实际费用及价格快照日期 |

核心比较指标是“达到验收门槛的成本和时间”，不是单纯比较 Token 总数。

原型基准固定同一模型、Harness、Provider、输入和质量门槛，至少独立运行 3 次。通过门槛为：

- `缓存未命中输入 + 输出 Token` 的中位数比当前流程降低至少 30%；
- 事实错误数量不增加；
- 人工修正次数不增加；
- 生成文件仍满足页数、可编辑性和视觉验收要求。

## 九、风险与取舍

### 布局表达能力不足

固定布局会减少自由度。首版应允许任务在已有布局内组合，不为单个页面立即增加通用抽象；找不到合适布局时停止并请求新增布局，不进行静默退化。新增布局属于独立任务，必须同时更新渲染器、模板和校验规则。

### 页面稿格式逐渐变成另一种编程语言

如果在页面稿中允许坐标、任意样式和条件逻辑，模型仍会承担大量实现工作。页面稿约定与渲染数据契约必须保持声明式和有限枚举。

### 快速模式降低确认强度

快速模式可能增加内容遗漏风险，因此只能用于低风险任务；正式材料仍走标准模式。

### 旧案例迁移成本

现有案例脚本不要求一次性全部迁移。先用“随身行”验证，方案通过后再决定是否迁移其他案例。

## 十、原型判定

当前推荐继续验证“固定渲染器 + `deck.json`”方案。若原型能在不明显降低页面质量的前提下减少 Agent 输出代码和返工轮次，则将验证结果写入正式 `spec.md` 与 `plan.md`；本文件继续作为设计过程记录，不直接充当生产实现规范。
