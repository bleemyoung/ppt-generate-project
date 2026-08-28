# PptxGenJS 构建约定

在首次创建或大幅重写 `scripts/build.mjs` 时读取本文，并以
`../assets/build-starter.mjs` 为起点。本文只约束当前工作区中容易产生
兼容性、可维护性或版式偏差的实现选择。

## 开始条件

开始写脚本前必须具备已确认的 `intermediate/storyboard.md`。脚本只实现
storyboard 已确认的页数、顺序、可见文案、版式和来源；示例文件不是业务
事实来源。

## 文件与运行时

- 将 starter 复制为 `<workspace>/scripts/build.mjs` 后再修改。
- 从 `import.meta.url` 推导脚本目录和工作区根目录。
- 自动产物只写入 `output/*.generated.pptx`。
- 只在执行构建时创建 `output/`。
- 正常使用 ESM 导入；只有实际加载失败时才切换 `createRequire`。
- 使用 `pptx.writeFile({ fileName })`，不要依赖当前 shell 工作目录拼接输出。

## 画布与样式

- 16:9 使用 `LAYOUT_WIDE`；需要其他比例时在 storyboard 的全局契约中明确。
- 颜色、字体、字号层级、页面尺寸和间距统一定义为顶层 token。
- 页眉、页脚、卡片、流程节点、表格等重复结构封装为函数。
- 同层级对象由同一个 helper 和同一组参数生成；局部例外通过显式参数表达。
- 连接线先添加，节点后添加，使节点位于连接线前景。
- 文本默认设置明确的 `fontFace`、`fontSize`、`margin`、`valign` 和边界框。
- `fit: "shrink"` 只用于小幅字体渲染差异兜底；正文过长时先精简或拆页。

## 页面组织

推荐把内容数据与绘制函数分开：

```js
const pages = [
  { type: "overview", title: "...", cards: [...] },
  { type: "process", title: "...", steps: [...] },
];

pages.forEach((page, index) => renderPage(page, index + 1));
```

当页面差异很大时，使用独立的 `addXxxSlide()`，不要为了追求统一而创建包含
大量条件分支的万能渲染函数。

## 来源与备注

每页调用 `slide.addNotes()`，讲解内容与来源采用以下结构：

```text
本页讲解补充。

[Sources]
- intermediate/lecture.md
- intermediate/storyboard.md
- input/<source-file>
```

来源路径使用工作区相对路径。内部路径和文件名不要显示在幻灯片正文中。

## 构建完成条件

1. `node --check .\scripts\build.mjs` 通过。
2. 执行脚本后 `.generated.pptx` 存在且非空。
3. PPTX 包中的 slide XML 数量与 storyboard 页数一致。
4. 页面顺序、可见文案和备注来源逐页覆盖 storyboard。
5. 没有把示例文案、占位标题或示例来源带入正式输出。

