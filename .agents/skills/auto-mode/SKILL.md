---
name: auto-mode
description: >-
  Toggle or inspect workspace auto mode, and run the ordered research-to-validation
  feature workflow when auto mode is enabled for a developer-initiated task.
---

# auto-mode

Auto mode is a workspace-local opt-in. It removes routine artifact approvals and
stage-continuation prompts for a feature request the developer has started. It
does not start new tasks on its own.

## Toggle

Use `$auto-mode on`, `$auto-mode off`, `$auto-mode toggle`, or `$auto-mode status` (also
`/auto-mode ...`). Run `workflows auto <action> --root <workspace-root>` from the
workspace root. If the installed CLI is unavailable, use
`node <package-root>/bin/workflows.js auto <action> --root <workspace-root>`.
Report the effective state and `workspace.config.json` path. The CLI owns writes;
do not manually edit the auto-mode setting through this command. Older
`.agent-workflows/metadata.json` settings migrate automatically when a config
or auto-mode command runs. Missing settings default off.

## Automatic Feature Workflow

At the beginning of a developer-initiated feature or implementation request,
read `workspace.config.json` and inspect `autoMode.enabled`. If it is absent,
read legacy `.agent-workflows/metadata.json` until migration. Apply this section
only when the effective `autoMode.enabled` is `true`. Treat missing settings as
off; report malformed settings rather than guessing. Read the relevant stage
skill at each step and keep its quality and artifact requirements. The active request
authorizes intermediate PRD and plan approvals and stage continuation; it does
not authorize commits, pushes, publishing, deployment, production changes, or
work outside the requested feature.

Advance through these stages in order, reusing verified artifacts if resuming:

1. **Research:** Follow `research/SKILL.md` and save a research brief linked to
   the request. Continue after the brief is complete.
2. **Create PRD:** Follow `create-prd/SKILL.md`, link the brief, and save a draft
   PRD. Continue without offering optional stage choices.
3. **Create design:** Follow `create-design/SKILL.md` for affected UI/UX. If the
   feature has no user-facing surface, record why design is not applicable in
   the PRD and continue with the PRD at `draft` status. Do not invent a visual
   artifact.
4. **Sprint meeting:** Follow `sprint-meeting/SKILL.md`. All role agents review
   the PRD and available design or UX notes. Resolve agent-answerable issues and
   apply accepted improvements before continuing.
5. **Approve PRD:** Follow `approve-prd/SKILL.md`. Check that requirements and
   human-only decisions are resolved, mark the PRD `approved`, and record
   `Approved by: auto-mode (developer-enabled)` and
   `Approval command: $auto-mode on`. The approval skill then hands off to
   `create-plan`.
6. **Create plan:** Follow `create-plan/SKILL.md` for the approved PRD. Confirm
   the root plan and all required submodule plans are complete, linked, and
   consistent. Reuse plans already produced by the approval handoff; do not
   create duplicates.
7. **Approve plan:** Follow `approve-plan/SKILL.md`. Resolve agent-answerable
   planning issues, mark the root plan `approved`, and record the same auto-mode
   approval authority.
8. **Implement and validate:** Follow the approved plan and configured
   dependency-safe stages. Continue between stages without a routine developer
   prompt. Run each owning repository's validation commands and report results.
   Resolve the `coding` model before spawning an implementation role. Resolve
   `validation` only when spawning a separate validation agent; an existing
   coding agent keeps its model while validating its own work.
9. **Completion handoff:** After coding and validation, use
   `templates/auto-mode-completion-summary-template.md`. Require every serial
   or delegated coding agent to return applicable, verified repository facts
   from that template. Reconcile shared settings, conflicting reports, and
   cross-repository setup order before publishing one final summary. Put the
   developer's remaining Build, Run, and Roll out actions first. Report exact
   build-service and runtime configuration, breaking changes, migrations,
   validation limits, and affected app/web/API operations. Use `None` only
   after checking; use `Unknown` with the missing fact and owner otherwise.
   Never include secret values or claim an external build or runtime was tested
   when it was not. Keep the template's artifact status, per-repository
   implementation, validation, and human-only question sections in the final
   report alongside the operational handoff.

At each stage, show a concise progress update and verify the required artifact
or validation result before advancing. Resolve questions that agents can answer
from the PRD, research, design, code, and role knowledge. Ask the developer only
when product intent, business priority, private data, credentials, an external
stakeholder choice, or another decision cannot responsibly be inferred. State
which stage is blocked, wait for the answer, record it, and resume. Continue
independent work while waiting when safe. If a required capability is absent or
validation fails, attempt a bounded fix; report an unresolved blocker rather
than claiming completion.

If auto mode is turned off during a task, finish the current safe operation and
return to manual approval and stage gates before the next stage.

## Output

For a toggle, report the effective state and `workspace.config.json` path. For a completed
coding feature, follow `templates/auto-mode-completion-summary-template.md`
and include research, PRD, design or non-applicability, meeting log, plans,
changed repositories, validation, developer setup actions, breaking changes,
and any unresolved human-only question. For a documentation-only feature, use
the same headings and mark irrelevant build or runtime actions `None` after
checking.
