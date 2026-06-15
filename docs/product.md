# SparkWeave Product Scope

SparkWeave is a Mandarin-first inspiration and productivity app. It turns scattered thoughts into executable projects through a daily loop:

1. 快速捕捉
2. 收件箱整理
3. 自动编织关系
4. 项目化执行
5. 回顾沉淀

## MVP Direction

The first version should be a runnable Expo app, not a static prototype. It uses the confirmed visual direction from the generated prototype board:

- 主风格：纸感智能、温润艺术、节点实验
- 信息结构：高级白、清晰工具感
- 字体气质：宋体/明朝体式高级知识产品，正文保持清晰现代
- 深色模式：作为设置选项和 Focus / Weave 的沉浸气质

## Navigation

Top-level navigation uses four tabs:

- 今日：daily command center
- 收件箱：captured ideas, filters, triage
- 编织：rule-generated clusters and relationships
- 项目：project list and execution entry

The centered capture action opens a modal sheet. Card detail, project detail, focus mode, and settings are secondary sheets.

## Data

MVP storage uses AsyncStorage because it is fast to ship and good enough for local validation.

Long-term storage should move to SQLite, with optional cloud sync later. SQLite is a better fit for structured entities:

- captures
- tags
- projects
- relationship edges
- saved searches
- review history

The current code keeps storage behind `src/storage.ts` so the persistence layer can be replaced without rewriting the UI.

## Automatic Weaving

MVP weaving is local and explainable. It groups captures by:

- shared tags
- project ownership
- product keywords
- visual/design keywords
- storage/data keywords
- writing/review keywords

Later API integration can add summaries, suggested next actions, relation labels, and project recommendations.

## Key Assumptions

- The first version should validate daily usefulness before full Figma polish.
- Mandarin is the primary UI language.
- A calm default mode matters more than always-on spectacle.
- The product should feel like a thinking studio, not a generic task app.
