# 接入已有项目：迁移提示词

本入口用于把工作流接入已有项目，不是新手默认路径。替换尖括号内容后交给能读取两个目录并修改目标项目的 Agent。

```text
请把 `<PPT工作区目录>` 的 PPT 能力接入 `<现有项目目录>`。

开始前先读取：
- `<PPT工作区目录>/.agents/skills/setup-pptx-environment/SKILL.md`
- `<PPT工作区目录>/.agents/skills/build-ppt-from-source/SKILL.md`
- `<PPT工作区目录>/.agents/skills/convert-word-to-md/SKILL.md`
- `<PPT工作区目录>/.agents/skills/convert-excel-to-md/SKILL.md`

迁移规则：
1. 先检查目标项目的 AGENTS.md、.agents/skills、package.json 和锁文件，不直接覆盖。
2. 将四个 Skill 复制到目标项目的 `.agents/skills/`；同名目录存在时先比较并报告差异。
3. 合并 AGENTS.md 路由，不覆盖目标项目原有规则。
4. 沿用目标项目已有 pnpm 或 npm；不得同时保留 pnpm-lock.yaml 和 package-lock.json。
5. 只把固定版本的 pptxgenjs 加入现有 package.json，不用工作区 package.json 覆盖目标文件。
6. Node.js 24 LTS 为默认，Node.js 22 LTS 兼容；涉及安装、PATH、系统链接或管理员权限前先确认。
7. 需要 DOCX 或 XLSX 时检查 Python 3.10+、MarkItDown 和对应扩展；PDF 转换能力不随本工作区提供。
8. 不写入本机绝对路径，不安装 @oai/artifact-tool，不生成 PPTX 或 PNG。

完成后报告：
- 复制或合并的文件；
- 选择的包管理器和依赖变化；
- 尚需用户确认或手动完成的环境步骤；
- 如何调用迁移后的 build-ppt-from-source。
```
