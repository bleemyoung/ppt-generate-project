import path from "node:path";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pptxgen from "pptxgenjs";

// Copy this file to <workspace>/scripts/build.mjs, then replace the sample
// content with the approved storyboard. Keep paths relative to the workspace.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "output");

const META = {
  outputName: "presentation.generated.pptx",
  title: "演示标题",
  subject: "依据已确认 storyboard 生成",
  author: "",
  company: "",
};

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = META.author;
pptx.company = META.company;
pptx.subject = META.subject;
pptx.title = META.title;
pptx.lang = "zh-CN";
pptx.theme = {
  headFontFace: "Microsoft YaHei",
  bodyFontFace: "Microsoft YaHei",
  lang: "zh-CN",
};

const PAGE = { w: 13.333, h: 7.5 };
const FONT = { body: "Microsoft YaHei", mono: "Consolas" };
const C = {
  primary: "154B77",
  accent: "1D77B7",
  accentSoft: "EAF3F9",
  text: "243746",
  muted: "667785",
  line: "D7E1E8",
  surface: "F5F8FA",
  white: "FFFFFF",
};

function addText(slide, text, options = {}) {
  slide.addText(String(text ?? ""), {
    fontFace: FONT.body,
    fontSize: 16,
    color: C.text,
    margin: 0,
    breakLine: false,
    fit: "shrink",
    ...options,
  });
}

function addPageChrome(slide, title, pageNumber) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.42, y: 0.34, w: 0.08, h: 0.48,
    fill: { color: C.accent }, line: { color: C.accent },
  });
  addText(slide, title, {
    x: 0.64, y: 0.3, w: 10.8, h: 0.55,
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

function addCard(slide, { x, y, w, h, eyebrow, title, body, accent = C.accent }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.05,
    fill: { color: C.white }, line: { color: C.line, width: 1 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w: 0.08, h,
    fill: { color: accent }, line: { color: accent },
  });
  if (eyebrow) {
    addText(slide, eyebrow, {
      x: x + 0.28, y: y + 0.24, w: w - 0.5, h: 0.24,
      fontSize: 9.5, bold: true, color: accent,
    });
  }
  addText(slide, title, {
    x: x + 0.28, y: y + 0.55, w: w - 0.5, h: 0.42,
    fontSize: 16, bold: true, color: C.primary,
  });
  addText(slide, body, {
    x: x + 0.28, y: y + 1.08, w: w - 0.5, h: h - 1.3,
    fontSize: 12, color: C.muted, valign: "top", breakLine: true,
  });
}

function addSourceNotes(slide, speakerNotes, sources = []) {
  const sourceBlock = sources.length
    ? `\n\n[Sources]\n${sources.map((source) => `- ${source}`).join("\n")}`
    : "";
  slide.addNotes(`${speakerNotes}${sourceBlock}`);
}

function addCover() {
  const slide = pptx.addSlide();
  slide.background = { color: C.surface };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 4.45, h: PAGE.h,
    fill: { color: C.primary }, line: { color: C.primary },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 4.85, y: 1.4, w: 6.95, h: 0,
    line: { color: C.accent, width: 3 },
  });
  addText(slide, META.title, {
    x: 4.85, y: 1.75, w: 7.15, h: 1.25,
    fontSize: 28, bold: true, color: C.primary, valign: "middle",
  });
  addText(slide, "副标题应来自已确认的 storyboard", {
    x: 4.88, y: 3.18, w: 6.8, h: 0.5,
    fontSize: 15, color: C.muted,
  });
  addText(slide, "可编辑 · 可复现 · 有来源", {
    x: 0.55, y: 6.55, w: 3.25, h: 0.3,
    fontSize: 11, color: C.white, bold: true,
  });
  addSourceNotes(slide, "封面讲解说明。", ["intermediate/storyboard.md"]);
}

function addOverview() {
  const slide = pptx.addSlide();
  slide.background = { color: C.surface };
  addPageChrome(slide, "结论式页面标题", 2);
  const cards = [
    ["01", "第一项结论", "用一句话说明事实、判断和影响。"],
    ["02", "第二项结论", "同层级卡片保持相同宽高、字号和间距。"],
    ["03", "第三项结论", "详细证据进入讲者备注，不挤占正文。"],
  ];
  cards.forEach(([eyebrow, title, body], index) => {
    addCard(slide, {
      x: 0.55 + index * 4.18, y: 1.55, w: 3.82, h: 3.55,
      eyebrow, title, body,
    });
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.55, y: 5.45, w: 12.18, h: 0.8,
    fill: { color: C.accentSoft }, line: { color: C.accentSoft },
  });
  addText(slide, "页面底部只保留观众应带走的一条核心结论。", {
    x: 0.85, y: 5.66, w: 11.58, h: 0.35,
    fontSize: 14, bold: true, color: C.primary, align: "center",
  });
  addSourceNotes(slide, "逐项解释三条结论。", [
    "intermediate/lecture.md",
    "intermediate/storyboard.md",
  ]);
}

addCover();
addOverview();

await mkdir(OUT_DIR, { recursive: true });
await pptx.writeFile({ fileName: path.join(OUT_DIR, META.outputName) });
console.log(`Generated: ${path.join(OUT_DIR, META.outputName)}`);
