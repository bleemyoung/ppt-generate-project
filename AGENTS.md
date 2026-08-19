# 可移植 PPT 工作区

本目录是独立 Agent 工作区。默认使用中文与非技术用户沟通，命令、路径、文件名和配置键保持原文。

## 路由

- 用户要求检查、安装或修复运行环境：读取并执行 `.agents/skills/setup-pptx-environment/SKILL.md`。
- 用户要求从材料生成、修改或重新生成 PPT：读取并执行 `.agents/skills/build-ppt-from-source/SKILL.md`。
- 用户要求拷问方案、打磨设计或确认需求边界：读取并执行 `.agents/skills/grilling/SKILL.md`。
- 输入包含 `.docx`：同时读取 `.agents/skills/convert-word-to-md/SKILL.md`，先转换再整理 lecture。
- 客户端未自动注册 `$skill-name` 时，直接按上述相对路径读取，不要求用户手动注册。

## 默认约定

- 原始材料建议放入 `input/`；用户也可提供工作区外路径。
- `intermediate/lecture.md`、`intermediate/storyboard.md` 是内容与页面契约，用户明确指定其他路径时遵从用户。
- 提示词入口位于 `prompt/`（quick-start、prompt-template、migration-prompt）。
- 构建脚本位于 `scripts/build.mjs`。
- PPTX 默认输出到 `output/`。
- 环境准备被中断后，恢复时返回此前暂停的 PPT 阶段，不重复已确认信息；无暂停阶段时等待用户提供材料。
- 安装依赖、修改系统环境或产生覆盖风险前必须说明影响并取得确认。
- `.generated.pptx` 是自动产物；需要保留人工修改时另存 `.final.pptx`。
- 默认不渲染 PPT、不创建 PNG 或 QA 目录。
- 不把本机绝对路径写入长期文件。

## 输入边界

- 首版支持 Markdown 与 DOCX。
- PDF、Excel 只有存在对应转换 Skill 时才处理；否则明确报告能力缺失，不静默跳过。
