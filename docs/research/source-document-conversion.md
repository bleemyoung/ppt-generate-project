# PPT 原始输入文件预处理工具调研

调研日期：2026-08-21

## 结论

建议把原始文件转换放在 **任何 LLM 内容理解之前**，作为独立、可重复执行的“机械提取层”；转换结果再交给 Agent 整理为 `lecture.md`，最后由用户确认 `lecture.md` 的事实、口径和范围。

推荐链路：

```text
sources/ 原始文件（只读保留）
  -> 本地转换器（不做摘要、不改写事实）
  -> extracted/*.md + assets/ + manifest.json
  -> Agent 整理 draft lecture.md（首次语义理解）
  -> 用户确认 confirmed lecture.md（内容边界）
  -> PPTKit 规划页面并构建 PPT
```

默认工具建议：

- **普通 DOC/DOCX、PPT/PPTX、XLS/XLSX、ODF、RTF、EPUB、文本型 PDF：优先 AnyDoc。** 它是纯 Rust、本地无模型、输出统一 GFM，并直接提供 Node.js、Python、CLI 和 Agent Skill，最容易接到以 Node/PPTKit 为主的工作区。
- **现有 DOCX 流程且只需轻量提取：可继续 Microsoft MarkItDown。** 它成熟、MIT、Python 接入简单，目标明确是给 LLM/文本分析使用；无需为了换工具而重写稳定流程。
- **复杂排版 PDF、扫描件、公式、表格或图片理解：按需升级到 Docling；中文复杂扫描件可评估 MinerU。** 两者都比 AnyDoc/MarkItDown 重，不应成为所有输入的默认路径。
- **暂不建议把 tomd 设为默认。** `tomd` 名称有歧义：`sacquatella/tomd` 只承诺对 PDF/DOCX/PPTX 做 basic text extraction；另一个 `tomd-converter` 虽覆盖面较广，但官方 PyPI 元数据仍标为 Alpha 0.1.0。两者都应先做样本验证。

这一步本身通常不消耗模型 token；只有 OCR/图片描述选择云端或 LLM 模式，以及 Agent 后续读取转换结果并形成 `lecture.md` 时才消耗 token。

## 工具对比

| 工具 | 输入与输出 | 图片与表格 | 部署与离线 | 许可证 | 对 lecture 流程的适配 |
| --- | --- | --- | --- | --- | --- |
| AnyDoc | DOC/DOCX/DOCM、PPT/PPTX 等、XLS/XLSX 等、ODF、RTF、EPUB、CSV、文本型 PDF -> GFM；也可返回统一 Document 模型 | 合并单元格、表头、讲者备注；嵌入图片在 Markdown 中表现为 alt text，原始字节保留在 Document 模型；不做扫描 PDF OCR | 很轻；纯 Rust，无 ML 和外部服务；CLI/Node/Python/WASM，本地离线 | MIT | **最适合默认前置层**，尤其与 Node/PPTKit 组合；需额外脚本把 Document 模型里的图片落盘并写入资产清单 |
| Microsoft MarkItDown | PDF、Word、PowerPoint、Excel、图片、音频、HTML、CSV/JSON/XML、ZIP、EPUB 等 -> Markdown | 保留标题、列表、表格、链接等；图片描述和 OCR 可选 LLM/插件或 Azure，默认本地转换更轻 | 轻量 Python 3.10+；格式依赖可按 extra 安装；内置转换可离线，Azure/LLM 路径联网且可能计费 | MIT | **适合稳定、轻量的现有 DOCX/Office 转换**；官方明确说输出面向文本分析，不追求高保真人类排版 |
| Docling | PDF、现代/旧版 Office、ODF、图片、HTML、Markdown、CSV、EPUB 等 -> Markdown、无损 Docling JSON、HTML、文本等 | 专门的版面、OCR 和表格结构识别；表格可导出 Markdown/HTML；可生成图片并用本地或远程 VLM 做描述 | 中到重；Python/PyTorch/模型；CPU 可用，模型可预下载后完全离线，远程服务必须显式启用 | MIT | **适合作为复杂文档 fallback**；保留 Docling JSON 可支持来源定位和后续增量复核，Markdown 供 Agent 阅读 |
| MinerU | PDF、图片、DOCX、PPTX、XLSX、网页 -> Markdown、按阅读顺序 JSON 和中间格式 | OCR、多栏、手写、跨页表格；公式转 LaTeX，表格转 HTML；提取图片、图注、表题和脚注 | 重；支持纯 CPU，但官方 quick start 给出的 pipeline 配置需要至少 16 GB RAM、20 GB 磁盘；支持私有全离线、GPU/VLM | MinerU Open Source License：基于 Apache-2.0，但有额外商业门槛和在线服务署名义务 | **适合高难 PDF/中文扫描件专项通道**，不宜成为普通 Office 的常驻依赖；引入前需接受自定义许可证 |
| toMD (`sacquatella/tomd`) | HTML、PDF、DOCX、PPTX -> Markdown + YAML front matter；Office/PDF 为 basic text extraction | 未承诺 Office/PDF 表格或图片结构保真；HTML 图片描述可调用本地 Ollama + LLaVA | 轻量 Go CLI；本地文件可离线，网页需网络，图片描述需本地模型 | Apache-2.0 | 格式窄且结构提取基础；适合实验，不适合多格式正式材料默认入口 |
| `tomd-converter` (`earthwrld/tomd`) | PDF、DOCX、PPTX、XLS/XLSX、HTML、EPUB、CSV、JSON、XML、文本、ZIP；可选图片 OCR、音频、YouTube -> Markdown + 最小 YAML front matter | 官方页面展示 Markdown 表格；图片 OCR 为可选 extra；未体现统一资产模型或复杂布局质量保证 | 轻到中；Python 3.10+，按需懒加载依赖，可离线处理本地格式 | MIT | 功能方向匹配，但截至调研日仍为 Alpha 0.1.0；应先做真实样本验证 |

## 关键事实与一手来源

### AnyDoc

准确项目是 Firecrawl 的 [`firecrawl/anydoc`](https://github.com/firecrawl/anydoc)，不是同名的文档生成论文。官方仓库说明它：

- 将 Word、PowerPoint、Excel、OpenDocument、RTF、EPUB、CSV 和 PDF 转成统一的 GitHub-Flavored Markdown；支持旧版 Office 格式，如 `.doc`、`.ppt`、`.xls`。
- 每种格式先进入统一 Document 模型，再由同一 Markdown serializer 输出；模型包含 blocks、inlines、tables、footnotes 和 assets。
- 表格支持合并单元格和表头，PPT 支持 speaker notes；嵌入图片的原始字节保留在 Document 模型中，但 Markdown 默认主要呈现其 alt text。
- 纯 Rust，无 ML 模型、无外部服务；文本型 PDF 可本地解析，但 image-only PDF 会返回 unsupported，需要 OCR fallback。
- 提供官方 Agent Skill，安装示例为 `npx skills add firecrawl/anydoc`；CLI 首次由 `npx` 下载平台预编译二进制。

来源：[AnyDoc 官方 README](https://github.com/firecrawl/anydoc#readme)、[AnyDoc 官方项目页](https://firecrawl.github.io/anydoc/)、[MIT License](https://github.com/firecrawl/anydoc/blob/main/LICENSE)。

### Microsoft MarkItDown

[`microsoft/markitdown`](https://github.com/microsoft/markitdown) 将多种文件转换为供 LLM 和文本分析使用的 Markdown。官方明确说明它保留标题、列表、表格、链接等重要结构，但“不一定是面向人类的高保真文档转换”。

- 支持 PDF、PowerPoint、Word、Excel、图片、音频、HTML、文本格式、ZIP 和 EPUB 等。
- Python 3.10+；可只安装所需 extra，例如 `markitdown[pdf,docx,pptx]`，部署较轻。
- 内置 converter 是本地、按格式提取；图片描述、增强 OCR 或 Azure Content Understanding 属于可选路径，可能调用模型或收费云服务。
- 官方 OCR 插件会把 PDF/DOCX/PPTX/XLSX 中的图片发送给配置的 LLM Vision；因此隐私和 token 成本应与纯本地转换分开管理。

来源：[MarkItDown 官方 README](https://github.com/microsoft/markitdown#readme)、[OCR 插件说明](https://github.com/microsoft/markitdown/blob/main/packages/markitdown-ocr/README.md)、[MIT License](https://github.com/microsoft/markitdown/blob/main/LICENSE)。

### Docling

[`docling-project/docling`](https://github.com/docling-project/docling) 的核心优势是先生成统一的 `DoclingDocument`，再输出 Markdown 或无损 JSON；这比只保留 Markdown 更适合回查表格、图片和页面来源。

- 官方支持 PDF、DOCX/XLSX/PPTX、旧版 Office（需 LibreOffice）、ODF、图片、HTML、CSV 等；输出支持 Markdown、无损 JSON、HTML、Text、DocTags 等。
- PDF 可启用表格结构识别，并在 FAST/ACCURATE TableFormer 模式间选择；图片分类/描述属于 enrichment，默认关闭，因为会显著增加处理时间。
- 默认首次使用会下载模型；官方提供预下载和 `artifacts_path`，用于断网或隔离环境。官方也明确说明主目标是运行本地模型，远程服务需要显式 opt-in。
- 安装包含 PyTorch/模型，明显重于 AnyDoc 和 MarkItDown，但可在 Windows/macOS/Linux 与 CPU 环境运行。

来源：[支持格式](https://docling-project.github.io/docling/usage/supported_formats/)、[离线与高级选项](https://docling-project.github.io/docling/usage/advanced_options/)、[Enrichments](https://docling-project.github.io/docling/usage/enrichments/)、[安装说明](https://github.com/docling-project/docling/blob/main/docs/getting_started/installation.md)、[MIT License](https://github.com/docling-project/docling/blob/main/LICENSE)。

### MinerU

[`opendatalab/MinerU`](https://github.com/opendatalab/MinerU) 面向复杂文档解析，官方列出的能力包括扫描件、手写、多栏、跨页表格，公式转 LaTeX、表格转 HTML，以及图片、图注、表题和脚注提取。

- 当前官方 README 声明支持 PDF、图片、DOCX、PPTX、XLSX 和网页，输出结构化 Markdown、JSON 和中间格式。
- 支持 CPU/GPU、CLI、REST API、Docker 和完全离线私有部署。
- 官方 quick start 对本地 pipeline 给出至少 16 GB RAM、20 GB 磁盘的要求，因此不属于轻量默认依赖。
- 当前不是标准 Apache-2.0：`MinerU Open Source License` 基于 Apache-2.0，但增加商业规模门槛，以及对第三方在线服务的显著署名义务。

来源：[MinerU 官方 README](https://github.com/opendatalab/MinerU#readme)、[Quick Start](https://github.com/opendatalab/MinerU/blob/master/docs/en/quick_start/index.md)、[MinerU Open Source License](https://github.com/opendatalab/MinerU/blob/master/LICENSE.md)。

### tomd 名称歧义

调研中发现至少两个同名项目，用户如果已有具体 skill URL，应以该 URL 为准：

1. [`sacquatella/tomd`](https://github.com/sacquatella/tomd) 的项目名为 toMD。官方 README 明示首版支持 HTML、PDF、DOCX、PPTX，但将后三者描述为 basic text extraction；不支持 Excel 和独立图片输入。图片理解只明确用于 HTML 页面，并调用本地 Ollama 与 LLaVA。它是 Go CLI，本地文件转换可离线，Apache-2.0。官方未承诺 DOCX/PPTX 图片抽取或表格结构保真，不能据名称推断这些能力。来源：[官方 README](https://github.com/sacquatella/tomd#readme)、[Apache-2.0 License](https://github.com/sacquatella/tomd/blob/main/LICENSE)。
2. PyPI 包 [`tomd-converter`](https://pypi.org/project/tomd-converter/) 的发布来源指向 `earthwrld/tomd`。官方包页称其支持 PDF、DOCX、PPTX、XLS/XLSX、HTML、EPUB、CSV/TSV、JSON、XML/SVG、文本/源码和 ZIP；图片 OCR、音频和 YouTube 为 optional extras；Python 3.10+、MIT、懒加载依赖。但 PyPI Development Status 仍为 `3 - Alpha`，版本为 `0.1.0`。

两者都不应只凭 README 的格式列表进入正式默认链路；需用真实业务样本验证表格、图片、中文排版、失败报告和资产落盘。

## 推荐的工程边界

### 1. 原始文件层

`sources/` 只保存原始输入和校验信息，不让转换器覆盖原文件。建议 `manifest.json` 记录：原文件名、哈希、转换器和版本、转换时间、输出文件、警告、OCR 是否启用。

### 2. 机械提取层

输出 `extracted/<source-id>.md` 和 `assets/<source-id>/...`。此层只负责结构保真，不摘要、不改写、不做业务判断。这样重新提取不会消耗模型 token，也便于更换转换器做 A/B 对比。

建议按输入路由：

```text
普通 Office / 文本型 PDF -> AnyDoc
现有稳定 DOCX 路径       -> MarkItDown（可继续）
扫描件 / 复杂 PDF        -> Docling
高难中文扫描与跨页表格   -> MinerU（专项启用）
```

对于同一文件，不要默认同时跑四套工具；只有转换结果出现空页、表格错位、阅读顺序错误、图片缺失或 OCR 低置信度时，才升级 fallback。

### 3. 内容整理层

Agent 读取 `extracted/*.md` 和资产清单，生成 `draft lecture.md`。这一层才做合并、去重、事实/判断/建议分类、来源引用、冲突和待确认项整理，因此会消耗模型 token。

### 4. 用户确认边界

用户确认的是 `lecture.md` 的事实、数字、结论、范围、来源和冲突处理，不需要逐字确认机械提取文件。只有提取器报告异常或 Agent 引用不确定时，才回查 `extracted/` 或原文件。

确认后建议在 front matter 中写入状态和来源版本，例如：

```yaml
---
status: confirmed
source_manifest: ./manifest.json
confirmed_at: 2026-08-21
---
```

### 5. PPTKit 层

PPTKit 默认只读取已确认的 `lecture.md` 和 `assets/`，不重复读取全部原始 Office/PDF。仅在以下情况回查原始层：新增材料、核对争议数据、恢复遗漏图片、或 `lecture.md` 的来源引用不足。

## 落地建议

不必寻找一个“大而全的转换 Skill”替换现有内容整理 skill。更稳妥的组合是：

1. 保留现有 skill，定位为“提取结果 -> 用户确认的 `lecture.md`”。
2. 将文件格式转换抽成可替换 adapter，默认接 AnyDoc 或现有 MarkItDown。
3. 增加 Docling fallback；只有实际样本证明 Docling 仍不足时，再引入 MinerU。
4. 转换器版本和结果落盘，后续修改 PPT 时复用 `confirmed lecture.md`，避免每轮重新理解原始文件。
5. 用 5-10 份真实材料做验收集，至少覆盖中文 DOCX 表格、带图 PPTX、多 sheet XLSX、文本型 PDF 和扫描 PDF，再决定最终默认路由。
