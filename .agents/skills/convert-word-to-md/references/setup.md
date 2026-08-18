# DOCX 转换环境

本能力需要 Python 3.10+ 和固定版本的 `markitdown[docx]`。默认先只读检查；创建虚拟环境或安装依赖前，向用户说明将新增 `.venv/` 并需要联网，取得确认后再执行。

## 1. 检查 Python

```powershell
python --version
python -m pip --version
```

Python 缺失或低于 3.10 时，交由 `$setup-pptx-environment` 提供辅助安装选项。不要静默安装或修改 PATH。

## 2. 创建项目虚拟环境

```powershell
python -m venv .venv
```

## 3. 使用虚拟环境安装固定依赖

Windows：

```powershell
.\.venv\Scripts\python.exe -m pip install -r .\.agents\skills\convert-word-to-md\scripts\requirements.txt
```

macOS/Linux：

```bash
./.venv/bin/python -m pip install -r ./.agents/skills/convert-word-to-md/scripts/requirements.txt
```

## 4. 验证

Windows：

```powershell
.\.venv\Scripts\python.exe -c "from markitdown import MarkItDown; print('markitdown OK')"
```

macOS/Linux：

```bash
./.venv/bin/python -c "from markitdown import MarkItDown; print('markitdown OK')"
```

只验证模块加载，不转换文档、不生成测试文件。转换时继续使用同一虚拟环境中的 Python。
