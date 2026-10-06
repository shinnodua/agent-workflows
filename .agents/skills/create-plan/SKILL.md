---
name: create-plan
description: >-
  Create or resume implementation plans from an approved workspace PRD ID,
  path, or feature description. Use for create-plan, /create-plan, or the
  planning handoff after PRD approval.
---

# create-plan

Create implementation plans from an approved PRD. A feature description can
identify an existing PRD or start the PRD workflow first. This skill does not
skip PRD approval or begin implementation.

## Usage

```txt
$create-plan <prd-id-or-path-or-description>
create-plan <prd-id-or-path-or-description>
/create-plan <prd-id-or-path-or-description>

$create-plan PRD-20261006-example
$create-plan "Describe the feature or task to plan"
```

If the client intercepts slash commands, use `$create-plan` or `create-plan`.

## Required Behavior

1. Resolve the argument:
   - For a PRD ID or path, find that exact PRD. If it is missing, report that
     it was not found; do not treat the ID or path as a feature description.
   - For a feature description, search `prds/` for a clearly matching PRD.
     Reuse an unambiguous match, preferring its latest relevant version; ask
     which PRD to use if multiple plausible matches remain. Do not infer a
     match from a weak keyword overlap.
   - If no PRD matches the description, follow `create-prd/SKILL.md` to create
     a draft from it. In auto mode, first follow the research stage in
     `auto-mode/SKILL.md`, then complete the remaining required PRD stages.
     In manual mode, stop for PRD review and approval before planning. After
     approval, resume this skill with the approved PRD ID; reuse any plans
     already produced by the approval handoff.
   - If the argument is omitted, use an unambiguous PRD from the active request
     or ask for an ID, path, or description.
2. Confirm the selected PRD has `Status: approved`. If it is `superseded`,
   report its path and status and ask for the replacement PRD; do not plan from
   it. For another unapproved status, report the path and status. In manual
   mode, give the next action (`$approve-prd <prd-id>` for a reviewable draft or
   design-done PRD) and stop before planning. In auto mode, complete required
   review, design, and approval stages, then resume planning with its approved
   ID. Never create plans until approval is recorded.
3. Read `project/PROJECT.md`, `project/repositories.json`,
   `project/workflows.json`, `roles/tech-lead.md`, and
   `templates/plan-template.md`. Identify affected repositories, configured
   plan paths, agent guides, implementation stages, and validation commands.
4. Read every research brief linked from the PRD `Research sources` metadata or
   `Research Context`. If none is linked, use only directly relevant briefs in
   `research/`. Carry answered importance questions and accepted design
   decisions from the PRD into planning assumptions.
5. Find plans already linked to this PRD by `PRD ID` and PRD link, using stable
   plan IDs and paths. Reuse them on a rerun. Complete incomplete draft plans,
   create missing plans, and reconcile links. Do not duplicate plans, reset
   statuses, or silently overwrite approved or in-progress plans; report any
   material conflict that requires a new planning decision.
6. As the Tech Lead, create or complete the root overview plan in `plans/` using
   `PLAN-<YYYYMMDD>-<short-slug>`. Translate the PRD into architecture, data
   models, API endpoints, repository responsibilities, sequencing, dependencies,
   validation, risks, and open questions. Fill `Research sources` metadata and
   `Research Inputs` with evidence that shaped those choices; use `None` only
   when no source was provided or discovered. New plans have `Status: draft`.
7. Keep shared data types, interfaces, validation schemas, and cross-repository
   contracts in the shared/core repository plan as the single source of truth.
   Make dependent platform plans explicitly reference those structures.
8. For each affected repository, spawn a planning sub-agent to create or complete
   its detailed plan in `artifactDirectories.plans` from
   `project/repositories.json`. Resolve the assigned role's `planning` model
   with `workflows agents resolve planning <role> --format <codex|claude> --json`
   before spawning; use a non-`inherit` model when supported and report an
   unapplied override. No submodule agent or plan is needed when the PRD affects
   only the root workspace.
9. Give each sub-agent the approved PRD path and ID, relevant requirements and
   acceptance criteria, answered importance questions, linked research and
   platform implications, draft root plan path and ID, architecture and
   sequencing, platform responsibility, dependencies, validation expectations,
   risks, open questions, exact destination path, and required parent-plan
   link. Require it to read its configured `agentGuide`, follow
   `templates/plan-template.md`, fill platform-specific research fields, set
   new plans to `draft`, preserve existing progressed plans, and edit only its
   assigned plan file.
10. Review all submodule plans against the PRD, root architecture, research,
    shared-contract ownership, links, sequencing, and validation. Reconcile
    conflicts and link each submodule plan from the root plan with a short
    responsibility summary. Record unresolved technical choices as planning
    questions.
11. Do not edit product code. In manual mode, invite review and give the next
    command `$approve-plan <plan-id>`. In auto mode, review completeness and
    continue to plan approval without a routine prompt.

## Output

When planning is complete, report the approved PRD path; root and submodule
plan paths and statuses; which plans were created, completed, or reused; and
any open planning questions. If a description stops at PRD review in manual
mode, report the draft PRD path and the approval step needed before planning.
