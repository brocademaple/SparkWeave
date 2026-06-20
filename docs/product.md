# SparkWeave Product Scope

SparkWeave is a Mandarin-first inspiration and productivity app for creators. It turns scattered thoughts into usable creative outputs through a daily or on-demand loop:

1. 快速捕捉
2. 收件箱整理
3. 可解释编织
4. 产物生成
5. 反馈复盘
6. 偏好沉淀

The product should protect low-friction inspiration capture while helping users understand why ideas connect, what problem a cluster points to, and what action can follow.

## Product Presentation

一句话定位：

SparkWeave 是面向中文创作者的灵感编织工作台：把散落在 Obsidian、Notion、语雀、聊天记录、截图和草稿里的素材，收束成可解释的关系、明确的判断和下一步行动。

核心痛点：

- 收藏越多，产出越少？创作者常常把文章、引用、产品截图、读书笔记塞进不同工具，但再次打开时只看到更大的素材堆。
- 灵感不是缺失，而是缺少被解释的连接：这些材料为什么相关、它们共同指向什么问题、现在最小可推进的动作是什么。
- 传统知识库擅长保存与检索，创作现场还需要把材料转成选题、论点、brief、故事起点和任务入口。

与现有工具的关系：

- SparkWeave 与 Obsidian、Notion、语雀等资料库配合，把已有素材网络收束成解释、判断和行动。
- 它更像一层创作推进界面：从已有素材里抽取当前有用的 cluster，给出可解释编织、判断依据和一个可接受、编辑或拒绝的行动建议。
- Daily Assistant 只在用户开启时每天推一个高价值回访点；Feedback Loop 记录用户对解释、产物和建议的反馈，让之后的编织更贴近个人偏好。

差异化：

- 从“存起来”走到“说清楚”：每个 cluster 都回答 connection_reason、shared_problem、suggested_action。
- Mandarin-first 创作者体验：默认面向中文选题、文章、产品 brief、内容脚本和灵感复盘。
- 可解释而非黑箱自动化：先让用户看懂关系，再决定是否生成产物或进入行动。
- 小步推进：把一个素材簇转成一篇文章大纲、一个 MVP 验证任务、一个产品判断或一次复盘。

MVP 验证故事：

- 文章案例：用户收藏了 5 条关于“AI 笔记应用”的帖子、1 篇“收藏越多，产出越少？”的文章草稿、2 张竞品截图和几段自己的吐槽。SparkWeave 将它们编成一个“信息堆积反噬创作”的 cluster，解释共同问题是“素材系统没有把收藏转成表达决策”，建议先生成一篇短文大纲：开头用痛点提问，中段对比 Notion / Obsidian / 语雀的保存优势，结尾提出 SparkWeave 的可解释编织。
- MVP 案例：早期版本只需要验证三件事：用户愿不愿意快速捕捉碎片；看到 Weave Cluster 的解释后是否觉得“这确实是我的问题”；在 Daily Assistant 或手动编织中，是否愿意把 suggested_action 推进为 article plan、project brief 或下一步任务。
- 成功信号看素材簇能否走到一个可发布、可讨论、可执行的输出。

推广用短文案：

- 收藏越多，产出越少？SparkWeave 帮你把散落素材编织成说得清的判断和做得动的下一步。
- 给中文创作者的灵感工作台：连接材料，解释关系，生成文章、brief 和行动入口。
- 不搬家，不重建知识库。把 Obsidian、Notion、语雀里的素材网络收束成一次可执行的创作推进。
- SparkWeave: from scattered captures to explainable creative action.

## MVP Direction

The first version should be a runnable Expo app, not a static prototype. It uses the confirmed visual direction from the generated prototype board:

- 主风格：纸感智能、温润艺术、节点实验
- 信息结构：高级白、清晰工具感
- 字体气质：宋体/明朝体式高级知识产品，正文保持清晰现代
- 深色模式：作为设置选项和 Focus / Weave 的沉浸气质

## Navigation

Top-level navigation uses four function tabs plus a centered capture action:

- 收件箱：all captured materials, filters, and triage
- 编织：rule-generated clusters and relationship interpretation
- 中间加号：fastest lightweight inspiration capture entry
- 产物：generated outputs, story starters, article plans, project briefs
- 主页：creator profile, process metrics, and commit-log-like progress history

The centered capture action opens a modal sheet. Card detail, output detail, focus mode, and settings are secondary sheets.

## Daily Assistant

The Daily Assistant gives users a reason to open SparkWeave even when they do not have a new idea to capture.

It should be optional. Some users want a daily creative nudge; others prefer to use SparkWeave only when they already have a task. The product should respect both modes.

Future setting:

```text
Daily Assistant: on/off
```

When enabled, the Daily Assistant can surface one high-value recommendation per day:

- the most promising material cluster to revisit
- one unfinished output worth pushing forward
- one creator-specific task, such as drafting an outline or reviewing a generated brief
- one question that helps the user decide what to create next

When disabled, SparkWeave should remain quiet and work as an on-demand creative tool. Active discovery may still happen inside the app, but it should be presented as a suggestion, not a forced task or intrusive notification.

## Data

MVP storage uses AsyncStorage because it is fast to ship and good enough for local validation.

Long-term storage should move to SQLite, with optional cloud sync later. SQLite is a better fit for structured entities:

- captures
- tags
- projects
- relationship edges
- saved searches
- review history
- user feedback
- creator preferences

The current code keeps storage behind `src/storage.ts` so the persistence layer can be replaced without rewriting the UI.

## Automatic Weaving

MVP weaving is local and explainable. It groups captures by:

- shared tags
- project ownership
- product keywords
- visual/design keywords
- storage/data keywords
- writing/review keywords

Every Weave Cluster should answer three fixed questions:

1. Why are these inspirations connected?
2. What shared problem, theme, or creative direction do they point to?
3. What action can the user take next?

A cluster that only displays related ideas is not valuable enough. Each cluster should produce at least one suggested action, such as:

- turn this cluster into a story premise
- draft a short article outline
- merge these fragments into an output brief
- review whether this theme is still worth pursuing

Future cluster output shape:

```text
connection_reason
shared_problem
suggested_action
```

Later API integration can add summaries, suggested next actions, relation labels, creator-specific templates, and project or output recommendations.

## Feedback Loop

After each meaningful Agent output, SparkWeave should ask whether the result matched the user's intent and needs.

Feedback should happen after the user receives a weaving result, story starter, article plan, project brief, or other generated output. The goal is to improve future retrieval, prompting, templates, and personalization.

MVP feedback can include:

- score
- text feedback

Future feedback can include:

- screenshots
- image references
- annotated examples
- before/after edits

Future feedback shape:

```text
score + text + optional media
```

The feedback loop should help the Agent system learn:

- which connection explanations feel convincing
- which output formats the user prefers
- which prompts produce useful results
- which templates are too generic
- which suggestions feel too forceful or distracting

## Onboarding and Guidance

New users should not be asked to understand the whole system first. The product should teach by guiding them through one small loop:

1. capture a few fragments
2. see why the fragments connect
3. review what problem or creative direction they point to
4. accept, edit, or reject the suggested action
5. give lightweight feedback

The onboarding should help users understand that SparkWeave is not only a storage tool. It is an assistant for interpreting inspiration and turning it into a concrete starting point.

For ADHD users, the guidance should reduce pressure:

- capture should stay lightweight
- proactive discovery should be framed as optional help
- recommendations should be easy to ignore, save, or postpone
- every generated cluster should offer a small next step, not a heavy project mandate

## Key Assumptions

- The first version should validate daily usefulness before full Figma polish.
- Mandarin is the primary UI language.
- A calm default mode matters more than always-on spectacle.
- The product should feel like a thinking studio, not a generic task app.
- Daily Assistant should be optional, because not every user wants daily prompting.
- Active discovery should remain assistive and suggestive, not coercive.
- Agent feedback is part of the product loop, not an afterthought.
- ADHD users benefit from low-friction capture, clear explanations, and small suggested actions.
