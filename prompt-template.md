# 高级调用模板

通常直接使用 `quick-start.md`。只有需要指定阶段、输出名称或额外约束时才使用本模板。

```text
请读取并严格执行当前工作区的：
./.agents/skills/build-ppt-from-source/SKILL.md

材料：<文件或目录>
输出名称：<可选；不填写时由 Agent 根据主题命名>
当前阶段：<可选；brief | environment | lecture | storyboard | build | execute | qa>
额外约束：<可选>

未填写的内容采用 Skill 默认规则。不要要求我重复提供 Skill 已经封装的流程、路径、环境或 QA 参数。
```

环境准备可单独调用：

```text
请读取并严格执行：
./.agents/skills/setup-pptx-environment/SKILL.md

请先只读检查；下载、安装、修改项目文件或系统环境前向我说明影响并取得确认。
```
