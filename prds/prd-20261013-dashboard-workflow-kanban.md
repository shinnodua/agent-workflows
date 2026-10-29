# Product Requirements Document: Dashboard Workflow Kanban

## Metadata

- PRD ID: `PRD-20261013-dashboard-workflow-kanban`
- Title: `Dashboard workflow Kanban`
- Type: `prd`
- Status: `draft`
- Created: `2026-10-13`
- Last updated: `2026-10-13`
- Owner: `project-manager`
- Related artifact IDs: `[RESEARCH-20261013-dashboard-workflow-kanban]`
- Source request: `Improve dashboard, display the task list and its status as a Kanban board. Use workflow columns; cards are draggable and must follow workflow rules.`
- Research sources:
  - `RESEARCH-20261013-dashboard-workflow-kanban`: [Dashboard workflow Kanban](../research/research-20261013-dashboard-workflow-kanban.md) — current task grouping, workflow gates, evidence limitations, and drag-action choices.

## Problem

The dashboard displays task cards but does not organize them by workflow progress. Developers must inspect several documents to determine where a task stands and what is required next. A draggable workflow board should make progress visible and support valid next actions without bypassing workspace rules.

## Research Context

- Research brief: `RESEARCH-20261013-dashboard-workflow-kanban`.
- Key findings used:
  - Related artifacts already form task groups and open in a document viewer.
  - Approval status and task completion are different concepts.
  - The workflow includes research, PRD, applicable design, review, approvals, planning, implementation, and validation.
  - Manual and auto modes differ in which stages are mandatory.
  - Search must not hide evidence used to determine task progress.
- Confirmed decision: a valid drop starts the corresponding agent workflow to create artifacts, review, approve, or implement.
- Source gaps: the requested continuation scope remains unresolved; availability of a supported local agent execution capability must be checked during planning.

## Goals

- Show each task's current workflow stage and status at a glance.
- Let developers drag tasks through permitted workflow paths.
- Explain prerequisites, blockers, approval gates, and the next required action.
- Keep task progress consistent with source artifacts and actual work evidence.

## Non-Goals

- Redefining workspace workflow or approval policy.
- Treating dragging as proof that research, design, implementation, or validation happened.
- Creating a separate product task-management service.
- Committing, pushing, publishing, deploying, or changing production configuration.
- Editing unrelated dashboard views or product submodules.
- Arbitrary backward moves, deletion, or discarding completed work; rework requires a defined workflow action rather than a cosmetic move.

## Users And Use Cases

- Developer: see which tasks need attention and advance a task when prerequisites are satisfied.
- Workspace coordinator: track related artifacts across repositories without duplicate cards.
- Reviewer: open the evidence behind a task's placement and understand blocked transitions.

User stories:

- As a developer, I want task cards grouped by workflow stage so I can locate active work quickly.
- As a developer, I want valid destinations highlighted during dragging so I know where a task can move.
- As a reviewer, I want invalid moves explained so I can resolve the missing requirement.
- As a keyboard or touch user, I want an equivalent move action without relying on pointer dragging.

## Requirements

Functional requirements:

- R1. Display ordered columns: Research, PRD, Design, Planning, Implementation, Validation, Complete. Use this as the primary task overview while retaining document access and other dashboard views.
- R2. Display one card per related task, with title, task identifier, stage, status, source repositories, latest update, and access to related artifacts.
- R3. Keep task stage distinct from artifact statuses. Show blocked, awaiting review, awaiting approval, and uncertain progress on the card within its current stage.
- R4. Determine progress from the entire task's related artifacts and recorded work evidence. Search narrows visible tasks without altering their grouping, stage, or move eligibility.
- R5. Support pointer dragging and an equivalent accessible move action. Highlight allowed destinations and explain unavailable destinations. A failed or rejected move leaves the task in its original stage.
- R6. Validate prerequisites when the move is requested and again before recording any change. Forward movement follows the applicable workflow path; skips are allowed only when workspace rules permit a stage to be optional or not applicable.
- R7. Research is mandatory in auto mode and optional in manual mode. Missing required research blocks dependent progression.
- R8. Planning requires an approved PRD. In auto mode, applicable design and sprint review must be complete before PRD approval. Manual-mode optional stages must remain optional. Expose these gates even though review and approval do not have separate board columns.
- R9. Implementation requires an approved root plan and the required linked repository plans. Respect dependency order for affected implementation stages. Root-dashboard tasks must not require plans for unrelated example repositories.
- R10. Validation requires recorded implementation work. Complete requires recorded completion and successful applicable validation; approval or evidence-heading text alone does not establish completion.
- R11. Persist successful actions to the owning workspace artifacts and make the result consistent after refresh. Preserve artifact IDs, relationships, unrelated content, and concurrent edits. Never mark every related artifact with one blanket status.
- R12. Missing, legacy, unavailable, or contradictory evidence must be visible. Uncertain tasks remain discoverable in a clearly labeled unresolved-progress area until stage placement can be established; they must not appear Complete by default.
- R13. A valid drop starts the corresponding agent workflow to create artifacts, review, approve, plan, implement, or validate. Missing entry prerequisites block launch with a specific explanation; starting a workflow does not count as completing it. A task can enter an active stage when its entry prerequisites are met and remains there until its exit requirements are fulfilled.
- R14. Respect actual workspace mode and approval authority. An unsupported drop cannot silently enable auto mode, manufacture approval, or perform an excluded operation.
- R15. Show queued, running, awaiting developer input or approval, failed, and completed execution states with access to progress and results. Auto-mode runs follow mandatory stages and existing internal approval authority. Manual-mode runs stop for required developer approvals.
- R16. Prevent duplicate task runs from repeated drops or refreshes. Reconnect to an existing active run rather than launching another. Offer a stop action when supported, preserve work already produced, and require explicit retry after failure.
- R17. If the supported agent execution capability is unavailable, explain how to make it available and keep the drop disabled. Do not simulate execution or mark the stage complete.

Non-functional requirements:

- Status and eligibility must remain consistent across board navigation, search, and refresh.
- Preserve existing document navigation and source links.
- Support keyboard focus, screen-reader status announcements, non-color status cues, and usable touch controls.
- Keep narrow-screen navigation usable with readable cards and reachable columns.
- Restrict mutations to task-owned artifacts in the current workspace and expose write failures without losing user context.

## User Flows

1. Open the dashboard task overview and scan workflow columns and counts.
2. Find a task by title, identifier, or repository and inspect its status and prerequisites.
3. Open related documents when reviewing evidence.
4. Drag the card or choose its accessible move action.
5. The board shows permitted destinations and reasons for blocked paths.
6. Drop into a permitted destination; validate the task against current workspace rules and source evidence.
7. Start the corresponding agent workflow, show its running state, and provide access to progress and any required developer input.
8. Reflect the authoritative active stage and generated artifacts. Advance beyond it only after required work and approval gates are satisfied. On failure, retain the last evidenced stage and expose results and retry guidance.

## Affected Platforms

- Root workspace local dashboard: task overview, progress presentation, and workflow move interactions.
- No configured product submodule is affected. `project/repositories.json` contains example repositories; dashboard ownership is explicitly assigned to the root by the workspace guide.

## Data, API, And Package Contracts

- Shared types or packages: preserve existing artifact identity and relationship semantics; no product-package contract change requested.
- API endpoints: no product API changes requested. Agent workflows must operate against the current local workspace.
- Events or runtime interfaces: workflow launch, progress, approval needs, stop requests, and results must remain attributable to the task and survive dashboard refresh. Planning must verify a supported execution capability.
- Compatibility requirements: maintain existing artifact metadata, manual-mode behavior, auto-mode authority, and document navigation. Legacy artifacts remain readable; unsupported transitions explain their prerequisites.

## UX Notes

- Keep column titles and counts visible and show explicit empty-column states.
- Make task stage, status, approval needs, and blockers independently understandable.
- Avoid accidental moves when opening an artifact link on a card.
- Show loading, pending mutation, stale-data, write-failure, and no-search-results states.
- Do not offer an apparently enabled action that the dashboard cannot perform.
- Present applicable skips as explicit valid paths; do not require fake design or research artifacts for optional stages.

## Acceptance Criteria

- AC1. The task overview shows the seven ordered workflow columns and one card per grouped task, plus an explicit area for unresolved progress.
- AC2. Card stage and eligibility are unchanged when a search matches only one related artifact.
- AC3. A move to Planning is rejected when the PRD is unapproved, with a specific approval requirement shown.
- AC4. A move to Implementation is rejected when the root plan or required repository plans lack prerequisites or approval.
- AC5. Auto-mode required research, applicable design, and sprint review cannot be bypassed; manual-mode optional stages can be skipped according to existing rules.
- AC6. A task cannot enter Complete solely because an artifact is approved or contains implementation/validation headings.
- AC7. A supported successful move survives refresh and preserves unrelated metadata and document content.
- AC8. A stale or failed move leaves authoritative source files and the visible stage consistent and provides a recovery action.
- AC9. Keyboard and touch users can invoke the same permitted moves and receive the same rejection reasons as pointer users.
- AC10. Existing artifact viewing and other dashboard views remain available.
- AC11. Missing or contradictory evidence produces explicit uncertainty without losing the task from the board.
- AC12. A valid drop starts the corresponding agent workflow and displays progress; it does not fabricate completion or directly assign all artifact statuses.
- AC13. Manual-mode approval gates wait for developer approval; auto-mode approval uses recorded existing authority after required design and review stages.
- AC14. Repeated drops and refreshes do not create duplicate active task runs. Failed or stopped runs retain produced work and show the last evidenced stage.
- AC15. An unavailable agent execution capability produces a clear disabled state rather than an apparently successful drop.

## Risks And Tradeoffs

- Draggable cards start agent work: show the action and stage prerequisites before a drop and distinguish running work from completed work.
- Workflow columns hide intermediate gates: show review, meeting, and approval requirements on cards and transition feedback.
- Legacy status and text-based evidence can overstate progress: require authoritative evidence and expose uncertainty.
- Concurrent agent work can invalidate a drop: recheck current state and preserve source edits.
- Agent execution requires a supported local runner: verify availability and task progress tracking before approving an implementation plan.

## Open Questions

- Q1. Does this request stop at the draft PRD, or continue through the enabled auto-mode design, review, planning, and implementation stages? The developer has not answered the scope question yet.

## Design Artifacts

- None yet. UI/UX design follows resolution of continuation scope.

## Approval

- Approved by: `Pending`
- Approved on: `Pending`
- Approval command: `$approve-prd PRD-20261013-dashboard-workflow-kanban`
