# 可移植 AI 辅助 PPT 工作区

把本目录作为独立工作区交给具备文件读写和命令执行能力的 Agent，即可从 Markdown 或 DOCX 分阶段生成可编辑 PPTX。普通用户只需提供材料路径，其余流程封装在项目级 Skill 中。

## 目录

```text
modal/
├── AGENTS.md
├── CONTEXT.md
├── README.md
├── package.json
├── .nvmrc
├── .gitignore
├── input/                       # 原始材料
├── intermediate/                # 中间产出：lecture.md、storyboard.md
├── prompt/                      # 提示词入口
│   ├── quick-start.md
│   ├── prompt-template.md
│   └── migration-prompt.md
├── output/                      # PPTX 输出
├── scripts/                     # 构建脚本
└── .agents/
    └── skills/
        ├── setup-pptx-environment/
        ├── build-ppt-from-source/
        ├── convert-word-to-md/
        └── grilling/
```

## 新手入口

完全不懂代码的新手：先读 `新手手册.md`，按其中 8 个步骤操作，无需理解目录、命令或阶段名。

## 提示词映射

| 文件 | 用途 | 适用场景 |
| --- | --- | --- |
| `prompt/quick-start.md` | 普通用户快速开始 | 第一次使用、没有技术背景 |
| `prompt/prompt-template.md` | 高级调用模板（指定阶段、输出名称、额外约束） | 需要控制流程或复用参数 |
| `prompt/migration-prompt.md` | 把工作流接入已有项目 | 迁移模式，非默认路径 |

## 最短使用方式

1. 把 `modal/` 作为 Agent 工作区打开。
2. 将材料放入 `input/`，或保留在原位置。
3. 复制 `prompt/quick-start.md` 的普通用户提示词。
4. Agent 检查环境；有系统或项目变更时先请求确认。
5. 依次确认 Brief、`intermediate/lecture.md` 和 `intermediate/storyboard.md`。
6. storyboard 确认后，Agent 默认生成并执行 `scripts/build.mjs`。
7. PPTX 输出到 `output/`；默认不生成 PNG。

客户端不支持 Skill 注册时，Agent 直接读取 `.agents/skills/*/SKILL.md`，无需用户手动安装到个人目录。

需求边界需要逐项拷问时，可要求 Agent 读取 `.agents/skills/grilling/SKILL.md` 执行边界确认。

## 环境基线

- 默认 Node.js 24 LTS，兼容 Node.js 22 LTS。
- 默认 pnpm 11.22.0；既有 npm 项目或用户明确选择时可使用 npm。
- PptxGenJS 固定为 4.0.1。
- DOCX 转换需要 Python 3.10+ 和固定版本的 MarkItDown。
- 工作区首次交付不包含锁文件；首次安装只生成所选包管理器的一种锁文件。
- `node_modules/` 和 `.venv/` 不随工作区交付。

环境 Skill 可以辅助安装版本管理器、Node.js、pnpm 和 Python，但下载程序、修改 PATH、创建系统链接、安装依赖或申请管理员权限前必须取得用户确认。

## 输入范围

- Markdown：直接支持。
- DOCX：通过随工作区携带的 `convert-word-to-md` 转换。
- `.doc`：先另存为 `.docx`。
- PDF、Excel：首版未携带对应转换 Skill，必须报告能力缺失，不能静默跳过。

## 文件职责

```text
原始材料
→ intermediate/lecture.md      内容事实契约
→ intermediate/storyboard.md   页面与版式契约
→ scripts/build.mjs            可重复实现
→ output/*.generated.pptx
```

`.generated.pptx` 是自动生成文件，可以被脚本覆盖。需要长期保留的人工修改应另存为 `.final.pptx`，并同步回 storyboard 与脚本。

目标 PPTX 被 PowerPoint、WPS、LibreOffice 或资源管理器预览占用时，Agent 必须停止重试，提示用户保存并手动关闭文件，并说明重新执行会覆盖 `.generated.pptx`；不得结束可能含未保存内容的 Office 进程。

## 两种交付模式

- 默认：直接交付完整 `modal/`，作为可移植 PPT 工作区。
- 备用：使用 `prompt/migration-prompt.md`，由 Agent 把能力接入已有项目。

## QA 边界

环境准备和默认 PPT 构建都不渲染页面、不创建 `slide-*.png` 或 `qa-render/`。只有用户明确要求视觉检查时才执行独立 QA。
