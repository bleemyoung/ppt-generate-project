# 开源演示文稿编排方案调研

调研时间：2026-08-21。仅采用项目官方 GitHub 仓库、官方文档和 Agent Skills 官方规范。

## 结论

目前没有发现一个可直接安装的 Agent Skill，完整实现以下指定组合：

```text
多格式原始文件
→ 按文件能力路由 AnyDoc / Docling
→ 生成可人工审阅的 Markdown 内容契约
→ 用户确认事实和内容边界
→ 调用 PPTKit 生成并验证 PPTX
```

但已有两个非常接近的开源参考：

- **Presenton** 是最接近完整产品流程的实现：上传文件后先转换为 Markdown，提供文档预览页供用户修改，官方流程明确把结果称为“cleaned, user-approved Markdown”，之后才生成 outline 和 presentation。它可以直接用于“文档到 PPT”的场景，但不使用 AnyDoc/Docling Skill，也不调用 PPTKit。[官方流程文档](https://presenton-521d9e2f.mintlify.app/v3/contribution-guides/presentation-generation-flow) [官方仓库](https://github.com/presenton/presenton)
- **deck.md / deck-architect** 是最值得借鉴的“中间契约 + 确认门”设计：Agent 先创建 `status: draft` 的 `deck.md`，用户批准后才能生产幻灯片，并明确规定不能只依据聊天历史生成，`deck.md` 才是 production contract。它没有内置通用 Office/PDF 转换路由，默认渲染器也不是 PPTKit。[官方仓库](https://github.com/rodrigolourencofarinha/deck.md)

因此，若目标是保留现有 PPTKit，推荐自己维护一个轻量编排 Skill，并重点复用 Presenton 的阶段划分与 `deck.md` 的契约思想，而不是重新实现文档解析或 PPT 构建。

## 分类

| 分类 | 项目 | 判断 |
| --- | --- | --- |
| 可直接用 | [Presenton](https://github.com/presenton/presenton) | 完成多文件上传、Markdown 预览/编辑、outline、幻灯片生成和 PPTX 导出；最接近完整需求，但属于独立应用/API，不是调用其他 Skill 的编排 Skill，也不使用 PPTKit。 |
| 可组合参考 | [deck.md](https://github.com/rodrigolourencofarinha/deck.md) | `draft → human approval → production` 的 Markdown 契约非常适合移植为 `lecture.md` 确认门；文件格式转换能力不足，输出运行时与 PPTKit 不同。 |
| 可组合参考 | [AnyDoc](https://github.com/firecrawl/anydoc) | 自带 `convert-documents-to-markdown` Agent Skill，支持 Word、PowerPoint、Excel、OpenDocument、RTF、EPUB、CSV 和文本型 PDF；CLI 不交互，也不负责总结或用户确认。扫描/纯图片 PDF 不支持 OCR。[官方 Skill](https://github.com/firecrawl/anydoc/blob/main/skills/convert-documents-to-markdown/SKILL.md) |
| 可组合参考 | [Docling](https://github.com/docling-project/docling) | 官方 Skill 可将 PDF、Office、图片等转换为 Markdown 或无损结构化 `DoclingDocument`，适合 OCR、复杂 PDF 和表格 fallback；不提供 `lecture.md` 内容确认门。[官方 Skill](https://github.com/docling-project/docling/blob/main/docling/.agents/skills/docling/SKILL.md) [官方 MCP](https://github.com/docling-project/docling-mcp) |
| 可组合参考 | [PPTKit Presentation](https://github.com/openHacking/pptkit-presentation) | 支持多种输入并要求用户确认逐页 outline 后再生成，构建、验证、预览链路成熟；确认对象主要是 brief/outline，而不是独立的原始事实与完整内容契约。[官方 Skill](https://github.com/openHacking/pptkit-presentation/blob/main/skills/pptkit-presentation/SKILL.md) |
| 可组合参考 | [Contentful skill-kit](https://github.com/contentful/skill-kit) | 用 TypeScript 把 Skill 定义成带结构化状态、分支、确认动作和显式 transition 的状态机；其 composite 模式可作为路由多个子 Skill 的 dispatcher。它是编排开发框架，不是现成的文档转 PPT 流程。 |
| 不匹配 | [PPTAgent / DeepPresenter](https://github.com/icip-cas/PPTAgent) | 能接收附件并自动生成、反思和导出 PPTX，但官方工作流没有可持久化、可由用户确认后再继续的 Markdown 内容契约。适合作为生成架构参考，不适合作为确认边界模板。 |
| 不匹配 | [skillkit](https://github.com/crafter-station/skill-kit) | 用于统计 Skill 使用、上下文成本、触发冲突和清理未使用 Skill，不负责 Skill 编排或运行时依赖解析。 |

## Agent Skill 组合边界

[Agent Skills 官方规范](https://agentskills.io/specification)只定义 `SKILL.md`、`scripts/`、`references/`、`assets/` 及渐进加载，没有正式的 Skill 依赖、版本锁定或编排字段。官方社区中的 `skills.json`/依赖解析仍是提案，并明确把包依赖与编排留在规范之外。[依赖清单提案](https://github.com/agentskills/agentskills/discussions/210)

所以当前可靠做法是：

1. 编排 Skill 在说明中检查下游 Skill/CLI 是否可用。
2. 将调用条件和 fallback 写成显式路由规则。
3. 用工作区文件保存阶段状态，而不是假设 Skill 调用栈可以恢复。
4. 用户确认 `lecture.md` 前禁止进入 PPTKit；确认后只把 `lecture.md`、资产和必要来源索引交给 PPTKit。

如果希望把阶段恢复、结构化输出和确认动作做成代码级约束，而不只是写在 `SKILL.md` 中，可以参考 [Contentful skill-kit](https://github.com/contentful/skill-kit) 的 workflow/composite 模式。它支持带 schema 的步骤、显式状态转移、`confirm` 交互和子 Skill dispatcher，但会引入额外的 TypeScript 构建与运行时；对当前工作区，先用普通 `SKILL.md + pipeline-state.json` 通常更轻。

建议的最小组合：

```text
.md/.txt --------------------------┐
Office/文本型 PDF → AnyDoc --------┤
扫描件/复杂 PDF → Docling ---------┤
                                  ↓
                     extracted Markdown
                                  ↓
                 编排 Skill 整理 lecture.md
                                  ↓
                    用户确认内容与事实边界
                                  ↓
                      pptkit-presentation
```

编排 Skill 的主要原创部分只需要是路由、转换质量检查、`lecture.md` 契约、确认状态与恢复逻辑。文档转换和 PPT 构建分别交给现有专业组件。
