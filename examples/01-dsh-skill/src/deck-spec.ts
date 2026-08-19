import type { DeckSpec } from "./contracts.js";

export const deckSpec: DeckSpec = {
  design: {
    theme: { id: "swiss-grid" },
    seed: "sui-shen-xing-ppt-practice",
    variation: "balanced",
  },
  brief: {
    title: "随身行分析报告 · 可编辑 PPT 实践复盘",
    audience: "内部同事（会制作或维护 PPT 的团队）",
    purpose:
      "复盘一次真实的 AI 辅助 PPT 实践，说明从“一次生成”转向“分阶段可复现”的原因、产出链路、中间层、职责分工、问题修正与取舍结论。",
    language: "zh-CN",
    slideCountRange: [13, 15],
    imagePolicy: "无外部图片素材，全部使用原生文字、表格、流程与形状，保持数据/流程导向。",
    constraints: [
      "所有可见对象在 PowerPoint 中保持可编辑",
      "正文在 18pt 以上，表格在 15pt 以上，不在可见页脚放来源 ID 或内部路径",
      "流程、职责与对比以原生内容呈现，不依赖截图",
    ],
    author: "PPTKit",
  },
  slides: [
    {
      id: "cover",
      role: "cover",
      title: "随身行分析报告 · 可编辑 PPT 实践复盘",
      subtitle: "从“AI 一次生成”到“分阶段可复现”的方法论、链路与取舍",
      notes:
        "开场说明这是一次真实的实践复盘，目标是把分析报告转成仍可在 PowerPoint 中继续编辑的 PPT，同时让过程可追溯、可复用。",
      sourceRefs: [{ id: "src-01-source", slideNumbers: [1] }],
    },
    {
      id: "agenda",
      role: "agenda",
      title: "目录",
      items: [
        "实践背景与初衷",
        "实际产出链路",
        "为什么保留三个中间层",
        "Agent、脚本与人工的职责",
        "实践中修正的问题",
        "对比与结论",
      ],
      notes: "用六章串起从背景到结论的完整叙事。",
      sourceRefs: [{ id: "src-01-source", slideNumbers: [1] }],
    },
    {
      id: "sec-background",
      role: "section",
      title: "一、实践背景与初衷",
      message: "从一份分析报告，到一份可编辑、可追溯、可复用的 PPT",
      notes: "进入第一章节，交代项目起点与选择分阶段方案的动机。",
      sourceRefs: [{ id: "src-01-source", slideNumbers: [1] }],
    },
    {
      id: "why-not-oneshot",
      role: "statement",
      title: "为什么不用 AI 一次生成成品",
      message: "直接让 AI 一次性生成成品，在确认、追溯与交接上存在明显短板。",
      items: [
        "内容取舍与页面结构不易逐阶段确认",
        "修改意见常停留在当前对话，重新生成会恢复旧错误",
        "输出是否可在 PowerPoint 中继续编辑，取决于生成工具",
        "数据、结论、文案与实现代码之间缺少可追溯关系",
        "一次性成品利于临时使用，不利于更新与交接",
      ],
      composition: "split",
      notes:
        "由此引出本次方案的核心转向：先整理内容，再设计页面，最后用脚本生成 PPTX。",
      sourceRefs: [{ id: "src-01-source", slideNumbers: [1] }],
    },
    {
      id: "pipeline",
      role: "process",
      title: "实际产出链路",
      steps: [
        { title: "原始报告转换", detail: "Word 报告转为完整原始文本" },
        { title: "内容整理", detail: "提炼背景、数据与建议的 lecture" },
        { title: "页面策划", detail: "定义逐页表达的 storyboard" },
        { title: "脚本实现", detail: "用 PptxGenJS 实现页面与流程" },
        { title: "确定性生成", detail: "重复执行产出可编辑 PPTX" },
        { title: "人工定稿", detail: "可选：在 PowerPoint 中微调并另存" },
      ],
      composition: "timeline",
      notes:
        "链路为：原始报告 → report-raw → lecture → storyboard → build 脚本 → 生成文件 →（可选）人工定稿。",
      sourceRefs: [{ id: "src-01-source", slideNumbers: [1] }],
    },
    {
      id: "stage-roles",
      role: "table",
      title: "各阶段职责",
      table: {
        headers: ["阶段", "主要输出", "作用"],
        rows: [
          ["原始报告转换", "原始文本", "完整保留标题、正文、表格与数字"],
          ["内容整理", "内容口径文件", "提炼结论并保留关键表格与统计口径"],
          ["页面策划", "页面策划文件", "定义每页目标、内容、形式与备注"],
          ["脚本实现", "构建脚本", "用脚本实现页面、表格、图表与流程"],
          ["确定性生成", "生成 PPTX", "由脚本重复执行，输出原生可编辑对象"],
          ["人工定稿", "定稿 PPTX", "完成业务确认、品牌规范与视觉微调"],
        ],
      },
      notes:
        "表格展示链路中每一阶段的输入、输出与职责。最终案例约 14 页。",
      sourceRefs: [{ id: "src-01-source", slideNumbers: [1] }],
    },
    {
      id: "sec-layers",
      role: "section",
      title: "二、为什么保留三个中间层",
      message: "事实、内容口径、页面决策，三层各司其职",
      notes: "进入第二章节，解释为何要保留三个中间文件层。",
      sourceRefs: [{ id: "src-01-source", slideNumbers: [1] }],
    },
    {
      id: "three-layers",
      role: "statement",
      title: "三个中间层各司其职",
      message: "把“承接事实”“统一口径”“统一页面决策”分开，才能确认一门、改一处。",
      items: [
        "原始文本层：忠实承接原报告，不改变数字，便于回查",
        "内容口径层：区分事实、判断与建议，先确认内容再设计页面",
        "页面决策层：保存逐页表达与版式约束，降低重写脚本成本",
      ],
      composition: "split",
      notes:
        "构建脚本只是页面决策的确定性实现；长期修改应回写中间层再改脚本。",
      sourceRefs: [{ id: "src-01-source", slideNumbers: [1] }],
    },
    {
      id: "responsibilities",
      role: "table",
      title: "Agent、脚本与人工的职责",
      table: {
        headers: ["参与方", "主要职责", "不应替代的工作"],
        rows: [
          ["Agent", "整理材料、设计页面、生成与修改脚本", "擅自确认业务数据或整改决策"],
          ["脚本与引擎", "稳定生成原生 PPTX", "判断内容真实性或品牌定稿"],
          ["人工", "确认事实与展示重点，完成品牌定稿", "把长期修改只留在自动生成文件里"],
        ],
      },
      notes:
        "这种分工降低了对单个 Agent 或单轮对话的依赖，接手者只需能读 Markdown、写脚本并运行即可继续。",
      sourceRefs: [{ id: "src-01-source", slideNumbers: [1] }],
    },
    {
      id: "sec-lessons",
      role: "section",
      title: "三、实践中修正的问题",
      message: "从真实踩坑中沉淀出的规则",
      notes: "进入第三章节，分享实践过程中发现并修正的问题。",
      sourceRefs: [{ id: "src-01-source", slideNumbers: [1] }],
    },
    {
      id: "lessons",
      role: "statement",
      title: "四条关键规则",
      message: "修正后的实践规则，让重新生成不再恢复旧错误。",
      items: [
        "业务结构不能被概括过度，如“出差/请假”与“用车出行”应并列",
        "同层级对象使用同一套版式规则，不只为换行单独缩小一个节点",
        "页面修改要同时回写页面决策与脚本，保持信息一致",
        "自动生成文件与人工定稿文件分开，长期修改另存定稿",
      ],
      composition: "split",
      notes:
        "另补充：文件被占用（EBUSY）时不持续重试；生成与视觉 QA 解耦；长期文件不写入本机绝对路径。",
      sourceRefs: [{ id: "src-01-source", slideNumbers: [1] }],
    },
    {
      id: "comparison",
      role: "comparison",
      title: "分阶段可复现 vs AI 直接生成",
      comparison: {
        left: {
          heading: "分阶段可复现流程",
          items: [
            "内容、页面、脚本分层可追溯",
            "同一脚本可稳定重建",
            "可分别修改内容、结构或脚本",
            "输出为可编辑原生对象",
            "适合周期性、需审计的正式材料",
          ],
        },
        right: {
          heading: "AI 直接生成 PPT",
          items: [
            "生成过程相对不透明",
            "不同轮次结果可能变化",
            "常依赖重新提示或继续对话",
            "可编辑性取决于生成工具",
            "适合一次性、低复用的临时演示",
          ],
        },
      },
      composition: "divided",
      notes:
        "结论：按材料复杂度、复用频率、审计要求与人工定稿需求取舍，正式材料也可采用混合方式。",
      sourceRefs: [{ id: "src-01-source", slideNumbers: [1] }],
    },
    {
      id: "conclusion",
      role: "statement",
      title: "实践结论",
      message:
        "把事实、页面决策与实现代码分别保存，就能建立清晰的确认门与修改边界：先确认事实、再确认页面、最后生成文件；脚本可重复执行，输出仍可在 PowerPoint 中继续编辑。",
      notes:
        "业务纠错能同步到长期文件而非只留在对话；自动产物、人工定稿与可选 QA 各自独立。",
      sourceRefs: [{ id: "src-01-source", slideNumbers: [1] }],
    },
    {
      id: "closing",
      role: "closing",
      title: "何时采用这套方法",
      message:
        "根据材料复杂度、复用频率、审计要求与人工定稿需求决定；代价是首次步骤更多，需要维护多层文件的一致性。",
      items: [
        "需要可追溯、可重复生成、持续更新的材料，推荐采用",
        "一次性、低复用的临时演示，可考虑直接生成",
        "正式材料可混合：AI 提炼基础版，脚本保证可重复，人工完成定稿",
      ],
      notes:
        "收尾致谢，并提醒保持多层文件一致性的成本。",
      sourceRefs: [{ id: "src-01-source", slideNumbers: [1] }],
    },
  ],
};
