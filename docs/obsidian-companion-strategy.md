# SparkWeave as an Obsidian Companion

## One-line Positioning

SparkWeave should be a companion layer for Obsidian users: Obsidian remains the durable local knowledge base, while SparkWeave becomes the personalized inspiration-weaving Agent that explains relationships, turns scattered notes into judgments, and pushes those judgments toward creative output.

The product promise is:

```text
Obsidian stores the user's thinking assets.
SparkWeave helps the user understand what those assets are trying to become.
```

## Survival Position: Not a Second Obsidian

SparkWeave should not compete with Obsidian's strongest territory:

- Markdown editing
- backlinks and graph navigation
- Canvas-style freeform arrangement
- generic note databases
- plugin marketplaces
- sync, publish, or vault hosting
- asking users to migrate their whole knowledge base

The survival position is narrower and sharper: SparkWeave is an interpretation, incubation, and action layer for creators who already have notes, highlights, fragments, and unfinished thoughts.

## Why This Direction Still Holds

Obsidian already provides strong primitives:

- local-first Markdown vaults
- backlinks and unlinked mentions
- graph view
- Canvas
- tags, properties, and Bases
- search
- community plugins
- TypeScript plugin API
- Obsidian URI automation

These features help users preserve and navigate knowledge. SparkWeave can add value by being more active and opinionated:

- It detects repeated themes.
- It explains why ideas are connected.
- It distinguishes evidence, contradiction, cause, extension, and action.
- It turns a cluster into a next-step brief.
- It learns which explanations and outputs the user actually accepts.

## What to Reference From Obsidian

### Links as Core Assets

Links should be treated as durable creative assets. SparkWeave should preserve links to original notes, keep generated outputs traceable, and write back in portable Markdown when possible.

Reference from Obsidian:

- backlinks
- outgoing links
- block or heading references where available
- tags and properties

SparkWeave extension:

- convert links into relationship explanations
- surface why a link matters for the current creative goal
- show how a link changes a judgment or next action

### Unlinked Mentions

Unlinked mentions are important because users cannot remember every possible connection. SparkWeave can extend this idea with Agent sensing:

- detect repeated names, phrases, themes, and unresolved questions
- prepare pre-content before the user starts acting
- recommend which materials are worth reading before writing, planning, or deciding

The key move is from "this phrase appeared elsewhere" to "this earlier material may change what you should do next."

### Canvas and Relationship Labels

Obsidian Canvas shows that many users think spatially. SparkWeave can borrow the idea of labeled relationships, but make the label part of the product logic.

Current built-in relationship families:

- cause
- evidence
- conflict
- extension
- action

Possible future families:

- contrast
- sequence
- constraint
- example
- question
- counterexample
- source
- hypothesis

### Local-first

Local-first should be preserved because the user's notes are digital assets. Users should be able to leave SparkWeave without losing the value they created.

Minimum expectation:

- export Markdown
- export JSON
- preserve source links
- preserve relationship labels
- preserve cluster summaries
- preserve feedback history
- preserve generated outputs

## SparkWeave's Differentiation

SparkWeave should be more proactive than Obsidian in one specific way: it should help users collapse a knowledge network into judgment and action.

Differentiated surfaces:

- theme discovery from scattered notes
- relationship interpretation between fragments
- action advice after every Weave Cluster
- creator-specific output templates
- feedback-based personalization
- import/export connectors for existing note tools

This makes SparkWeave closer to a creator incubation Agent than a note-taking app.

## Relationship Label Governance

Relationship labels are powerful, but fully open custom labels can become messy. If users create too many narrow labels, the system may lose long-term readability.

Recommended approach:

1. Keep a small set of canonical relationship families.
2. Allow custom labels, but map each custom label to a canonical family.
3. Warn when a label is too narrow or used only once.
4. Suggest merges for similar labels.
5. Keep raw custom labels visible, but use canonical families for search, filtering, and Agent reasoning.

Example:

```text
Custom label: "数字员工落地卡权限"
Canonical family: constraint
```

This gives advanced users flexibility while preserving a usable long-term graph.

## Action Advice and Follow-up

Action Advice is useful only if the product can help users follow through without becoming coercive.

MVP follow-up should be lightweight:

- show one suggested action per cluster
- let the user check, save, postpone, or reject it
- allow a short score and text feedback after output
- track whether the action became a capture, output, or project

Possible future follow-up:

- today / this week rhythm
- Agent-generated acceptance criteria
- small checklist
- "what changed after this action?" review
- optional Daily Assistant reminders

The default should be user confirmation. Agent follow-up can help with judgment and review, but it should not force the user's pace.

## Local-first and Asset Portability

SparkWeave should assume that users may eventually move their data elsewhere. That is healthy product design.

Exportable asset types:

- captures
- material type trees
- source note references
- relationship edges
- Weave Clusters
- suggested actions
- feedback entries
- generated outputs
- creator preferences

Preferred export formats:

- Markdown for human-readable briefs
- JSON for structured migration
- CSV for simple review and analysis

## Connector Roadmap

### Phase 1: Obsidian

- import selected Markdown notes
- parse tags, links, properties, and note titles
- generate theme briefs
- export generated Markdown back into a SparkWeave folder
- open generated notes through Obsidian URI where useful

### Phase 2: Notion, Yuque, and Evernote

- import pages or selected documents
- preserve source URLs and titles
- normalize content into `material_fragment`
- avoid becoming a full synchronization product in the first version

### Phase 3: Agent Review

- scheduled or manual review of selected sources
- detect promising clusters
- recommend pre-content before writing or deciding
- respect Daily Assistant and proactive suggestion settings

### Phase 4: Plugin, MCP, or Local Bridge

- Obsidian plugin command: "Weave selected notes"
- MCP or local bridge for explicit vault search and note writing
- connector actions exposed as controlled tools

## MVP Case: Why Do More Bookmarks Lead to Less Output?

This article idea can become the first Obsidian companion MVP case.

Input:

- 5-10 notes about saving resources, unfinished ideas, vague inspiration, tasks, and output anxiety
- source notes imported from Obsidian or pasted manually

SparkWeave output:

- theme: collection creates false progress
- connection reason: the notes describe a chain from capture to accumulation to lack of organization
- shared problem: ideas are preserved but not turned into structure
- suggested action: draft a short article titled "Why Do More Bookmarks Lead to Less Output?"

Article structure:

1. The false progress feeling created by collecting.
2. The real problem is that ideas are not organized.
3. A good tool should help people discover themes, not only save materials.

## Recommended MVP Architecture

Start with import/export plus a simple Obsidian handoff.

```text
Obsidian vault or pasted notes
  -> SparkWeave imports selected materials
  -> SparkWeave builds clusters and explanations
  -> User accepts, edits, or rejects a brief
  -> SparkWeave exports Markdown / JSON
  -> User can store the result back in Obsidian
```

This proves the value before committing to a full Obsidian plugin.

## Product Presentation Copy

Short pitch:

```text
SparkWeave turns scattered creative notes into explainable themes, judgments, and next actions.
```

Pain:

```text
Creators collect more than they produce because saved ideas rarely organize themselves.
```

Differentiation:

```text
Obsidian helps you keep the network. SparkWeave helps you decide what the network means today.
```

## Product Principles

1. Obsidian is the first source of truth.
2. SparkWeave is the interpretation and action layer.
3. Never require migration.
4. Every generated connection needs a reason.
5. Every Weave Cluster needs a suggested action.
6. Write back in portable formats.
7. Treat AI output as editable drafts.
8. Let user feedback shape future retrieval, prompts, and templates.

## Key Assumptions

- The first users already have notes, highlights, fragments, or drafts.
- The strongest wedge is theme discovery and action conversion.
- Obsidian is the first connector priority.
- Notion, Yuque, and Evernote should be documented as import routes before becoming active integrations.
- Relationship labels should be customizable through governed families.
- Action Advice should start with user confirmation, scoring, and text feedback.
