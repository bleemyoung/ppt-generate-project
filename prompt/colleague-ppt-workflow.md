# 非开发同事 PPT 全流程执行提示词

把当前打开的项目根目录作为唯一工作区，先阅读并严格执行 `AGENTS.md`。随后读取并执行：

- `.agents/skills/build-ppt-from-source/SKILL.md`
- 环境未就绪时：`.agents/skills/setup-pptx-environment/SKILL.md`
- `input/` 包含 DOCX 或 XLSX 时：对应的项目级转换 Skill

用户没有开发背景。使用通俗中文说明结果和需要确认的决策，不要求用户理解 Node.js、Python、PptxGenJS、虚拟环境、命令参数或内部文件生命周期。

## 输入

- 默认扫描 `input/` 中除 `.converted/` 转换缓存外的全部原始材料，不静默跳过任何原件。
- 自动识别其中用于内容的材料和用于视觉参考的 PPT/PPTX。
- 存在多份候选参考模板、材料冲突或用途无法判断时，列出文件并给出推荐选择，等待用户确认。
- 用户在对话中提供了其他明确路径时，将其一并纳入材料范围。
- 如果 `input/` 不存在或为空，并且对话中没有正文、其他材料路径或已确认的中间文件，明确提醒用户补充材料并停止；此时不部署环境、不创建后续文件，也不生成 PPT。
- 如果只有参考模板而没有业务内容材料，说明模板只能约束样式，并等待用户补充内容。
- 用户明确要求继续已有且已确认的 `lecture.md` 或 `storyboard.md` 时，从该检查点继续，不因 `input/` 为空而重做前序阶段。
- 复用中间文件前核对材料是否新增、删除或修改；发生变化时报告受影响阶段，从最早受影响的确认点恢复。

## 环境

1. 材料存在门禁通过后再只读检查环境；环境已经就绪时直接进入材料处理。
2. 下载软件、安装依赖、创建 `.venv`、生成 `node_modules`、修改 PATH 或系统配置前，说明缺失项、建议方案、文件影响、联网和权限要求，等待用户明确同意。
3. Python 依赖安装在当前项目的 `.venv`，Node.js 依赖安装在当前项目的 `node_modules`。
4. 核实使用标准 Python；Office、LibreOffice、Windows Store 占位程序或其他应用内置 Python 不作为项目解释器。
5. LibreOffice 不是生成 PPTX 的基础依赖。只有用户明确要求相应的自动视觉渲染时才讨论 LibreOffice、Poppler 或 ImageMagick。

## 阶段门禁

严格按以下顺序执行，每个确认点完成后停止并等待用户回复“同意”或“继续”：

1. **材料清单**：报告检测到的文件类型、转换计划、不支持项、材料冲突和已有检查点是否失效；转换后同时报告各文件状态、DOCX 图片、XLSX 工作表与图片，以及 Excel 原生图表等无法提取的内容。
2. **Brief**：从材料中先补全事实，只把无法推断的目的、受众、核心目标、来源优先级、篇幅和演示时间作为编号决策提交确认，并给出推荐答案。
3. **Lecture**：Brief 确认后，只生成 `intermediate/lecture.md`；汇报事实、内容边界、来源和待补充信息后停止。
4. **Storyboard**：lecture 确认后，只生成 `intermediate/storyboard.md`；汇报总页数、逐页标题、唯一任务、可见内容、版式和来源后停止。
5. **Build**：storyboard 确认后，执行 `build-ppt-from-source` 的“实现上下文”：
   - 读取 PptxGenJS 构建约定；
   - 以 `build-starter.mjs` 为骨架创建 `scripts/build.mjs`；
   - 阅读脱敏案例，但只参考实现结构，不继承案例文案；
   - 有参考模板时读取模板落实约定，把模板证据落实为 storyboard 样式契约；
   - 完成语法检查后停止并汇报脚本状态。
6. **Execute**：Build 已确认且语法通过后，生成 `output/*.generated.pptx`，验证文件非空、PPTX 包结构、页数和 storyboard 一致性；随后标记为“待验收”并停止。
7. **人工视觉验收**：请用户用 PowerPoint 或 WPS 打开文件，检查裁切、重叠、可读性、对齐间距、图表表格、页面顺序和模板一致性。未通过时根据页码或截图修复 storyboard 与 builder；只有用户明确确认通过后才汇报完成。

## 默认边界

- 使用 PowerPoint 原生可编辑文字、形状、表格和图表。
- 自动生成目标只使用 `*.generated.pptx`，保留 `*.final.pptx`。
- 默认不生成 PNG、不执行自动视觉 QA。
- 默认执行人工视觉验收；它不依赖 LibreOffice，也不要求生成 PNG。
- 示例、模板占位文案、内部路径和来源文件名不进入页面正文。
- 遇到文件占用时停止重试，提示用户保存并手动关闭相关 Office 文件。
- 每阶段汇报创建或修改的文件、完成结果、风险和下一步，随后等待确认。最终固定列出 lecture、storyboard、builder、generated PPTX，以及 final PPTX 是否存在、人工修改是否已回写。

现在从读取 `AGENTS.md` 和扫描 `input/` 开始；材料存在门禁通过后再只读检查环境。
