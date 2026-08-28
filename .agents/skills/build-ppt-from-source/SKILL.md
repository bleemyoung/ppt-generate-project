---
name: build-ppt-from-source
description: 从 Markdown、DOCX、XLSX、报告或笔记开始，通过材料预处理、需求澄清、lecture.md、storyboard.md、PptxGenJS build.mjs 和 Agent 默认执行，生成可复现、可编辑的 PowerPoint。适用于从零制作 PPT、继续已有阶段、重新生成 .generated.pptx、修复换行或重叠，以及把人工修改同步回 Markdown 与脚本。面向非技术用户时必须用通俗语言引导，不要求用户理解阶段名、Node.js 命令或文件生命周期。
---

# 从原始材料生成 PPT

把确认事实保存在 `intermediate/lecture.md`，把逐页决策保存在 `intermediate/storyboard.md`，把实现保存在 `scripts/build.mjs`。默认工作区根目录是包含本 Skill 的项目根目录。

## 默认文件位置

```text
<工作区>/
├── input/                          # 建议放置原始材料
├── intermediate/                   # 中间产出（lecture、storyboard 等阶段契约）
│   ├── lecture.md                  # 内容与事实契约
│   └── storyboard.md               # 页面与版式契约
├── scripts/build.mjs               # 可重复构建脚本
└── output/<名称>.generated.pptx    # 自动生成、允许覆盖
```

用户明确指定其他路径时遵从用户；否则不得让非技术用户选择内部目录。不得把本机绝对路径写入长期文件。

## 材料存在门禁

进入内容整理或构建阶段前，必须先确认存在可用材料。以下任一项可视为可用材料：

- `input/` 中存在本工作区当前支持处理的源文件；
- 用户在对话中明确提供了工作区内外的文件或目录路径；
- 用户已在对话中粘贴了足以开始整理的正文内容；
- 用户明确要求继续已有阶段，且对应的 `intermediate/lecture.md` 或 `intermediate/storyboard.md` 已存在并经过确认。

参考 PPT/PPTX 只用于约束视觉样式，默认不视为业务内容材料；除非用户明确说明模板中的正文也应作为内容来源。

扫描 `input/` 时把 `input/.converted/` 视为转换缓存，不作为新的原始材料再次扫描或转换。只有能对应到本次原件且仍有效的转换结果，才可进入内容分析。

如果 `input/` 不存在或为空，且没有上述其他可用材料：

1. 明确提醒用户“尚未发现可用于制作 PPT 的内容材料”。
2. 告知用户可将材料放入 `input/`、直接粘贴正文，或提供明确的文件路径。
3. 不安装环境，不创建或覆盖中间文件，不编写构建脚本，不生成 PPT，等待用户补充材料。

如果 `input/` 中只有当前无法转换的文件，列出这些文件及缺失的转换能力，不静默跳过，也不进入后续阶段。如果只有参考模板而没有内容材料，说明模板只能约束样式，并等待用户补充内容。

用户明确要求从已确认的 `lecture.md` 或 `storyboard.md` 继续时，允许从检查点恢复；此时 `input/` 为空不构成阻塞，也不得重做已确认阶段。

复用已确认的中间文件前，核对当前材料与 lecture 中记录的来源清单。材料新增、删除、修改或来源优先级变化时，报告变化及受影响阶段；从最早受影响的阶段重新确认，不静默沿用已经失效的 lecture、storyboard 或脚本。无法判断材料是否变化时，说明不确定性并请用户决定是否复用。

## 默认引导流程

用户只需提供材料文件或目录。未明确要求单阶段执行时：

1. 解析用户提供的材料范围并执行“材料存在门禁”；通过后扫描材料并列出检测到的文件类型，不静默跳过任何文件。
2. 检查转换与构建环境；环境未就绪时按“环境衔接”处理。
3. 调用对应转换 Skill 预处理 DOCX、XLSX 等支持的材料，将结果放入 `input/.converted/`；提交转换完整性报告并等待材料清单确认。
4. 阅读用户消息、原始材料和转换结果，完成 PPT Brief 询问并等待确认。
5. 生成 `lecture.md`，说明内容并等待确认。
6. 依据已确认的 lecture 生成 `storyboard.md`，说明页数和叙事并等待确认。
7. 生成 `scripts/build.mjs` 并运行语法检查。
8. 语法通过后默认执行脚本生成 `.generated.pptx`；遇到覆盖风险或文件占用时按本 Skill 暂停处理。
9. 完成结构检查后，将产物标记为“待验收”，请用户打开 PPT 做人工视觉验收；未通过时按页码或截图反馈修复。
10. 用户明确确认视觉验收通过后，汇报固定交付清单并结束。除非用户明确要求，不渲染 PNG。

用户明确指定 `brief`、`environment`、`lecture`、`storyboard`、`build`、`execute` 或 `qa` 时，只执行该阶段并停止。不要要求非技术用户主动选择这些名称。

## PPT Brief 门禁

先从用户消息、材料、README、已有 lecture 和 storyboard 中补全事实，不让用户重复提供。确认以下维度：

| 维度 | 要求 | 需要明确 |
| --- | --- | --- |
| PPT 目的 | 必填 | 汇报、方案、培训、复盘、立项等 |
| 受众 | 必填 | 人员、专业程度、主要关注点 |
| 核心目标 | 必填 | 希望受众知道、相信、批准或决定什么 |
| 内容来源 | 必填 | 哪些材料是事实依据，冲突时以谁为准 |
| 篇幅与时间 | 必填 | 页数范围和演示时长 |
| 内容结构 | 推荐 | 指定章节或叙事顺序 |
| 表达风格 | 推荐 | 管理型、技术型、咨询型、培训型等 |
| 视觉约束 | 推荐 | 模板、比例、配色、字体和图表偏好 |

前五项未确认、未明确授权 Agent 决定且无法从上下文确定时，不得生成 lecture 或后续产物。

询问规则：

- 事实先查文件，只有决策才问用户。
- 互不阻塞的问题可以一次列出多项；有依赖的问题按顺序追问。
- 每个待确认项给出推荐答案和一句影响说明。
- 允许用户回复 `1、2、3确认；4改为……`。
- 可选项缺失时提出保守默认值，不把猜测静默升级为要求。
- Brief 确认后写入 `intermediate/lecture.md` 前部，作为后续共同契约。

## 环境衔接

```text
$build-ppt-from-source
        ↓ 环境检查
环境已就绪 → 继续 PPT 流程
环境未就绪 → 建议调用 $setup-pptx-environment
        ↓ 环境部署完成
返回之前暂停的 PPT 流程
```

环境未就绪时：

- 报告缺失项和当前已完成的 PPT 检查点；
- 推荐工作区内的 `.agents/skills/setup-pptx-environment/SKILL.md`，等待用户接受；
- 环境准备期间保留已确认的 Brief、lecture、storyboard 和脚本，不重新生成或覆盖；
- 环境完成后只复查环境，从暂停阶段继续；
- 不要求用户重复已确认信息；
- 环境 Skill 无法被注册调用时，直接读取上述相对路径；相对路径也不可用时再给出最低限度指引。

## 输入转换

- Markdown：直接读取。
- DOCX：必须先读取并执行 `.agents/skills/convert-word-to-md/SKILL.md`，不得临时解析 Word XML。转换结果放入 `input/.converted/`，再从 Markdown 生成 lecture。
- XLSX：必须先读取并执行 `.agents/skills/convert-excel-to-md/SKILL.md`，不得临时解析工作簿 XML 或临时编写提取脚本。转换结果放入 `input/.converted/`，再从 Markdown 生成 lecture。
- 旧版 `.doc`：要求用户另存为 `.docx`。
- 旧版 `.xls`：要求用户另存为 `.xlsx`。
- PDF：只有工作区存在对应转换 Skill 时才处理；否则立即说明当前工作区未携带该能力，不得静默跳过或声称已读取。
- 混合目录：先列出检测到的文件类型；对不支持类型明确报告。

转换是材料预处理，不代表 lecture 已完成。转换后仍需核对事实、表格和图片引用。

材料清单确认前提交转换完整性报告，至少包括：

- 每个文件的转换成功、失败或不支持状态；
- DOCX 中提取到的图片及无法可靠对应的图片；
- XLSX 的工作表、嵌入图片，以及无法提取的原生图表等限制；
- 转换失败、密码保护、损坏或内容缺失对后续 PPT 的影响。

## Lecture 阶段

`lecture.md` 是内容事实来源，应包含：

- 已确认的 PPT Brief；
- 来源清单，使用工作区相对路径记录原件、转换结果及其对应关系，不记录本机绝对路径；
- 已验证的事实、数据、表格、结论和来源；
- 范围、排除项、比较维度和建议；
- 环境与可移植性边界；
- 适合放入附录但不应挤占正文的材料。

保留关键表格，区分事实与演示建议。不要在 lecture 中写坐标或实现页面。创建后汇报文件并等待确认。

## Storyboard 阶段

只能依据已确认的 lecture 创建 `storyboard.md`。每页包含：

- `Title`：面向观众的结论式标题；
- `Goal`：本页唯一叙事任务；
- `Visible content`：页面实际可见内容；
- `Visual`：布局、流程、表格、图表或代码形式；
- `Key message`：观众应带走的结论；
- `Speaker notes`：讲解补充；
- `[Sources]`：lecture 或原始材料引用。

逐页列表前定义画布、主题、字体层级、页码、可编辑对象要求和 QA 策略。正文保持简洁，完整命令、环境版本和复用提示词放附录。此阶段不创建脚本或 PPTX。

## 版式契约

先区分封面标题、页面标题、卡片标题、正文、流程节点、技术标识、表格/代码和页脚，再定义样式。

- 同层级保持相同字体、字号、粗细、颜色、文本框宽高、内边距、对齐、行距和间隔。
- 用户只指出一个节点的换行、重叠或字号问题时，主动检查并同步整组同层级节点。
- 长文字先精简、统一加宽同组节点或显式换行；不得只把一个同层级节点缩小。
- 12pt、14pt 等局部例外必须在对应页面 `Visual` 中记录对象、数值和原因，并通过页面参数实现。
- 标题和正文使用独立文本框；重复卡片保持统一宽高、基线和间隔。
- 连接线先绘制并置于节点后方，避免穿过文字。

## Build 阶段

### 实现上下文

首次创建 `scripts/build.mjs` 或页面体系发生实质变化时：

1. 读取 [`references/pptxgenjs-patterns.md`](references/pptxgenjs-patterns.md)。
2. 以 [`assets/build-starter.mjs`](assets/build-starter.mjs) 为骨架创建工作区脚本，不从空文件临场搭建基础设施。
3. 读取 [`../../../examples/template-driven-case/case.md`](../../../examples/template-driven-case/case.md)，并按其路由检查案例的 lecture、storyboard 和 builder；只参考实现结构，不继承案例文案。
4. 用户提供参考模板或模板包时，再读取 [`references/template-following.md`](references/template-following.md) 和模板包自身说明，把模板证据写入 storyboard 的全局版式契约后再实现。若当前工具无法可靠识别模板的视觉证据，不得凭空补全；说明可确认与不可确认的部分，请用户提供关键页面截图，或在生成后通过人工预览反馈校正。

修复既有 `build.mjs` 时优先理解并局部修改现有实现；只有缺少对应组件或现有结构阻塞修复时才加载 starter 或案例。工作区存在更贴近目标模板且已验证的案例时，优先选择该案例，并说明选择依据。

使用 PptxGenJS 创建 `scripts/build.mjs`：

- 从 `import.meta.url` 推导项目相对路径；
- 默认输出 `output/<名称>.generated.pptx`；
- 使用 PowerPoint 原生可编辑文字、表格、图表和形状；
- 页数、顺序、文案和版式逐页覆盖 storyboard；
- 集中定义主题、颜色、字体层级、标题、备注、页脚、表格和重复节点；
- 每页备注加入 `[Sources]`；
- 只在执行时创建 `output/`；
- 永远不把 `.final.pptx` 作为脚本输出目标。

优先正常导入 PptxGenJS。若 ESM 入口与 Node 组合不兼容而 CommonJS 可用，可使用：

```js
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");
```

先运行：

```powershell
node --check .\scripts\build.mjs
```

用户明确要求 build-only 时停止。默认引导流程中，storyboard 已确认且语法通过后继续执行。

## Execute 阶段

目标 `.generated.pptx` 已存在时，先说明重新生成会覆盖自动产物；人工修改需要保留时，应先另存为 `.final.pptx` 或回写 storyboard 与脚本。永远不覆盖 `.final.pptx`。

执行：

```powershell
node .\scripts\build.mjs
```

不渲染地验证：

- 输出存在且大小非零；
- PPTX 包内 slide XML 数量符合预期；
- 页数与 storyboard 一致；
- 默认构建没有创建 QA 目录。

结构检查通过只代表文件可用，不代表视觉验收完成。将新生成的 `.generated.pptx` 标记为“待验收”，请用户用 PowerPoint 或 WPS 打开并检查：页面顺序、文字裁切与重叠、字号可读性、对齐间距、图表表格、模板一致性及异常空白。人工预览不依赖 LibreOffice，也不要求先生成 PNG。

用户报告问题时，收集页码和现象；有截图时结合截图定位。修复应先同步 storyboard，再修改 builder 并重新生成。只有用户明确确认人工视觉验收通过，才将本次流程标记为完成。

`EBUSY` 是文件锁，不是代码错误：

- 停止重试并保留全部中间文件；
- 指出被占用的 `.generated.pptx`；
- 请用户保存人工工作，必要时另存 `.final.pptx`，再手动关闭 PowerPoint、WPS、LibreOffice 或资源管理器预览；
- 明确重跑会覆盖 `.generated.pptx`；
- 不结束可能含未保存内容的 Office 进程；
- 用户确认关闭后，只重试 execute 与产物检查，不重建已确认中间文件。

## 文件生命周期

```text
build.mjs
    ↓ 自动生成、允许覆盖
*.generated.pptx
    ↓ 可选：人工调整并另存
*.final.pptx
```

长期保留的人工修改必须同步回 storyboard 和 builder，不能只留在 generated 文件中。

## 可选自动视觉 QA

人工视觉验收是默认必经门禁；自动渲染图片仍为可选。只有用户明确要求自动视觉检查时才渲染图片，并使用独立 QA 目录。检查换行、裁切、重叠、同层级样式、表格溢出、连接线、页码和页脚。确认修复后先改 storyboard，再改 builder，最后重新生成；不得把手改 generated PPTX 当作永久修复。

## 汇报

每个阶段结束时说明：

- 创建或修改的文件；
- 当前完成内容和验证结果；
- 环境版本或包管理器选择（相关时）；
- 局部版式例外及原因；
- 是否执行 PPTX 生成或 PNG QA；
- 下一阶段和仍未执行的内容。

最终完成时固定列出：

- `intermediate/lecture.md`；
- `intermediate/storyboard.md`；
- `scripts/build.mjs`；
- 本次生成的 `output/*.generated.pptx`；
- `output/*.final.pptx` 是否存在，以及其中的人工改动是否已经回写 storyboard 与 builder。
