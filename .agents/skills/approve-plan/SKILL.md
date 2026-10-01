---
name: approve-plan
description: >-
  Approve a workspace root overview plan and begin implementation, using
  parallel sub-agents at each dependency-safe stage and the platform sequence
  defined in project configuration. Use when the developer asks to approve-plan,
  invokes /approve-plan, or asks to approve a plan and start implementation.
---

# approve-plan

Approve a root overview plan and begin implementation, using parallel
sub-agents at each dependency-safe stage and the platform sequence configured
in `project/workflows.json` and `project/repositories.json`.

## Usage

Use this skill for any of these forms:

```txt
$approve-plan <plan-id>
approve-plan <plan-id>
/approve-plan <plan-id>
```

If the client intercepts slash commands, use `$approve-plan` or `approve-plan`
instead.

## Required Behavior

1. Find the matching root plan in `plans/`.
2. Confirm the plan links to an approved PRD.
3. Read `project/repositories.json`, `project/workflows.json`, and `project/PROJECT.md` to identify configured repositories, platform tags, implementation stages, and agent guides.
4. Confirm required submodule plans exist for every affected repository listed in the root plan (stored under each repository's configured `artifactDirectories.plans`).
5. Read the root plan `Research sources` and `Research Inputs`, then read any
   linked research briefs that materially affect implementation. Carry the
   relevant findings into each platform implementation step.
6. Check the root plan and any linked submodule plans for open questions (specifically under `Open Questions` or unresolved technical planning decisions).
7. If the root plan or linked submodule plans have open questions, resolve them
   before approval:
   - In manual mode, follow `griling-plan` (`.agents/skills/griling-plan/SKILL.md`)
     and wait for the developer's answers.
   - In auto mode, resolve agent-answerable questions from the approved PRD,
     research, design, and plans. Ask only human-only questions and wait for
     those answers.
   - Update the affected plans. Do not approve or implement while a
     decision-critical question remains open.
8. Update root plan metadata:
   - `Status`: `approved`
   - `Approved on`: current date
   - `Approval command`: `$approve-plan <plan-id>`
   - In auto mode, record `Approved by: auto-mode (developer-enabled)` and
     `Approval command: $auto-mode on`.
9. Implement in dependency-safe stages according to `project/workflows.json`. Before each stage, assess the remaining affected repositories/platforms and decide which can run in parallel.
   Re-run this assessment every time a stage completes, because newly implemented contracts, APIs, generated outputs, or migrations may unblock later parallel work. For example, implement shared/core contracts first when other platforms depend on them; after shared validation passes, reassess whether frontend platforms can run in parallel.
10. Parallel implementation for a stage is allowed only when every platform in that stage can be implemented against stable contracts and disjoint file ownership without requiring another platform's unimplemented local changes. Treat a platform as not ready for the current parallel stage when:
    - It depends on new or changed shared contracts from repositories tagged as `shared` or `core` that are not already implemented and available locally.
    - It depends on API behavior, generated types, migrations, assets, or package outputs that another repository must implement first.
    - Two platforms need to edit the same files, shared package metadata, workspace configuration, deployment configuration, or generated artifacts.
    - The root or submodule plans define an explicit sequence, blocker, rollout order, or validation dependency.
11. When two or more remaining platforms are ready for the same parallel-safe stage, spawn one sub-agent per ready platform to implement them in parallel:
    - Give each sub-agent the approved root plan path, root plan ID, PRD path, linked research inputs, its submodule plan path, responsibility summary, exact allowed file scope, validation commands from `project/repositories.json`, and relevant dependency assumptions.
    - Instruct each sub-agent to read and follow the local agent setup file defined by `agentGuide` in `project/repositories.json` for its assigned repository before editing. Also require it to discover local `SKILL.md` files under the assigned repository's `.agents/skills/` and `.codex/skills/`, read every skill relevant to its assigned work or named by the developer or agent guide, and apply those instructions before editing. Reading the agent guide alone does not satisfy this step.
    - Instruct each sub-agent to adopt the role required for its platform work (e.g. `roles/backend-developer.md` for API/backend service work, `roles/frontend-developer.md` for frontend work).
    - Instruct dependent sub-agents to import and use shared contracts from the designated shared/core repositories; do not redefine shared contracts outside the core/shared implementation.
    - Instruct every sub-agent to edit only its assigned files, preserve user changes, run the validation commands owned by its repository from `project/repositories.json`, and not commit changes.
    - In auto mode, instruct each implementation sub-agent to return applicable verified facts from `templates/auto-mode-completion-summary-template.md`, including developer setup actions, breaking changes, and validation limits. The coordinator publishes the consolidated final summary.
    - After sub-agents finish, review their changes and validation results together. Reconcile any integration conflicts, then re-run the parallel-safety assessment for the remaining work before continuing.
12. When only one platform is ready for the current stage, or the remaining work is not parallel-safe yet, implement the next unblocked platform following the stage sequence configured in `project/workflows.json`:
    - Before editing in that repository, read its configured `agentGuide`; discover local `SKILL.md` files under `.agents/skills/` and `.codex/skills/`; then read and apply every skill relevant to the work or named by the developer or agent guide. If no local skill applies, continue under the agent guide and approved plan.
    - Before implementing shared/core work, ensure shared contracts and types are implemented and validated first.
    - Before implementing backend/service work, read and adopt `roles/backend-developer.md`. Modify only files in backend repositories, importing shared contracts from shared repositories.
    - Before implementing frontend work, read and adopt `roles/frontend-developer.md`. Modify only files in frontend repositories, importing shared contracts and using backend APIs.
13. After each serial platform stage or parallel sub-agent stage finishes, validate the changed repositories using their `validation` commands from `project/repositories.json`, then decide whether any remaining platforms are now parallel-safe. If so, continue with a parallel stage. If not, continue with the next unblocked serial platform.
14. After finishing one stage, ask the developer whether to continue in manual
    mode. In auto mode, continue to the next ready stage after validation passes.
15. If the next stage depends on newly changed local packages or APIs, ask the
    developer whether to use local or published dependencies in manual mode. In
    auto mode, use validated local code when available; ask only if the choice
    cannot be inferred or changes product or rollout intent.
16. Do not commit changes.

## Output

Report the approved plan path, the current implementation stage, whether that stage is parallel-safe, the sub-agents spawned or next serial implementation platform, and any dependency choice the developer must make before continuing.
