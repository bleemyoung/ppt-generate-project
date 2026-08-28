# 开源“文档到演示”工作流复核

## 判定口径

本次只把同时满足以下四点的项目列为“完全符合”：

1. 能接收原始文档，而不只是主题或已经写好的幻灯片稿。
2. 会形成 Markdown、结构化大纲、IR 或其他可保存的中间契约。
3. 生成幻灯片前存在明确的用户审阅、编辑或批准步骤。
4. 能输出 PPTX；“可编辑”另行区分原生对象、OCR 重建和整页图片。

这里的“确认门”不是生成后的预览或修改，而是用户能在页面生产前确认内容边界或页面计划。

## 结论

| 分类 | 项目 | 原始输入 | 中间契约与确认门 | 输出与可编辑性 | 主要风险 |
| --- | --- | --- | --- | --- | --- |
| 完全符合 | [Presenton](https://github.com/presenton/presenton) | 上传文件，官方流程未在该页逐项列出格式 | 文件先分解为 Markdown，用户可在文档预览页修改并保存；官方明确称其为 `user-approved Markdown`，之后才生成结构化 outline | 从结构化 shapes 导出 PPTX，可继续在应用内编辑 | 产品级工程较完整，但确认的是清洗后的提取稿，不等同于经过业务归纳的 `lecture.md` |
| 完全符合 | [LRriver/AIPPT](https://github.com/LRriver/AIPPT) | `.md/.txt/.pdf/.docx/.pptx` | 输入转 Markdown；用户编辑并确认 outline，再审阅 page designs，确认后才生成页面 | 支持图片型 PPTX，以及经 OCR/VLM 重建的可编辑 PPTX；文字、简单线条和表格边框可编辑，复杂对象仍有限 | 项目较新；可编辑 PPTX 不是原生内容编译，而是从生成图片重建，质量依赖模型和 provider |
| 完全符合 | [Academic-Slides-Agent](https://github.com/foxsplendid/Academic-Slides-Agent) | PDF、LaTeX，以及 Excel/CSV/ZIP/PDF 附件或结构化 handoff | 先归一化为带 provenance 的 Evidence Pool，再生成 outline；LangGraph 有 human hard-stop，CLI 也支持 `outline.json` 审阅后再 `build`；最终使用验证过的 Slide-IR | 确定性编译为原生可编辑 PPTX，文本、表格和形状是 PowerPoint 对象 | 非常贴合目标，但限定学术场景；仓库目前 `0.x`、关注度低，仍需实际样例验证 |
| 完全符合 | [DeepSlide](https://github.com/PUITAR/DeepSlide) | 论文 PDF、LaTeX ZIP、多文档引用 | 需求澄清后生成多个带时间预算的 logical-chain 候选，用户选择并可逐节点编辑，再进入证据驱动的页面和讲稿生成；产物含 `recipe/content.tex`、`recipe/speech.txt` | 可导出 PDF/PPTX/ZIP；官方未明确承诺 PPTX 中元素均为原生可编辑对象 | 偏学术演讲交付，依赖 TeX、前后端和多个服务；PPTX 可编辑性需要实测，项目规模和社区仍小 |
| 部分符合 | [deck.md](https://github.com/rodrigolourencofarinha/deck.md) | brief、材料、既有 slides、数据与资产 | `deck.md` 是明确的 production contract，保持 `status: draft`，必须由人批准后才生产；数据项目另有 manifest 和分析产物 | 默认 `designer-mode` 产出 PDF；`ppt-shapes` 才能输出可编辑 PPTX，且依赖额外 Presentations runtime 或替代 renderer | 确认边界设计最好，但不是自带通用文档解析到可编辑 PPTX 的一体化应用 |
| 部分符合 | [Oh My PPT](https://github.com/arcsin1/oh-my-ppt) | `txt/md/csv/docx`，也支持图片和导入 PPTX | 文档会整理为 AI 可读文本，并回填主题、页数和描述；对话创作可共同推敲大纲，但普通文档路径未声明“审阅提取稿/大纲后才允许生成”的硬确认门 | HTML 页面可视化编辑，可导出可编辑 PPTX；官方同时说明混排、复杂图表、表格、形状和动画仍在优化 | 桌面产品体验较完整，但中间文本不是独立、可版本化的内容契约，确认边界偏软 |
| 部分符合 | [ArcDeck](https://github.com/RehgLab/ArcDeck) | 学术 PDF | Docling 转 Markdown，必要时回退 Marker；生成 `commitments.md`、RST 话语树和 slide plan，并通过 critic/judge 自动迭代 | 通过 `python-pptx` 或 PptxGenJS 生成 PPTX，通常可编辑 | 官方 CLI/Web UI 是上传后直接生成和下载，未见人在页面生成前批准 Markdown、commitments 或 outline 的硬门；项目刚开源 |
| 部分符合 | [PPTMaker](https://github.com/jorben/pptmaker) | 粘贴文本、PDF、DOCX、MD、TXT | 自动形成结构化 outline，用户可以在生成前增删页并编辑标题、要点和视觉描述 | 页面以图片生成，可编辑内容后导出 PDF；不输出 PPTX | 流程确认门明确，但最终产物不满足 PPTX 要求；仓库规模很小 |

## 不符合完整流程

本次指定候选中没有需要完全排除为“无关项目”的项，但以下两个若以“可复用的 `lecture.md` 内容确认层”为目标，应视为不符合该严格定义：

- **ArcDeck**：虽然有 Markdown、`commitments.md` 和 slide plan，但审阅由 Narrative Critic/Judge 自动完成，官方入口没有用户批准门。
- **Oh My PPT 的普通文档创建路径**：用户先确认主题、资料、页数和风格，生成后再编辑；官方没有说明提取后的 AI-readable text 或生成大纲会作为独立内容契约交给用户验收。

它们仍属于“文档到 PPT”产品，只是不解决你关心的“处理后先确认内容边界”问题。

## 推荐参考顺序

1. **Presenton**：最适合直接参考“原始文件 → 可编辑 Markdown → 用户批准 → outline → PPTX”的阶段边界。
2. **Academic-Slides-Agent**：最适合参考 Evidence Pool、来源追踪、outline hard-stop 和确定性 Slide-IR 编译。
3. **deck.md**：最适合参考 `draft/approved` 内容契约，但需要替换或接入自己的 PPTX renderer。
4. **AIPPT**：最适合参考完整 Web 工作台、outline/page-design 双确认和单页版本管理；不建议照搬其“先图片、再 OCR 重建可编辑 PPTX”作为默认构建路线。
5. **DeepSlide**：适合参考多叙事候选、时间预算和演讲稿联动，业务汇报场景不宜整体照搬。

因此，如果目标不是固定 AnyDoc → PPTKit，而是寻找现成同款方案，**Presenton 是最接近通用工作流的成品，Academic-Slides-Agent 是最接近严格工程契约的实现，deck.md 是最值得复用的确认规范**。AIPPT 更像可直接体验的全流程工作台，但其可编辑 PPTX 路线与原生结构化构建不同。

## 官方来源

- [Presenton：Presentation Generation End-to-End Flow](https://docs.presenton.ai/contribution-guides/presentation-generation-flow)
- [Presenton GitHub](https://github.com/presenton/presenton)
- [LRriver/AIPPT](https://github.com/LRriver/AIPPT)
- [deck.md](https://github.com/rodrigolourencofarinha/deck.md)
- [Academic-Slides-Agent](https://github.com/foxsplendid/Academic-Slides-Agent)
- [Academic-Slides-Agent SPEC](https://github.com/foxsplendid/Academic-Slides-Agent/blob/main/docs/SPEC.md)
- [DeepSlide](https://github.com/PUITAR/DeepSlide)
- [PPTMaker](https://github.com/jorben/pptmaker)
- [ArcDeck](https://github.com/RehgLab/ArcDeck)
- [Oh My PPT](https://github.com/arcsin1/oh-my-ppt)
