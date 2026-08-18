---
name: setup-pptx-environment
description: 为没有技术背景的用户检查、解释并准备可移植 PPT 工作区所需环境，包括 Node.js、pnpm/npm、PptxGenJS，以及 DOCX 输入需要的 Python 与 MarkItDown。适用于首次部署、换电脑、命令不可用、依赖缺失、锁文件冲突或 build.mjs 无法加载依赖。默认先只读检查；下载程序、安装依赖、创建或修改项目文件、修改 PATH、创建系统链接或申请管理员权限前必须说明影响并取得确认。
---

# 准备 PPT 工作区环境

把当前工作区准备到“可以转换 DOCX、检查构建脚本并运行 PptxGenJS”的状态。只处理环境，不生成业务 PPTX，不运行视觉 QA。

## 环境基线

- 默认：Node.js 24 LTS、pnpm 11.22.0。
- 兼容：Node.js 22 LTS、pnpm 11。
- 备选：既有项目使用 npm、pnpm 不可用或用户明确选择 npm 时使用 npm。
- PptxGenJS：按工作区 `package.json` 固定版本安装。
- DOCX：Python 3.10+、`markitdown[docx]` 按转换 Skill 的 requirements 固定版本安装。
- Node.js 20 及更早版本不作为新部署环境。

## 安全边界

- 默认先只读检查，不因用户说“帮我部署”就静默修改系统。
- 下载程序、安装版本管理器、修改 PATH、创建系统链接、申请管理员权限或执行其他系统级变更前，说明影响并取得确认。
- 安装项目依赖、创建或修改 `package.json`、生成锁文件、创建 Python 虚拟环境前，列出将修改的文件并取得确认。
- 可以辅助安装 nvm/nvm-windows、Node.js、pnpm 和 Python；受公司终端策略阻止时转为人工安装，用户确认完成后恢复检查。
- 不写死 Node.js、Python、pnpm 或项目的本机绝对路径。当前会话发现的路径只用于本次命令，不写入长期文件。
- 每个工作区只使用 pnpm 或 npm 中的一种，只保留对应锁文件，不擅自删除冲突锁文件。
- PptxGenJS 只作为项目依赖安装，不做全局安装。
- 不安装 `@oai/artifact-tool`、PDF/Excel 转换器或图片工具。
- 不生成 PPTX、PDF、PNG、`qa-render` 或环境报告文件；结果直接在对话中汇报。

## 第一步：只读检查

把包含 `package.json`、`AGENTS.md` 和 `.agents/` 的目录识别为工作区根目录，然后检查：

1. 操作系统与 shell；Windows 是主要验收平台。
2. `node --version` 是否可用及实际版本。
3. 是否已存在 nvm、nvm-windows、fnm、Volta 等版本管理器。
4. `pnpm --version`、`npm --version` 是否可用。
5. `package.json`、`pnpm-lock.yaml`、`package-lock.json` 是否存在及是否冲突。
6. 本地 `pptxgenjs` 是否声明并可解析。
7. `python --version`、`python -m pip --version` 是否可用。
8. `markitdown` 是否可加载；完整工作区验收默认包含 DOCX 能力。
9. `scripts/build.mjs` 是否存在；此时不要执行它。

不要向新手询问 Node/Python 路径、全局模块目录或 ESM/CommonJS 参数。事实由 Agent 检查，只有方案选择和有风险的变更交给用户。

## 第二步：判定状态

| 状态 | 含义 | 下一步 |
| --- | --- | --- |
| 完全就绪 | Node、包管理器、PptxGenJS、Python、MarkItDown 均通过 | 执行最小验证 |
| PPT 就绪、DOCX 未就绪 | PptxGenJS 可用，但 Python/MarkItDown 缺失 | 说明 Markdown 可用，建议补齐 DOCX 环境 |
| 缺少 Node.js | 无法运行 PptxGenJS | 提供辅助安装选项并确认 |
| 缺少 pnpm | Node 可用但默认包管理器缺失 | 建议安装 pnpm 11.22.0，允许选择 npm |
| 缺少项目依赖 | 包管理器可用但 PptxGenJS 缺失 | 确认后按清单安装 |
| 锁文件冲突 | 两种锁文件同时存在 | 停止修改，请用户决定保留哪一种 |
| 依赖损坏 | 已声明但无法解析 | 确认后按选定锁文件恢复安装 |

## 第三步：辅助安装 Node.js

Node.js 缺失或不在支持范围时：

1. 已有版本管理器：推荐使用它安装 Node.js 24 LTS，并在执行前说明将下载运行时和切换当前 shell。
2. Windows 原生环境没有版本管理器：提供 nvm-windows 或 Node.js 官方安装器选项；下载、安装、PATH 或系统链接变更前确认。
3. macOS/Linux/WSL：提供 nvm 或官方支持的版本管理器选项；修改 shell 配置前确认。
4. 企业策略阻止自动安装：给出人工步骤并停止；用户回复“已安装”后重新执行只读检查。

不要把 `nvm-sh` 当作 Windows 原生 nvm。不要自动卸载已有 Node.js，也不要在未确认时切换用户的默认版本。

## 第四步：选择并准备包管理器

选择顺序：

1. 有 `pnpm-lock.yaml`：使用 pnpm。
2. 有 `package-lock.json`：使用 npm。
3. 两种锁文件都有：停止并请求选择，不删除文件。
4. 无锁文件：默认 pnpm；用户明确选择 npm 时使用 npm。

默认 pnpm 不可用时，优先检查 Corepack。启用 Corepack 会创建或覆盖包管理器代理，必须先确认。也可经确认使用 npm 安装固定 pnpm 版本。不得循环切换安装方式绕过错误。

变更前使用：

```text
当前缺少：<问题>
建议方案：<方案>
将修改：<系统设置、package.json、锁文件、node_modules、Python 环境等>
影响：<是否联网、是否需要权限、是否会新增或覆盖文件>

确认后我再执行；也可以只输出命令，由你手动运行。
```

## 第五步：安装项目依赖

沿用已选包管理器，只执行一组命令：

```powershell
# 默认 pnpm
pnpm install

# npm 备选
npm install
```

工作区已预置 `package.json`，不要重复执行 `pnpm init` 或 `npm init`。首次安装只生成所选包管理器的锁文件。网络或权限失败时保留原始错误摘要并停止，不擅自换包管理器。

## 第六步：准备 DOCX 转换环境

读取 `.agents/skills/convert-word-to-md/references/setup.md`。默认优先使用项目内 Python 虚拟环境，创建和安装前仍需确认：

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r .\.agents\skills\convert-word-to-md\scripts\requirements.txt
```

上例为 Windows；macOS/Linux 使用 `./.venv/bin/python`。无需依赖 shell 激活状态，也不得写入绝对路径。若用户只处理 Markdown，可以接受“PPT 就绪、DOCX 未就绪”，但必须明确 DOCX 暂不可用。

## 第七步：最小验证

安装后验证：

1. Node.js 是 24 LTS 或 22 LTS。
2. 实际包管理器版本符合选择；默认 pnpm 应为 11.x。
3. 本地 `pptxgenjs` 版本与 `package.json` 一致并可加载。
4. DOCX 能力启用时，Python 为 3.10+，`MarkItDown` 可加载。
5. 已有 `scripts/build.mjs` 时运行 `node --check .\scripts\build.mjs`，但不执行构建。
6. 没有生成 PPTX、PNG 或 QA 目录。

若 ESM 导入失败但 CommonJS 加载成功，说明兼容性边界，并建议构建脚本使用：

```js
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");
```

## 结果汇报

结束时用简短状态表说明：

- Node.js：版本或未安装；
- 包管理器：pnpm/npm、版本及锁文件；
- PptxGenJS：版本或未安装；
- DOCX：Python/MarkItDown 已就绪或暂不可用；
- 修改文件：没有则写“无”；
- 验证结果：完全就绪、部分就绪、需要用户操作或阻塞；
- 下一步：返回 `$build-ppt-from-source` 暂停的阶段；无法注册调用时读取其相对路径。

不要把命令输出中的用户名、磁盘目录或机器信息复制到长期文档。
