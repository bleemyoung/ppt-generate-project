# 在 DeepSeek Harness 中部署 PPTKit Presentation：从安装到可编辑 PPT 的完整实践

> 核对日期：2026-08-19  
> 运行环境：Windows、PowerShell  
> 配套案例：[examples/01-dsh-skill](../../examples/01-dsh-skill/)

如果只让 AI 一次性返回一份 PPT，第一次看起来很快，但后续经常会遇到三个问题：内容修改难以追溯、重新生成容易恢复旧错误、人工调整无法稳定复用。

PPTKit Presentation 提供了另一种思路：让 DeepSeek Harness（以下简称 DSH）先整理来源、确认汇报目标和逐页结构，再通过 Node.js 工程生成可编辑的 `.pptx`。生成过程会保留 brief、页面规格、来源记录和构建报告，适合需要继续修改、周期性更新或交接给他人的正式材料。

本文记录一次完整实践，包括：

- 在 Windows 中启动并配置 DSH；
- 安装 PPTKit Presentation 插件；
- 通过对话生成可编辑 PPT；
- 找到、打开并检查生成结果；
- 修改中间文件后重新构建；
- 在 PowerPoint 中安全地完成最终微调。

需要先说明：DSH 当前仍处于 Developer Preview 阶段，后续版本可能出现不兼容变化。本文命令已按上述日期核对，升级后应以 [DeepSeek Harness 官方仓库](https://github.com/deepseek-ai/deepseek-harness)和 [PPTKit Presentation 官方仓库](https://github.com/openHacking/pptkit-presentation)为准。

## 最终产出了什么

本次配套案例生成了一份 14 页的可编辑 PPT：

- [打开生成的 deck.pptx](../../examples/01-dsh-skill/output/deck.pptx)
- [查看构建检查报告](../../examples/01-dsh-skill/output/build-report.json)
- [查看完整生成工程](../../examples/01-dsh-skill/)

案例中的主要文件如下：

```text
examples/01-dsh-skill/
├── sources/source.md             # 原始材料
├── content/sources.json          # 提取后的来源记录
├── content/assets.json           # 资产记录
├── deck-brief.md                 # 已确认的受众、目的、大纲和约束
├── src/deck-spec.ts              # 真正用于生成 PPT 的页面规格
├── runtime-decision.json         # 本次运行方式的选择记录
└── output/
    ├── deck.pptx                 # 自动生成的可编辑 PPT
    └── build-report.json         # 构建和结构检查结果
```

这里的 `examples/01-dsh-skill` 只是本文配套案例的位置，不是 PPTKit 对所有任务规定的固定目录。通用默认文件名是项目内部的 `output/deck.pptx`，实际绝对路径取决于本次 DSH 创建或使用的项目目录；关键产物通常也会作为聊天附件返回。

## 一、准备运行环境

### 1. 安装 Node.js

DSH 的发布版使用方式要求电脑已经安装 Node.js。安装完成后，可以在 PowerShell 中检查：

```powershell
node --version
npm --version
```

PPTKit 仓库自身的开发环境要求 Node.js 20+，但普通用户安装已发布的 DSH 插件 bundle，不需要参与 PPTKit 源码开发。

### 2. 安装 pnpm

DSH 安装第三方插件时会调用 pnpm，因此需要确保 `pnpm` 在 `PATH` 中：

```powershell
npm install -g pnpm
pnpm --version
```

### 3. 选择 DSH 的运行方式

DeepSeek 官方 README 当前给出的快速启动方式是：

```powershell
npx @deepseek-ai/dsh web
```

这种方式不需要预先全局安装 CLI，适合首次体验。

如果准备长期使用，也可以全局安装：

```powershell
npm install -g @deepseek-ai/dsh
dsh --version
dsh web
```

后续示例优先使用官方主推的 `npx` 写法。已经全局安装时，可以把 `npx -y @deepseek-ai/dsh` 替换为 `dsh`。

## 二、首次启动并配置 DSH

在 PowerShell 中启动：

```powershell
npx @deepseek-ai/dsh web
```

Web UI 默认地址是：

```text
http://127.0.0.1:3080
```

第一次进入后需要完成两项配置。

### 配置模型

进入 `Settings → Models`，填写 DeepSeek API key 和需要使用的模型，然后保存。模型配置保存后可以立即使用，通常不需要为了模型配置重新启动 DSH。

### 选择工作目录

在界面中点击 `Choose workspace`，添加并选中存放材料和 PPT 工程的目录。

只在终端中进入某个目录再启动 `dsh web`，并不等于 Web UI 已经自动选中了该 workspace；开始会话前应在界面中确认。

## 三、安装 PPTKit Presentation 插件

### 推荐：安装 npm 发布的插件 bundle

使用 npx 运行 DSH 时：

```powershell
npx -y @deepseek-ai/dsh plugin --profile web add dsh-plugin-pptkit-presentation
```

已经全局安装 DSH 时：

```powershell
dsh plugin --profile web add dsh-plugin-pptkit-presentation
```

插件安装到 `web` profile。默认情况下，profile 数据位于：

```text
C:\Users\你的用户名\.dsh\profiles\web
```

如果设置过 `DSH_HOME`，实际目录会随之变化。

### 安装后必须重启 DSH

正在运行的 DSH 不会热加载刚安装的插件。安装完成后，先停止当前进程，再重新启动：

```powershell
npx @deepseek-ai/dsh web
```

或者：

```powershell
dsh web
```

### npm 安装失败时：从 GitHub 安装

可以使用 PPTKit 官方仓库中的插件包：

```powershell
dsh plugin --profile web add "openHacking/pptkit-presentation#path:/packages/dsh-plugin-pptkit-presentation"
```

如果没有全局 CLI：

```powershell
npx -y @deepseek-ai/dsh plugin --profile web add "openHacking/pptkit-presentation#path:/packages/dsh-plugin-pptkit-presentation"
```

GitHub 安装需要允许依赖执行 prepare/build 脚本。如果 pnpm 给出相关提示，应把它提示的 key 加入当前 profile 的 `pnpm-workspace.yaml` 中的 `allowBuilds`，然后重新执行安装。这里属于对依赖构建脚本的明确审批，不应使用 `ignore-workspace-root-check=true` 代替。

### 不安装 bundle 的备用方式

如果已经克隆 PPTKit Presentation 官方仓库，也可以复制原生 Skill：

```powershell
node scripts/install-dsh.mjs
```

安装到当前项目：

```powershell
node scripts/install-dsh.mjs --project
```

前者默认安装到 `~/.dsh/skills/pptkit-presentation`，后者安装到当前项目的 `.dsh/skills/pptkit-presentation`。普通用户优先使用已发布的插件 bundle 即可。

## 四、验证插件是否可用

重启 DSH、配置模型并选择 workspace 后，新建会话并输入：

```text
请使用 PPTKit 制作一份测试 PPT。

主题：企业数据治理建设方案
受众：部门管理层
用途：方案汇报
要求：5 页、商务简洁风格。

第一步只整理汇报目标和逐页大纲，暂时不要导出 PPTX。
```

如果 DSH 能识别 `pptkit-presentation` Skill，并开始确认主题、受众、目的和逐页结构，说明插件已经加载。

仅能执行 `dsh --version` 或 `pnpm --version`，只能说明命令可用，不能证明 PPTKit 已在当前 profile 中正常加载。

## 五、用 PPTKit 生成第一份 PPT

PPTKit 的合理用法不是一开始就要求“直接出成品”，而是先确认内容，再批准生成。

### 第一步：提供材料并确认故事线

将 Markdown、文档或其他材料放入已选择的 workspace，然后输入：

```text
请使用 PPTKit，根据当前工作区中的材料制作 PPT。

受众：内部管理层
目的：汇报方案并申请立项
预计：10～12 页，演示 15 分钟
风格：商务、简洁、强调结论

请先完成：
1. 阅读并整理来源；
2. 总结汇报目标；
3. 设计故事线；
4. 给出逐页大纲和每页核心观点；
5. 暂时不要导出 PPTX。
```

这一阶段应重点确认：事实有没有理解错误、页面顺序是否合理、哪些内容应该进入正文、哪些内容应该放到附录。

### 第二步：批准并生成

确认大纲后继续输入：

```text
大纲确认，请批准并生成 PPTX。

要求：
- 每页只承担一个主要叙事任务；
- 避免大段文字；
- 流程关系使用流程表达；
- 数据优先使用表格或图表；
- 所有可见文字、表格和形状保持可编辑；
- 生成后告诉我 PPT、构建报告和中间文件的位置。
```

PPTKit 在 DSH 中会自动选择 Node 工作流。DSH 当前没有 PPTKit 浏览器预览所需的内置浏览器工具，因此这里不会走浏览器预览流程，而是直接构建 PPTX，并交付构建报告和中间文件。

## 六、PPTKit 在 DSH 中做了什么

一次典型生成过程大致如下：

```text
原始材料
   ↓ npm run extract
content/sources.json、content/assets.json
   ↓
deck-brief.md
   ↓
src/deck-spec.ts
   ↓ npm run build
output/deck.pptx
   ↓
output/build-report.json
```

各文件的职责是：

| 文件 | 作用 | 是否建议手工修改 |
| --- | --- | --- |
| `sources/*` | 原始事实和输入材料 | 可以，事实变化从这里开始 |
| `content/sources.json` | 提取后的来源记录 | 不建议，会被重新提取覆盖 |
| `content/assets.json` | 图片等资产的登记结果 | 通常由流程维护 |
| `deck-brief.md` | 已确认的受众、目的、大纲和约束 | 可以，负责记录设计意图 |
| `src/deck-spec.ts` | 实际生成每一页的结构化规格 | 可以，真正影响重建结果 |
| `output/deck.pptx` | 自动生成的 PPT | 可以打开检查，不适合保存长期人工修改 |
| `output/build-report.json` | 构建、结构和布局检查结果 | 不修改，只用于检查 |

配套案例的 `build-report.json` 显示：共 14 页、PPTX 包结构有效、无导出警告和结构错误；视觉渲染检查尚未执行。

## 七、找到、打开并检查 PPT

### 从聊天附件获取

按照 PPTKit 的 DSH 工作流，完成后会将 `deck.pptx`、构建报告以及主要中间文件作为附件返回。下载附件即可交付或打开。

### 从项目目录获取

进入本次生成项目后，默认相对路径是：

```text
output/deck.pptx
```

如果不确定项目位置，可以在当前 workspace 中搜索：

```powershell
Get-ChildItem -Recurse -Filter *.pptx
```

配套案例可以直接这样打开：

```powershell
cd examples\01-dsh-skill
Start-Process .\output\deck.pptx
```

也可以在资源管理器中双击，使用 Microsoft PowerPoint、WPS 或 LibreOffice Impress 打开。

### 第一次打开重点检查什么

- 页数、章节和内容是否符合已确认大纲；
- 标题和正文是否存在截断、重叠或异常换行；
- 表格、流程和图形是否对齐；
- 文字、表格和形状能否单独选中并编辑；
- 字体是否因为当前电脑缺少对应字体而被替换；
- 数据、结论、页码和演讲者备注是否正确；
- 图片是否模糊、变形或裁切不当。

构建报告可以证明 PPTX 包结构和程序检查是否通过，但不能替代 PowerPoint 中的最终视觉验收。

## 八、两种微调方式

### 方式一：修改中间文件并重新生成

这种方式适合需要长期保留、以后还会重复生成的修改。

修改原始事实时，先编辑 `sources` 中的材料，再进入包含 `package.json` 的 PPTKit 生成项目执行：

```powershell
npm run extract
```

修改汇报目标、大纲或约束时，同步更新 `deck-brief.md`；修改页面文案、顺序和布局时，编辑 `src/deck-spec.ts`。

常见字段包括：

| 修改目标 | 对应字段 |
| --- | --- |
| 页面标题 | `title` |
| 页面主结论 | `message` |
| 列表内容 | `items` |
| 封面副标题 | `subtitle` |
| 页面类型 | `role` |
| 构图方式 | `composition` |
| 表格内容 | `table` |
| 左右对比 | `comparison` |
| 演讲者备注 | `notes` |
| 来源关联 | `sourceRefs` |

例如：

```ts
{
  id: "conclusion",
  role: "statement",
  title: "实践结论",
  message: "这里填写观众应该记住的核心结论。",
  items: ["第一条内容", "第二条内容"],
  composition: "split",
  notes: "这里填写演讲者备注。",
  sourceRefs: [{ id: "src-01-source", slideNumbers: [1] }],
}
```

本案例生成项目在 `package.json` 中声明了以下检查脚本，因此可以执行：

```powershell
cd examples\01-dsh-skill
npm run typecheck
npm run build
npm run verify
```

需要生成 PDF、逐页 PNG 和总览图时，再执行：

```powershell
npm run render
```

`typecheck`、`verify` 和 `render` 是生成项目自己的 npm 脚本，不是 DSH CLI 的内置命令。其他项目执行前，应先检查其 `package.json` 是否声明了对应脚本。

渲染通常需要 LibreOffice；逐页 PNG 还需要 Poppler，总览图需要 ImageMagick。这些工具没有安装时，PPTX 仍可以正常构建并在 Office 软件中手工检查。

不熟悉 TypeScript 时，可以让 DSH 修改：

```text
请继续使用 PPTKit 修改当前项目。

要求：
1. 保留已经确认的内容和页数；
2. 修改 deck-brief.md 和 src/deck-spec.ts，不要只修改 output/deck.pptx；
3. 将第 4 页标题改为“为什么正式材料不适合一次生成”；
4. 精简第 4 页列表，避免文字过密；
5. 修改后执行项目已有的 typecheck、build 和 verify；
6. 告诉我新生成 PPT 和构建报告的位置。
```

### 方式二：在 PowerPoint 中人工定稿

这种方式适合少量品牌、位置、换行或现场演示调整。

`output/deck.pptx` 是自动产物，再次执行 `npm run build` 时可能被覆盖。本文采用一个简单的文件管理约定：先复制为 `.final.pptx`，再进行人工修改。

```powershell
cd examples\01-dsh-skill
Copy-Item .\output\deck.pptx .\output\deck.final.pptx
Start-Process .\output\deck.final.pptx
```

适合在 `deck.final.pptx` 中完成：

- 调整个别文本框宽度、位置和换行；
- 替换公司字体、Logo 和品牌颜色；
- 调整图片裁切；
- 增加动画；
- 完成演讲现场需要的备注。

`.final.pptx` 是本文的实践约定，不是 PPTKit 强制规定。需要长期复用的修改仍应同步回 `deck-brief.md` 和 `src/deck-spec.ts`，否则下一次自动生成不会包含这些变化。

## 九、常见问题

### `dsh` 命令不存在

没有全局安装时，直接使用：

```powershell
npx @deepseek-ai/dsh web
```

或者安装全局 CLI 后重新打开 PowerShell：

```powershell
npm install -g @deepseek-ai/dsh
```

### `pnpm` 命令不存在

```powershell
npm install -g pnpm
```

安装后重新打开 PowerShell，再执行 `pnpm --version`。

### 插件安装成功，但会话中无法识别

停止旧的 DSH 进程并重新启动。还要确认：

- 安装和启动使用的是同一个 `web` profile；
- 使用的是同一个 Windows 用户；
- `DSH_HOME` 没有在两个终端中指向不同目录；
- Web UI 已选择正确 workspace。

### GitHub 安装提示依赖构建未批准

按照 pnpm 输出，把提示的 key 加入当前 profile 的 `pnpm-workspace.yaml` 中的 `allowBuilds`，然后重新安装。不要把关闭 workspace root 检查当成等价处理。

### 构建出现 `EBUSY`

这通常表示 `output/deck.pptx` 正被 PowerPoint、WPS、LibreOffice 或资源管理器预览占用。

先保存人工修改，必要时另存为 `deck.final.pptx`，然后关闭占用文件的程序，再重新执行构建。不要为了释放文件锁强制结束可能含有未保存内容的 Office 进程。

### `npm run render` 被跳过

通常是没有检测到 LibreOffice、Poppler 或 ImageMagick。先查看终端输出和 `output/build-report.json`。渲染失败不一定代表 PPTX 构建失败，仍可直接在 PowerPoint 中检查。

## 十、日常使用速查

首次启动：

```powershell
npx @deepseek-ai/dsh web
```

安装插件：

```powershell
npx -y @deepseek-ai/dsh plugin --profile web add dsh-plugin-pptkit-presentation
```

安装完成后重启 DSH，然后在 Web UI 中配置模型、选择 workspace，并输入：

```text
请使用 PPTKit，根据当前工作区中的材料制作一份可编辑 PPT。
先整理汇报目标和逐页大纲，等我确认后再生成 PPTX。
```

在生成项目中重新构建：

```powershell
npm run build
```

默认结果：

```text
output/deck.pptx
output/build-report.json
```

## 总结

这套流程的价值不只是“AI 能生成 PPT”，而是把一次对话产物变成一个可以继续维护的演示文稿工程：

```text
部署 DSH
   ↓
安装 PPTKit Presentation
   ↓
选择 workspace 并提供材料
   ↓
确认 brief 和逐页结构
   ↓
生成可编辑 PPTX 与构建报告
   ↓
修改中间文件后稳定重建
   ↓
PowerPoint 人工定稿
```

如果 PPT 只使用一次，直接生成可能更省时间；如果材料需要持续更新、多人交接或保留事实来源，PPTKit 的工程化中间层会更有价值。

## 参考资料

- [DeepSeek Harness 官方仓库](https://github.com/deepseek-ai/deepseek-harness)
- [DeepSeek Harness 官方中文 README](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.zh.md)
- [DeepSeek Harness Web UI 使用指南](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/index.md)
- [PPTKit Presentation 官方仓库](https://github.com/openHacking/pptkit-presentation)
- [PPTKit Presentation：DeepSeek Harness 专用指南](https://github.com/openHacking/pptkit-presentation/blob/main/docs/guides/dsh-harness.md)
- [PPTKit Presentation Skill 源文件](https://github.com/openHacking/pptkit-presentation/blob/main/skills/pptkit-presentation/SKILL.md)

# 后记

## 后续准备探索的插件与项目

PPTKit Presentation 只是 DSH 扩展生态中的一个方向。除了生成 PowerPoint，当前值得继续关注的项目还涉及设计、视觉理解、Web UI、插件管理、用量统计、上下文恢复和权限控制。

需要注意：下面的条目是后续探索清单，不代表本文已经完成安装验证。它们的分发形态也不完全相同，可能是 DSH 插件、原生 Skill、UI 扩展或可以配合 DSH 使用的独立项目。正式安装前，应进一步核对官方仓库、维护状态、安装方式、所需权限和输出格式。

| 插件或项目 | 类型 | 主要用途 |
| --- | --- | --- |
| PPTKit Presentation | PPT | 将文档或主题转换为原生可编辑的 PPTX，并保留 brief、页面规格、来源记录和构建报告 |
| dsh-np-ppt | PPT | 使用 PPTD DSL 描述页面，提供可视化编辑，并通过 Python-PPTX 导出 |
| content-to-editable-ppt-skill | PPT | 将主题、文档或大纲转换为可编辑 PPT |
| dsh-deck-builder | 幻灯片 | 将 Markdown 转换为 HTML Slides |
| dsh-frontend-slides | 幻灯片 | 生成带动画的 HTML Slides，并探索 PPT/PPTX 转网页 |
| open-design | 设计 | 生成或维护 PPT、网页、Dashboard、图片和视频等设计产物 |
| modlens | 视觉理解 | 为文本模型补充图片理解、OCR 和布局分析能力 |
| dsh-web-ui | UI 增强 | 提供任务板、Git Graph、侧栏和 Token 统计等界面能力 |
| dsh-market | 插件管理 | 在 DSH 内浏览和安装插件，降低插件发现与配置成本 |
| dsh-usage | 成本统计 | 统计 Token、缓存命中、峰谷费用和余额等使用信息 |
| dsh-undo | Agent 能力 | 提供会话上下文或操作的撤销与恢复能力 |
| dsh-permgate | 安全 | 控制 Agent 工具权限，为敏感操作增加权限门禁 |

## 我的探索顺序

后续准备按以下顺序进行验证：

1. **先比较 PPT 生成路线**：对比 PPTKit Presentation、dsh-np-ppt 和 content-to-editable-ppt-skill 的可编辑性、视觉效果、中间文件、重建能力和人工微调成本。
2. **再补充视觉与设计能力**：研究 modlens 是否能改善图片、OCR 和布局理解，再观察 open-design 能否承担跨 PPT、网页和 Dashboard 的统一设计工作流。
3. **完善日常使用体验**：验证 dsh-web-ui、dsh-market 和 dsh-usage，重点观察插件发现、任务管理和成本统计是否足够稳定。
4. **最后补齐 Agent 安全与恢复**：测试 dsh-undo 和 dsh-permgate，确认撤销边界、权限粒度以及高风险工具调用的控制方式。

评估这些项目时，我会重点记录：

- 是否能够直接安装到 DSH 的 `web` profile；
- 是否需要浏览器、Python、Node.js 或额外模型服务；
- 产物是否真正可编辑，还是以整页图片或 HTML 为主；
- 是否保留可重复构建的中间文件；
- 是否提供结构检查、视觉 QA 和错误恢复机制；
- 是否会读取敏感文件、执行命令或产生外部写入；
- 项目是否持续维护，文档和 Windows 支持是否完整。

这份清单会随着实际安装和使用结果继续更新。完成验证后，更有价值的不是简单判断“哪个插件最好”，而是明确每个工具适合的材料、输出形式、维护周期和风险边界。
