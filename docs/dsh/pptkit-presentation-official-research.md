# DeepSeek Harness × PPTKit Presentation 官方资料核对

> 核对日期：2026-08-19  
> 范围：仅使用 DeepSeek Harness 官方仓库，以及 `openHacking/pptkit-presentation` 官方仓库。本文是博客改写的事实底稿，不是安装脚本。

## 结论速览

- DeepSeek Harness 当前仍标注为 **Developer preview**，官方明确警告后续会有破坏兼容性的变更，因此博客中的命令应注明核对日期，不宜写成长期稳定接口。[DeepSeek Harness README（中文）](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.zh.md)
- DeepSeek 官方给出的最低门槛启动方式是先安装 Node.js，再运行 `npx @deepseek-ai/dsh web`；Web UI 默认地址为 `http://127.0.0.1:3080`。[DeepSeek Harness README](https://github.com/deepseek-ai/deepseek-harness#run)
- PPTKit 官方支持 DSH，推荐将 `dsh-plugin-pptkit-presentation` 安装到 DSH profile；插件注册的是 `pptkit-presentation` Skill。[PPTKit Presentation README：DeepSeek Harness](https://github.com/openHacking/pptkit-presentation#deepseek-harness)
- DSH 本身没有 PPTKit 所需的内置浏览器工具，所以该 Skill 在 DSH 中会走 Node 工作流，不会提供 PPTKit 的浏览器预览流程；完成后会把 PPTX、构建报告和中间文件作为聊天附件交付。[PPTKit DSH 指南](https://github.com/openHacking/pptkit-presentation/blob/main/docs/guides/dsh-harness.md)

## 1. DeepSeek Harness 的部署与首次使用

### 官方首选：通过 npx 直接启动

```powershell
npx @deepseek-ai/dsh web
```

该命令启动 Web UI，默认监听：

```text
http://127.0.0.1:3080
```

来源：[DeepSeek Harness 官方 README](https://github.com/deepseek-ai/deepseek-harness#run)

### 可选：全局安装 CLI

PPTKit 的 DSH 官方指南给出了全局安装方式：

```powershell
npm install -g @deepseek-ai/dsh
```

之后可以直接使用 `dsh ...`。如果不全局安装，则把下文的 `dsh` 命令替换成：

```powershell
npx -y @deepseek-ai/dsh
```

来源：[PPTKit DSH 官方指南：Prerequisite](https://github.com/openHacking/pptkit-presentation/blob/main/docs/guides/dsh-harness.md#prerequisite-the-dsh-cli)

### Web UI 中还要完成的配置

1. 打开 `Settings → Models`，填写 DeepSeek API key 并保存；模型配置保存后可立即使用，无需重启。
2. 点击 `Choose workspace`，添加并选中工作目录；未选择 workspace 时无法开始会话。
3. DSH 进程的启动目录只是默认文件系统位置，不等于 Web UI 已自动选中该目录。

来源：[DeepSeek Harness 官方 Web UI 指南](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/index.md)

补充：`dsh web` 是 `dsh --profile web` 的别名；`web` 与 `headless` profile 会在首次使用时由内置模板自动初始化，其他自定义 profile 需要通过 `dsh plugin` 创建。[DeepSeek Harness CLI README](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/README.md)

## 2. 安装 PPTKit Presentation 插件

### 前置条件

`dsh plugin` 会在 `$DSH_HOME/profiles/<profile>` 中调用 `pnpm`；`$DSH_HOME` 默认是 `~/.dsh`。因此 `pnpm` 必须在 `PATH` 中。PPTKit 仓库自身的开发环境要求 Node.js 20+ 和 pnpm 10.13.1，但这是其仓库开发要求；终端用户安装 DSH bundle 的官方表述仅要求 `dsh` 与 `pnpm` 可用。[PPTKit README](https://github.com/openHacking/pptkit-presentation#development)

### 推荐：从 npm 安装已发布 bundle

全局 CLI：

```powershell
dsh plugin --profile web add dsh-plugin-pptkit-presentation
```

npx 方式：

```powershell
npx -y @deepseek-ai/dsh plugin --profile web add dsh-plugin-pptkit-presentation
```

安装完成后必须停止并重新启动 DSH；运行中的 DSH 不会热加载新 profile bundle。

来源：[PPTKit Presentation README](https://github.com/openHacking/pptkit-presentation#deepseek-harness)、[PPTKit DSH 指南](https://github.com/openHacking/pptkit-presentation/blob/main/docs/guides/dsh-harness.md#bundle-recommended)

### 从 GitHub 安装

```powershell
dsh plugin --profile web add "openHacking/pptkit-presentation#path:/packages/dsh-plugin-pptkit-presentation"
```

这条命令需要允许依赖的 prepare/build 脚本。官方说明是：根据 pnpm 输出，把它提示的 key 加入该 profile 的 `pnpm-workspace.yaml` 中的 `allowBuilds`，然后重新执行安装。不能把“关闭 workspace root 检查”当作这一安全审批的等价替代。

来源：[PPTKit Presentation README](https://github.com/openHacking/pptkit-presentation#deepseek-harness)

### 本地仓库安装（开发/调试）

在 `pptkit-presentation` 仓库中先构建 bundle：

```powershell
pnpm --filter dsh-plugin-pptkit-presentation build
dsh plugin --profile web add "file:$PWD/packages/dsh-plugin-pptkit-presentation"
```

PowerShell 中 `$PWD` 通常可用，但传给工具的 `file:` URL 在不同 shell/版本下可能需要改成解析后的绝对路径。此方式适合调试未发布改动，不是普通用户的首选。

来源：[PPTKit DSH 官方指南](https://github.com/openHacking/pptkit-presentation/blob/main/docs/guides/dsh-harness.md#bundle-recommended)

注意：官方文档中的 `command -v dsh`、`$PWD` 和 `DSH_HOME=$(mktemp -d)` 是 POSIX shell 写法。面向 Windows 的博客若给出 PowerShell 等价命令，应标明是平台改写，不应原样混用。

### 不安装插件 bundle 的 fallback

克隆 PPTKit Presentation 仓库后，可把 Skill 复制到 DSH 原生 Skill 目录：

```powershell
node scripts/install-dsh.mjs
node scripts/install-dsh.mjs --project
```

- 第一条安装到 `$DSH_HOME/skills/pptkit-presentation`，默认即 `~/.dsh/skills/pptkit-presentation`。
- 第二条安装到当前项目的 `./.dsh/skills/pptkit-presentation`。

来源：[PPTKit DSH 官方指南：Native copy](https://github.com/openHacking/pptkit-presentation/blob/main/docs/guides/dsh-harness.md#native-copy-zero-plugin-fallback)

## 3. 启动、验证与调用

插件安装后重新启动：

```powershell
npx @deepseek-ai/dsh web
```

或在已经全局安装 CLI 时：

```powershell
dsh web
```

进入 Web UI、配置模型并选择 workspace 后，可直接提出任务，例如：

```text
请使用 PPTKit，把当前工作区中的季度报告制作成一份面向管理层的、可编辑的 10 页 PPT。
请先给出主题方向和逐页大纲，等我确认后再生成 PPTX。
```

PPTKit 的正式工作流会先整理缺失决策、展示主题方向、生成逐页大纲，并要求明确的“批准并生成”确认；只有用户明确要求导出时才生成 PPTX。[PPTKit Skill 源文件](https://github.com/openHacking/pptkit-presentation/blob/main/skills/pptkit-presentation/SKILL.md)

## 4. DSH 中的实际产出与文件位置

PPTKit 在 DSH 中会初始化一个隔离的 Node 项目，并依次：

1. 执行 `npm run extract` 提取来源；
2. 编写 `deck-brief.md` 与 `src/deck-spec.ts`；
3. 执行 `npm run build` 生成 `output/deck.pptx`；
4. 将下列文件作为聊天附件交付。

```text
output/deck.pptx
output/build-report.json
runtime-decision.json
deck-brief.md
src/deck-spec.ts
content/sources.json
content/assets.json
```

因此，通用博客不应声称所有任务都固定产出到某个仓库目录。准确说法应是：**项目内部的默认相对路径是 `output/deck.pptx`，实际绝对路径取决于本次 DSH 创建/使用的项目目录，同时 DSH 会把关键产物作为聊天附件返回。**

来源：[PPTKit DSH 官方指南：Use](https://github.com/openHacking/pptkit-presentation/blob/main/docs/guides/dsh-harness.md#use)

## 5. 修改、重建与质量检查

官方 DSH 指南确认的 Node 工作流事实是：

- `deck-brief.md`：经过确认的汇报 brief 与逐页计划；
- `src/deck-spec.ts`：实际用于生成 PPT 的结构化 deck spec；
- `content/sources.json`、`content/assets.json`：提取后的来源与资产记录；
- `npm run extract`：重新提取来源；
- `npm run build`：重新生成 `output/deck.pptx`；
- `output/build-report.json`：构建与质量检查结果。

示例工程中存在的 `npm run typecheck`、`npm run verify`、`npm run render` 是该生成项目声明的脚本，可作为本地复现与检查命令；它们并不是 DSH CLI 的通用内置命令。博客应明确读者需要先进入包含对应 `package.json` 的 PPTKit 生成项目，再执行这些命令。

PPTKit 官方还明确说明：DSH 路径没有浏览器预览，生成结果与报告会作为附件提供；SVG/browser 预览本来也不是与 PowerPoint 像素完全一致的渲染器。因此最终版仍应在 PowerPoint 或兼容 Office 软件中打开检查。[PPTKit README](https://github.com/openHacking/pptkit-presentation#how-it-works)

## 6. 现有博客中需要降级或改写的说法

| 现有说法/命令 | 核对结果 | 建议 |
| --- | --- | --- |
| `npx @deepseek-ai/dsh web` | 官方明确支持 | 保留，作为首选快速启动方式。 |
| `npm install -g @deepseek-ai/dsh` | PPTKit 官方 DSH 指南明确支持；DeepSeek 根 README 当前主推 npx | 可保留为可选长期安装，不应写成唯一官方方式。 |
| `dsh plugin --profile web add dsh-plugin-pptkit-presentation` | PPTKit 官方明确支持 | 保留为推荐 bundle 安装命令。 |
| GitHub `#path:/packages/dsh-plugin-pptkit-presentation` 安装 | PPTKit 官方明确支持 | 保留，但补充 `allowBuilds`/prepare build 审批说明。 |
| 在 `~/.dsh/profiles/web/.npmrc` 写入 `ignore-workspace-root-check=true` | PPTKit 与 DeepSeek 官方资料均未把它列为安装步骤 | 从标准流程移除；若作为特定旧版本故障记录，必须标明版本、原始错误和验证环境，且不能替代 `allowBuilds`。 |
| “插件安装后重启 DSH” | PPTKit 官方明确要求 | 保留。 |
| “DSH 中可以浏览器预览 PPTKit 页面” | 与官方 DSH 指南冲突 | 改为 DSH 自动走 Node 工作流，交付 PPTX 与报告附件。 |
| “所有产物都在 `examples/01-dsh-skill`” | 仅对本仓库配套示例成立 | 明确标为博客配套案例；通用任务以聊天附件和本次项目实际路径为准。 |
| `dsh --version`、`pnpm -v` | 合理的本地诊断命令，但本次查阅的官方安装段落未明确列出 | 可保留为“检查命令”，不要把输出成功当作插件已加载的充分证明。 |
| 全局 CLI 与 npx 一定共用同一 profile | 官方确认 `$DSH_HOME` 默认 `~/.dsh`，但环境变量可改变它 | 改成“在相同用户、相同 `DSH_HOME` 和相同 profile 名称下通常共用”。 |
| PowerPoint 人工另存 `deck.final.pptx` | 是合理的本地文件管理约定，不是 PPTKit 官方规定 | 可作为博客实践建议，明确其为作者约定。 |
| “Node.js 20+、pnpm 10.13.1 是 DSH 源码要求” | 不准确；这是 PPTKit 仓库开发要求 | DSH 源码贡献环境当前要求 Node 22.19+ 或 24+，并固定 pnpm 11.7.0；发布版 DSH README 仅要求先安装 Node.js。分别注明适用对象。 |

## 7. 博客建议引用的第一方入口

- [DeepSeek Harness 官方仓库](https://github.com/deepseek-ai/deepseek-harness)
- [DeepSeek Harness 官方中文 README](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.zh.md)
- [DeepSeek Harness 官方 Web UI 指南](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/index.md)
- [DeepSeek Harness 官方 CLI README](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/README.md)
- [DeepSeek Harness 源码开发环境](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/development.md)
- [PPTKit Presentation 官方仓库](https://github.com/openHacking/pptkit-presentation)
- [PPTKit Presentation 的 DSH 专用指南](https://github.com/openHacking/pptkit-presentation/blob/main/docs/guides/dsh-harness.md)
- [PPTKit Presentation Skill 源文件](https://github.com/openHacking/pptkit-presentation/blob/main/skills/pptkit-presentation/SKILL.md)
