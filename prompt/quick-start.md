# 非开发同事快速开始

## 使用前

1. 将整个项目目录交给同事，不携带 `node_modules/` 和 `.venv/`。
2. 在 DSH 中把项目根目录作为工作区打开。
3. 将材料和参考 PPT/PPTX 放入 `input/`。

## 直接使用

向 Agent 发送：

```text
请读取并严格执行 prompt/colleague-ppt-workflow.md。
```

提示词会自动扫描 `input/`、检查环境，并按 Brief、lecture、storyboard、build、execute 和人工视觉验收的确认门推进。无需修改提示词，也无需手动注册 Skill。

如果材料位于其他位置，可以补充：

```text
请读取并严格执行 prompt/colleague-ppt-workflow.md。
本次还需要读取：<文件或目录路径>
```

## 常用回复

```text
同意
```

或者：

```text
1、2、3同意；4改为管理层汇报；5控制在10页以内。
```
