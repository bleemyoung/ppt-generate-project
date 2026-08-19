# DeepSeek Harness 与 Markdown→PPT 成本基准研究

研究日期：2026-08-19

## 结论摘要

已有 Markdown 文档并不等于模型只需“把文档翻译成 PPT”。在 Agent/IDE 工作流中，模型通常还要读取工作区规则、Skills、示例、构建脚本和已有产物，决定页面结构，调用文件系统/命令工具，处理构建错误，再回读结果并修正。每一轮请求都会带上当时所需的上下文；多轮工具调用还会重复发送历史消息。因此，四五万 token 可能主要来自「上下文 + 多轮循环 + 推理 + 代码/调试」，而不是 Markdown 正文本身。

DeepSeek API 可以直接提供按请求的 `prompt_tokens`、`prompt_cache_hit_tokens`、`prompt_cache_miss_tokens`、`completion_tokens`、`total_tokens`，并在 `completion_tokens_details.reasoning_tokens` 中提供推理 token（字段是否被具体中间层完整保留，要以实际响应为准）。因此，比较模型与 Harness 时应保存每个 API 响应，而不要只看 IDE 的计数器。

## 官方事实

### 1. 计费和 usage 字段

DeepSeek 官方价格页说明按模型处理的输入、输出 token 计费，并列出 DeepSeek-V4-Flash / V4-Pro 的上下文长度、最大输出和缓存命中/未命中输入价格：[Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing)。价格会变化，实验记录必须保存抓取日期和当时的价格表。

聊天接口 `usage` 的官方定义包括：

- `prompt_tokens = prompt_cache_hit_tokens + prompt_cache_miss_tokens`；
- `prompt_cache_hit_tokens`：命中上下文缓存的输入 token；
- `prompt_cache_miss_tokens`：未命中的输入 token；
- `completion_tokens`：模型生成的 completion token；
- `total_tokens`：输入与输出合计；
- `completion_tokens_details.reasoning_tokens`：completion 中的推理 token（若服务端返回该详情）。

字段定义见官方 API 参考：[Create Chat Completion](https://api-docs.deepseek.com/api/create-chat-completion)。

单请求成本应按当日价格计算：

```text
cost_usd = hit_tokens / 1_000_000 * hit_price
         + miss_tokens / 1_000_000 * miss_price
         + completion_tokens / 1_000_000 * output_price
```

`reasoning_tokens` 已包含在 `completion_tokens` 内，不能再叠加计费。使用 `total_tokens` 做规模统计可以，但不要用它直接乘一个混合单价。

### 2. 上下文缓存

官方缓存文档说明缓存只匹配输入前缀；缓存是 best-effort，不保证 100% 命中；缓存建立需要时间，闲置后通常会在数小时到数天内清除。[Context Caching](https://api-docs.deepseek.com/guides/kv_cache)

这意味着同一份文档的重复测试必须区分两种实验：

1. **冷缓存**：为每个实验使用独立前缀/等待缓存失效，测首次运行成本。
2. **暖缓存**：固定 system prompt、项目规则和文档前缀，重复运行并记录命中率，测持续迭代成本。

不能把一次运行的 cache hit 结果直接推广为另一种 Harness；Harness 对 system prompt、文件读取顺序、工具定义和历史消息的微小变化都可能改变缓存前缀。

### 3. 思考模式与工具调用

官方思考模式文档说明思考内容通过 `reasoning_content` 返回；当某一轮发生工具调用时，后续请求必须把该轮的 `reasoning_content` 原样传回，否则可能得到 400 错误。[Thinking Mode](https://api-docs.deepseek.com/guides/thinking_mode/)

这解释了为什么 Agent 任务的输入 token 会快速增长：工具调用后的后续请求可能同时包含原始 Markdown、系统规则、工具定义、此前 assistant 消息（含 reasoning/tool calls）和工具结果。要比较 Harness，必须记录每个子请求，而不能只记录最终回答的一次 usage。

## “DeepSeek Harness”指什么

这里应优先按用户所说的官方项目理解，而不是把它泛称为某个 API wrapper。DeepSeek 官方 GitHub 仓库将 DeepSeek Harness（命令名 `dsh`）定义为 DeepSeek AI 开发的开源 Agent harness，采用“everything is a plugin”的架构，目前处于 developer preview，可能有兼容性破坏性变化：[官方仓库 README](https://github.com/deepseek-ai/deepseek-harness)。

官方 Web UI 指南确认它可以读取和编辑工作区文件、运行命令、委派工作并维护计划；模型和 workspace 在 UI 中配置：[官方 Web UI 指南](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/index.md)。官方开发指南还说明真实 API 运行使用 `DEEPSEEK_API_KEY`，headless/demo 等模式可通过命令行运行：[开发指南](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/development.md)。

公开官方资料明确了 Harness 的运行方式和 Agent 能力，但没有在 README/用户指南中承诺一个独立、稳定的“按任务成本报表”格式。实际基准应把 API 原始响应作为成本事实来源，并另外采集 Harness 的 session、工具事件、命令日志和墙钟时间。

## 推荐的公平比较方案

### 固定输入与任务契约

建立一个只读的 benchmark case，例如：

```text
benchmark-cases/随身行/
├── input/brief.md                 # 唯一业务输入
├── constraints.md                 # 固定页数、受众、风格、输出文件名
├── expected-files.md              # 允许修改/必须生成的文件
└── evaluator.md                   # 自动检查与人工评分规则
```

每个模型/Harness 都从同一 Git commit、同一空白 worktree 开始。固定 Node/pnpm/PptxGenJS 版本、字体、操作系统、网络条件、时区、模型参数（thinking/reasoning effort、temperature 等）和最大迭代次数。不要把上一次的 `intermediate/`、`output/` 或模型生成的 prompt 带入下一次。

### 分离变量

先做最小矩阵，避免把“模型差异”和“工具差异”混在一起：

| 组别 | 模型 | Harness/环境 | 目的 |
|---|---|---|---|
| A | 同一 DeepSeek 模型 | 直接 API 脚本 | API 基线 |
| B | 同一 DeepSeek 模型 | VS Code + Kilo | 当前生产路径 |
| C | 同一 DeepSeek 模型 | 官方 `dsh` | Harness 路径 |
| D | 另一模型 | 尽量同一 Harness | 模型变量 |
| E | 同一模型 | 另一 Harness | Harness 变量 |

每个单元至少运行 3 次：一次冷缓存、两次暖缓存。若模型有随机性，固定 seed（若接口支持）；不支持时报告中位数和范围，不只报告最好的一次。

### 必须记录的原始数据

为每次 API 子请求保存一条 JSONL，至少包括：

```json
{
  "run_id": "2026-08-19-dsh-flash-001",
  "request_index": 3,
  "timestamp_start": "...",
  "timestamp_end": "...",
  "model": "deepseek-v4-flash",
  "system_fingerprint": "...",
  "prompt_tokens": 0,
  "prompt_cache_hit_tokens": 0,
  "prompt_cache_miss_tokens": 0,
  "completion_tokens": 0,
  "reasoning_tokens": 0,
  "total_tokens": 0,
  "tool_calls": ["read_file", "exec"],
  "tool_result_bytes": 0,
  "status": "success"
}
```

同时保存：Harness 版本/commit、模型配置、输入文件 SHA-256、输出 PPTX SHA-256、构建日志、错误重试次数、总墙钟时间，以及实际价格快照。若中间层不返回 usage，应记录为“不可观测”，不能用字符数或 UI 估算冒充 API token。

### 费用、效率和质量指标

对每个 run 汇总：

- 成本：命中输入、未命中输入、输出、总 USD；另列推理 token但不重复计费。
- 规模：API 请求数、工具调用数、输入/输出/推理/总 token。
- 时间：首请求到终稿、模型等待时间、工具执行时间、人工介入时间。
- 产出：是否生成可打开的 PPTX、页数、构建/渲染错误、是否符合文件契约。
- 质量：内容覆盖、结构叙事、视觉层级、文字溢出/重叠、可编辑性；建议盲评 1–5 分，并保留渲染图和评分理由。

核心比较应使用“达到验收门槛的成本”和“达到验收门槛的时间”，而不是单看 token 最少。一个便宜但需要人工返工的 run，不能与一次生成可交付终稿的 run 直接比较。

## 针对当前项目的落地建议

1. 把 [examples/随身行PPT实践](../../examples/随身行PPT实践/) 固定为 benchmark case；每次从同一输入 commit 建新 worktree。
2. 让直接 API、Kilo 和 `dsh` 都执行同一份任务提示词，并约定只允许写入 `intermediate/`、`output/`，终稿进入 `output_final/`。
3. 先运行 `dsh` 的 headless/CLI 路径，再测试 Web UI；这样更容易保存 stdout、事件日志和退出码。官方开发指南给出了 headless 示例：`pnpm dsh --profile headless "summarize this workspace"`。
4. 优先实现一个 API 代理/SDK 包装层，在每个请求结束时把 `usage`、时间戳、模型、system fingerprint、工具事件写入 `benchmark-runs/<run_id>/requests.jsonl`；不要依赖 Kilo 或 Harness 是否展示完整计数。
5. 成本报告同时给出冷缓存和暖缓存结果，并明确“是否包含部署/环境准备”；这正是当前两次实施不可直接横比的主要原因之一。

## 来源

- [DeepSeek Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing)
- [DeepSeek Create Chat Completion API](https://api-docs.deepseek.com/api/create-chat-completion)
- [DeepSeek Context Caching](https://api-docs.deepseek.com/guides/kv_cache)
- [DeepSeek Thinking Mode](https://api-docs.deepseek.com/guides/thinking_mode/)
- [DeepSeek Harness 官方 GitHub README](https://github.com/deepseek-ai/deepseek-harness)
- [DeepSeek Harness 官方 Web UI 指南](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/index.md)
- [DeepSeek Harness 官方开发指南](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/development.md)
