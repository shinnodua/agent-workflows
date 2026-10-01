# Auto Mode Completion Handoff PRD

## Metadata

- PRD ID: `PRD-20261001-auto-mode-completion-handoff`
- Title: `Auto Mode Completion Handoff`
- Type: `prd`
- Status: `approved`
- Created: `2026-10-01`
- Last updated: `2026-10-01`
- Owner: `project-manager`
- Related artifact IDs: `[RESEARCH-20261001-auto-mode-completion-handoff, MEETING-20261001-1540-auto-mode-completion-handoff, PLAN-20261001-auto-mode-completion-handoff]`
- Source request: `Create a summary template all coding agents follow after implementation in auto mode; include developer actions, build-service environment, runtime setup, and breaking changes.`
- Research sources:
  - `RESEARCH-20261001-auto-mode-completion-handoff`: [Auto Mode Completion Handoff Research](../research/research-20261001-auto-mode-completion-handoff.md) - Existing handoff instructions lack concrete setup requirements.

## Problem

An auto-mode implementation can validate locally yet leave a developer without the environment, build-service, migration, and compatibility steps needed to build and run the changed product.

## Research Context

- Research brief: `RESEARCH-20261001-auto-mode-completion-handoff`
- Key findings used:
  - Auto mode has a short final-output contract but no shared completion template.
  - Implementation role guidance does not require complete build and runtime setup details.
- Source gaps:
  - None.

## Goals

- Give every auto-mode coding agent a common completion summary format.
- Make the final report explain exact developer actions needed for successful source builds and affected app, web, and API operation.
- Surface breaking changes, migrations, and validation limits clearly.

## Non-Goals

- Automatically modify a build service, secrets, deployment, or production configuration.
- Force irrelevant platform sections into every summary.

## Users And Use Cases

- User: `developer`
- Use case: `After implementation, identify exact configuration and rollout actions without searching code diffs.`
- User: `implementation agent or coordinator`
- Use case: `Collect repository-specific facts and produce one consolidated auto-mode handoff.`

## Requirements

Functional requirements:

- A reusable Markdown completion template must cover implemented changes, changed repositories, validation, breaking changes, developer actions, build-time environment, build-service configuration, runtime environment, migrations, and app/web/API operational needs.
- Preserve the example report's artifact status, per-repository implementation, validation result, and human-only question sections alongside the added operational handoff.
- Auto-mode instructions must require the template after coding and validation, including serial and delegated implementation.
- Each coding agent must report verified, applicable facts for its repository: exact variable or config names, target environment or service, expected value shape or source, applicable build/runtime stage, and validation evidence. Agents must not expose secret values.
- Required actions must be ordered and distinguish actions needed to build, to run, and to deploy or roll out. Backend changes must include migration command and order, backfill, downtime, rollback, service dependencies, and API compatibility when applicable.
- Configuration entries must distinguish build-time injection from runtime settings, identify target service and environment, state whether a value is client-visible, and say whether changing it requires a rebuild. Changed APIs must identify compatibility with deployed app versions and cached web clients when relevant.
- Use `None` only after checking that a category is inapplicable. If an external setting is unverified, state `Unknown`, the missing fact, and who can provide it.
- The coordinator must merge repository findings into one final report, reconcile duplicate or conflicting configuration and setup order, and report unresolved facts, validation limits, and deployment limits.

Non-functional requirements:

- The template must remain concise enough for a final chat summary and work across projects with different repository layouts.
- Existing manual-mode reporting remains available.

## User Flows

1. The developer requests implementation with auto mode enabled.
2. Each coding agent implements and validates its assigned repository, then fills the template with verified facts.
3. The coordinator reconciles dependencies, breaking changes, and setup across repositories.
4. The developer receives a final summary with ordered actions and validation evidence.

## Affected Platforms

- `root workspace`: Reusable template and agent instructions.

## Data, API, And Package Contracts

- Shared types or packages: None.
- API endpoints: None.
- Events or runtime interfaces: Markdown instruction contract for agent completion summaries.
- Compatibility requirements: No change to product APIs or existing manual mode.

## UX Notes

Lead with an ordered Developer actions checklist grouped by Build, Run, and Roll out. Name the affected repository or service, exact setting or command, and destination for each action. Follow with breaking changes, validation evidence, and limits. Show only relevant app, web, and API details. Make `None` and `Unknown` distinct.

## Acceptance Criteria

- A packaged template exists and is linked from the auto-mode skill.
- The template includes artifact IDs and statuses, implementation details by repository, validation evidence, and human-only questions as well as developer setup and breaking-change sections.
- Instructions require every coding agent to return repository-specific completion facts and the coordinator to publish a consolidated report.
- The report includes exact build and runtime configuration steps, build-service environment settings, breaking changes, migrations, developer actions, validation, and limits when applicable.
- Relevant backend handoffs cover migration and service startup order; relevant frontend handoffs cover build-time versus runtime settings and client compatibility.
- Missing facts are called out with an owner instead of guessed; secrets are never printed. `None` means verified absence.
- A developer can identify the next required step for each affected repository without reading the diff.
- Root validation passes.

## Risks And Tradeoffs

- Generic fields may be overfilled with guesses; require evidence and explicit unknowns.

## Open Questions

- None.

## Design Artifacts

- None: This changes agent handoff documentation and has no user-facing product screen.

## Approval

- Approved by: `auto-mode (developer-enabled)`
- Approved on: `2026-10-01`
- Approval command: `$auto-mode on`
