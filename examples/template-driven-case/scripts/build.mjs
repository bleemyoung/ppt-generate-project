import path from "node:path";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pptxgen from "pptxgenjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "output");
const OUT_FILE = path.join(OUT_DIR, "template-driven-case.generated.pptx");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Portable PPT Workspace";
pptx.company = "";
pptx.subject = "Synthetic implementation example";
pptx.title = "数据服务建设路径";
pptx.lang = "zh-CN";
pptx.theme = {
  headFontFace: "Microsoft YaHei",
  bodyFontFace: "Microsoft YaHei",
  lang: "zh-CN",
};

const FONT = "Microsoft YaHei";
const C = {
  primary: "154B77",
  accent: "1D77B7",
  accent2: "22A6A1",
  accentSoft: "EAF3F9",
  surface: "F5F8FA",
  white: "FFFFFF",
  text: "243746",
  muted: "667785",
  line: "D7E1E8",
};

function addText(slide, text, options = {}) {
  slide.addText(String(text ?? ""), {
    fontFace: FONT,
    fontSize: 14,
    color: C.text,
    margin: 0,
    fit: "shrink",
    ...options,
  });
}

function addHeader(slide, title, pageNumber) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.42, y: 0.34, w: 0.08, h: 0.48,
    fill: { color: C.accent }, line: { color: C.accent },
  });
  addText(slide, title, {
    x: 0.64, y: 0.3, w: 11, h: 0.55,
    fontSize: 22, bold: true, color: C.primary,
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 0.42, y: 0.98, w: 12.45, h: 0,
    line: { color: C.line, width: 1 },
  });
  addText(slide, String(pageNumber).padStart(2, "0"), {
    x: 12.14, y: 7.12, w: 0.65, h: 0.2,
    fontSize: 9, bold: true, color: C.accent, align: "right",
  });
}

function addCard(slide, { x, y, w, h, index, title, body, accent = C.accent }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.05,
    fill: { color: C.white }, line: { color: C.line, width: 1 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w: 0.08, h,
    fill: { color: accent }, line: { color: accent },
  });
  addText(slide, index, {
    x: x + 0.28, y: y + 0.25, w: 0.55, h: 0.25,
    fontSize: 10, bold: true, color: accent,
  });
  addText(slide, title, {
    x: x + 0.28, y: y + 0.66, w: w - 0.52, h: 0.42,
    fontSize: 16, bold: true, color: C.primary,
  });
  addText(slide, body, {
    x: x + 0.28, y: y + 1.2, w: w - 0.52, h: h - 1.42,
    fontSize: 12, color: C.muted, valign: "top", breakLine: true,
  });
}

function addNotes(slide, notes, sources) {
  slide.addNotes(`${notes}\n\n[Sources]\n${sources.map((source) => `- ${source}`).join("\n")}`);
}

function addCover() {
  const slide = pptx.addSlide();
  slide.background = { color: C.surface };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 4.45, h: 7.5,
    fill: { color: C.primary }, line: { color: C.primary },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 4.86, y: 1.48, w: 7, h: 0,
    line: { color: C.accent, width: 3 },
  });
  addText(slide, "数据服务建设路径", {
    x: 4.86, y: 1.8, w: 7.1, h: 1.1,
    fontSize: 30, bold: true, color: C.primary, valign: "middle",
  });
  addText(slide, "从业务需求到场景价值", {
    x: 4.9, y: 3.16, w: 6.7, h: 0.52,
    fontSize: 16, color: C.muted,
  });
  addText(slide, "合成案例 · 仅用于实现参考", {
    x: 4.9, y: 5.7, w: 6.7, h: 0.36,
    fontSize: 11, color: C.muted,
  });
  addText(slide, "可编辑 · 可复现 · 有来源", {
    x: 0.58, y: 6.55, w: 3.25, h: 0.32,
    fontSize: 11, bold: true, color: C.white,
  });
  addNotes(slide, "说明本案例只演示工作流和代码组织，不承载真实业务事实。", [
    "intermediate/lecture.md",
  ]);
}

function addOverview() {
  const slide = pptx.addSlide();
  slide.background = { color: C.surface };
  addHeader(slide, "需求、产品与交付构成一条连续价值链", 2);
  const cards = [
    ["01", "需求明确", "统一服务对象、数据口径与优先级，形成可确认的需求边界。"],
    ["02", "产品沉淀", "把共性能力沉淀为可复用、可组合、可运营的数据服务产品。"],
    ["03", "场景交付", "围绕具体场景组合产品，并持续评价交付质量和业务效果。"],
  ];
  cards.forEach(([index, title, body], i) => addCard(slide, {
    x: 0.55 + i * 4.18, y: 1.55, w: 3.82, h: 3.7,
    index, title, body, accent: i === 2 ? C.accent2 : C.accent,
  }));
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.55, y: 5.62, w: 12.18, h: 0.8,
    fill: { color: C.accentSoft }, line: { color: C.accentSoft },
  });
  addText(slide, "需求不是终点，只有产品化并进入场景才能形成价值。", {
    x: 0.85, y: 5.84, w: 11.58, h: 0.34,
    fontSize: 14, bold: true, color: C.primary, align: "center",
  });
  addNotes(slide, "依次解释三张卡片，强调三者不能割裂。", [
    "intermediate/lecture.md",
    "intermediate/storyboard.md",
  ]);
}

function addProcess() {
  const slide = pptx.addSlide();
  slide.background = { color: C.surface };
  addHeader(slide, "四步闭环把一次性交付转为持续运营", 3);
  const steps = [
    ["01", "需求澄清", "确认对象与口径"],
    ["02", "产品沉淀", "形成复用能力"],
    ["03", "交付运营", "组合进入场景"],
    ["04", "效果评价", "反馈持续优化"],
  ];

  // Connections are created first so nodes stay in the foreground.
  for (let i = 0; i < 3; i += 1) {
    slide.addShape(pptx.ShapeType.chevron, {
      x: 3.1 + i * 3.05, y: 2.87, w: 0.45, h: 0.65,
      fill: { color: C.line }, line: { color: C.line },
    });
  }
  steps.forEach(([index, title, body], i) => {
    const x = 0.55 + i * 3.05;
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 2.0, w: 2.55, h: 2.35,
      fill: { color: C.white }, line: { color: C.line, width: 1 },
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.87, y: 1.65, w: 0.8, h: 0.8,
      fill: { color: i === 3 ? C.accent2 : C.accent },
      line: { color: C.white, width: 2 },
    });
    addText(slide, index, {
      x: x + 0.87, y: 1.88, w: 0.8, h: 0.24,
      fontSize: 11, bold: true, color: C.white, align: "center",
    });
    addText(slide, title, {
      x: x + 0.25, y: 2.75, w: 2.05, h: 0.4,
      fontSize: 16, bold: true, color: C.primary, align: "center",
    });
    addText(slide, body, {
      x: x + 0.25, y: 3.35, w: 2.05, h: 0.4,
      fontSize: 12, color: C.muted, align: "center",
    });
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.48, y: 5.35, w: 10.36, h: 0.82,
    fill: { color: C.accentSoft }, line: { color: C.accentSoft },
  });
  addText(slide, "效果评价反向推动需求与产品持续优化，形成闭环。", {
    x: 1.8, y: 5.58, w: 9.72, h: 0.32,
    fontSize: 14, bold: true, color: C.primary, align: "center",
  });
  addNotes(slide, "按从左到右顺序讲解，最后说明反馈闭环。", [
    "intermediate/lecture.md",
    "intermediate/storyboard.md",
  ]);
}

function addMapping() {
  const slide = pptx.addSlide();
  slide.background = { color: C.surface };
  addHeader(slide, "以多对多映射管理产品复用与场景组合", 4);

  const columns = [
    { x: 0.55, w: 3.35, title: "业务需求", items: ["运营分析", "风险识别", "协同管理"] },
    { x: 4.99, w: 3.35, title: "数据产品", items: ["指标服务", "标签服务", "数据接口"] },
    { x: 9.43, w: 3.35, title: "应用场景", items: ["管理驾驶舱", "风险预警", "协同作业"] },
  ];

  // Relationship lines are deliberately behind the nodes.
  [2.08, 3.22, 4.36].forEach((y, i) => {
    slide.addShape(pptx.ShapeType.line, {
      x: 3.54, y: y + 0.38, w: 1.85, h: i === 1 ? 0 : 1.14 - i * 0.57,
      line: { color: "9CB7C9", width: 1.5, transparency: 15 },
    });
    slide.addShape(pptx.ShapeType.line, {
      x: 7.94, y: y + 0.38, w: 1.85, h: i === 1 ? 0 : i * -0.57,
      line: { color: "9CB7C9", width: 1.5, transparency: 15 },
    });
  });

  columns.forEach((column, columnIndex) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: column.x, y: 1.35, w: column.w, h: 0.55,
      fill: { color: columnIndex === 1 ? C.accent : C.primary },
      line: { color: columnIndex === 1 ? C.accent : C.primary },
    });
    addText(slide, column.title, {
      x: column.x + 0.15, y: 1.5, w: column.w - 0.3, h: 0.24,
      fontSize: 13, bold: true, color: C.white, align: "center",
    });
    column.items.forEach((item, itemIndex) => {
      const y = 2.08 + itemIndex * 1.14;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: column.x + 0.36, y, w: column.w - 0.72, h: 0.76,
        fill: { color: C.white },
        line: { color: columnIndex === 1 ? C.accent : C.line, width: 1 },
      });
      addText(slide, item, {
        x: column.x + 0.54, y: y + 0.24, w: column.w - 1.08, h: 0.28,
        fontSize: 13, bold: columnIndex === 1, color: C.primary, align: "center",
      });
    });
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.9, y: 5.76, w: 11.53, h: 0.64,
    fill: { color: C.accentSoft }, line: { color: C.accentSoft },
  });
  addText(slide, "映射关系必须记录来源、责任和评价口径，不把关联等同于量化效果。", {
    x: 1.15, y: 5.94, w: 11.03, h: 0.28,
    fontSize: 13, bold: true, color: C.primary, align: "center",
  });
  addNotes(slide, "强调连线表达支撑关系，不代表量化效果或唯一归属。", [
    "intermediate/lecture.md",
    "intermediate/storyboard.md",
  ]);
}

addCover();
addOverview();
addProcess();
addMapping();

await mkdir(OUT_DIR, { recursive: true });
await pptx.writeFile({ fileName: OUT_FILE });
console.log(`Generated: ${OUT_FILE}`);
