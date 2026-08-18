# 快速开始

## 使用前

1. 将整个 `modal/` 目录交给同事。
2. 在 Agent 客户端中把 `modal/` 本身作为工作区打开。
3. 将材料放入 `input/`，或直接提供材料路径。

## 普通用户提示词

只替换材料位置：

```text
请先阅读当前工作区的 AGENTS.md，并按照其中的 PPT 工作流处理。

材料：<文件或目录>

我没有技术背景，请用通俗语言引导我完成必要确认。
```

Agent 会自行检查环境、询问 PPT 目的与受众、依次确认 `lecture.md` 和 `storyboard.md`，最后默认生成并执行构建脚本。

## Agent 未自动读取工作区规则时

使用以下提示词：

```text
请先读取并严格执行：
./.agents/skills/build-ppt-from-source/SKILL.md

如果环境未就绪，请按该 Skill 的路由读取：
./.agents/skills/setup-pptx-environment/SKILL.md

材料：<文件或目录>
我没有技术背景，请用通俗语言引导我完成必要确认。
```

无需手动注册 `$skill-name`。支持项目级 Skill 自动发现的客户端也可以直接调用 `$build-ppt-from-source`。
