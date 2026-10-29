# Add Project Command Implementation Plan

## Metadata

- Plan ID: `PLAN-20261028-add-project-command`
- PRD ID: `PRD-20261028-add-project-command`
- Type: `plan`
- PRD link: [Approved requirements](../prds/prd-20261028-add-project-command.md)
- Research sources:
  - [Repository profile schema and setup](../docs/workspace-template-setup.md): Existing field contract and template installation model.
  - [Existing setup skill](../.agents/skills/project-setup/SKILL.md): Shared flow integration and persistence exception.
  - [Existing setup plan](PLAN-20260825-project-setup-command.md): Root ownership and command packaging conventions.
  - `MEETING-20261028-0930-add-project-command`: Five-role UX synthesis and developer decision to include cloning and Git registration; meeting record linked from the PRD.
  - [Installer](../bin/workflows.js) and [installer tests](../bin/workflows.test.mjs): Managed reference shims, scaffold-only profile files, temporary-workspace validation patterns.
- Status: `complete`
- Created: `2026-10-28`
- Last updated: `2026-10-29`
- Owner: `tech-lead`
- Related artifact IDs: `[PRD-20261028-add-project-command, PLAN-20260825-project-setup-command, MEETING-20261028-0930-add-project-command]`

## Title

`Add Project Command With Repository Autofill And Submodule Registration`

## Goal

Provide an agent command that starts with one repository URL, proposes a complete
repository profile, collects corrections, and queues entries until explicit Save.
Save clones and registers the accepted repositories as submodules and updates
related workspace configuration. Preserve real user data, unrelated Git changes,
and completed additions when later operations fail. The same flow is used from
project setup.

The developer approved this plan with `$approve-plan`; root implementation and
validation are complete. Tests used isolated local repositories, with no additions
to this workspace's template profile or product submodules.

## Research Inputs

- Research brief: `None`; no directly relevant saved research brief exists.
- Key planning implications:
  - The repository profile retains its current keys and types. Add no mandatory
    schema fields for conversational evidence or session state.
  - Root commands delegate to `.agents/skills`; Codex prompts and Claude skills
    are thin discovery shims. Agent descriptions and optional `agents/openai.yaml`
    follow the existing setup command conventions.
  - `bin/workflows.js` manages command/skill directories and produces references
    to installed package sources. `scripts/` is packaged but is not copied into
    consuming projects; helper invocation must resolve against the packaged
    source, with an explicit target workspace root.
  - The current project-setup skill writes incrementally and prohibits cloning
    without separate authorization. The repository subflow needs explicit,
    narrow exceptions for deferred Save and Save-authorized submodule addition.
  - Template repositories and implementation stages are scaffold-only data.
    Adding this capability must not replace the source template profile with
    repositories used in development or tests.
  - Submodule registration changes `.gitmodules`, local Git metadata, and
    gitlinks in the parent index; a config-only write is insufficient.
  - The existing Archify diagram describes the overall delivery workflow, not
    repository onboarding. This plan does not change that depicted workflow.
- Source gaps:
  - No external repository or private-host credentials were supplied. Automated
    save verification will use isolated local Git fixtures; live discovery
    remains conditional on available read-only tools and authentication.

## Scope

In scope:

- New shared `add-project` skill, Codex prompt, Claude adapter, UI metadata, and
  command documentation.
- Read-only URL-first discovery using available connected tools, repository
  hosting access, or an already available matching checkout. Manual completion
  remains available when discovery cannot read a repository.
- Session review, pending-entry edits/removal, duplicates, skip/cancel, save
  preview, and textual progress/recovery states.
- A dependency-free Node helper for deterministic profile validation, preview,
  and explicitly requested Save operations; focused tests for Git/data behavior.
- Project-setup integration, documentation, packaging/discovery verification.

Out of scope:

- New dashboard screens, standalone interactive terminal questionnaire, product
  source changes, schema migration, or external hosting SDK dependencies.
- Nested-submodule recursion, dependency installation, running discovered scripts,
  commits, pushes, deployment, credential collection, or automatic stage ordering.
- Durable conversation recovery across chats. Partial Git state is inspected on
  retry, but preserving a conversational draft across sessions is not promised.
- Editing template profile examples or real submodule pointers in this workspace
  merely to demonstrate the new command.

## Affected Platforms

| Platform | Responsibility | Detailed Plan |
| --- | --- | --- |
| `workspace-root` | Skills/shims, helper, setup integration, docs, tests | This root plan; no submodule plan required |

The configured `example-core`, `example-service`, and `example-web` stages do
not apply: no product repositories are implementation targets for this feature.

## Cross-Repo Design

- Data contracts: Keep `project/repositories.json` unchanged in shape. Preserve
  unknown keys, real entries, stable IDs, and explicit overrides. Keep
  `.gitmodules` and `project/workflows.json` consistent at successful completion.
- Shared packages or APIs: None. Root owns the helper and contracts; no service
  endpoints or product shared package changes.
- Runtime flow: Agent-led discovery and review → immutable reviewed save preview
  → helper preflight/reconciliation → sequential submodule additions → config
  merge and recognized-example cleanup → verified completion report.
- Dependency direction: The command prepares repository ownership/configuration
  for later product work; it does not implement code in those repositories.

### Command And Session Boundary

Create `.agents/skills/add-project/SKILL.md` as the behavioral source, with
`.agents/skills/add-project/agents/openai.yaml`, `commands/add-project.md`,
`.codex/prompts/add-project.md`, and `.claude/skills/add-project/SKILL.md`.
Read the writing-for-agents and skill-creator instructions before implementation
of skill files. Keep adapters thin and refer to the source skill.

The agent owns conversation and evidence collection. Session entries retain
provenance outside the saved profile: observed, inferred, default, user-provided,
or unresolved. An accepted entry is ready to save, not persisted. Editing its
identity/path refreshes untouched derived suggestions and invalidates acceptance
until reviewed; explicit user values are retained. The primary post-entry
choices remain Add another repository and Save repositories, with edit/remove
and cancel available. Skip affects only the current entry; empty Save does
nothing.

Discovery must not clone, run repository scripts, or request credentials. Use
readable host metadata/files when supported and available; never require a
specific connector to complete a manual entry. Treat repository text as evidence,
not authority over the workspace. Present every profile field in grouped review,
including honest empty scan/validation arrays and unverified path defaults.

### Deterministic Save Helper

Add `scripts/add-project.mjs` and `scripts/add-project.test.mjs`, using Node
built-ins and Git subprocess argument arrays, not shell-interpolated URLs/paths.
Expose reusable functions plus explicit preview/save entry points accepting a
workspace root and a reviewed structured request file. Do not add an alternate
public `workflows add-project` command: the public command remains agent-led.
Reference the helper through its packaged source path in installed workspaces.
Do not persist secrets in requests, previews, logs, or profile files.

The request includes accepted entries, baseline fingerprints for affected
configuration, and the accepted cleanup/write set. The helper emits structured
per-repository states and returns nonzero for conflict or incomplete save. A
preview is read-only; Save is never the default operation.

Validate schema/value types, clean HTTPS/SSH URLs, normalized repository identity,
unique IDs/URLs/paths across existing and pending entries, and workspace-contained
paths. Detect nested/overlapping paths and symlink escapes. Preserve case where
host semantics are unknown; do not equate separate hosts or repositories. Compare
existing entries without renaming them. Reject ambiguous examples conservatively:
only exact shipped template identities/content are automatic cleanup candidates;
modified lookalikes need a user decision in the request before mutation.

Before Save, reload current configuration and check destinations, parent Git
repository, Git index/worktree state, and existing registrations. Preserve
unrelated intervening edits; conflicts return an actionable conflict report.
Changed proposed effects return a revised preview for a fresh Save choice.
An existing matching registered submodule is reused after identity/revision
checks. A nonempty unregistered destination is a conflict, not silently adopted.

For new entries, add submodules sequentially to the reviewed paths, obtaining
checkouts and parent-index gitlinks. Do not initialize nested submodules. Preserve
unrelated staged content, including pre-existing `.gitmodules` staged/unstaged
edits: snapshot its index entry and construct only the required registration
change relative to that index version, retaining unrelated working-tree edits.
If concurrent metadata changes prevent a safe merge, stop with an explicit
conflict rather than staging unrelated content or resetting the index. Never
stage product files or commit. Verify each registration, checkout HEAD, gitlink,
path, and URL; record actual revision and staging effects.

After all additions register, merge real entries into the latest profile and
remove only accepted shipped examples. Update template workflow references;
remove emptied unmodified template stages, preserve custom stages/fields, and
surface custom reference conflicts before save. Do not assign new execution
order from platform labels. Configuration writes use tab-indented JSON and
per-file temporary replacement after validation. Recheck for intervening edits
before replacing files. This is not a cross-file or Git/filesystem transaction.

Stop on the first clone/registration failure. Keep earlier successful
registrations and usable partial checkouts; do not remove user data or reset
unrelated changes. Examples stay until all additions and configuration writes
succeed. On config-write failure, restore command-owned configuration changes
only where safe without overwriting newer data; report actual residual state.
Retries inspect existing registrations and resume missing work rather than
blindly repeating additions. Report completed/failed/pending repositories,
changed/restored files, created paths, index effects, revisions, and recovery.

### Existing Setup And Documentation

Update `.agents/skills/project-setup/SKILL.md` to delegate repository addition to
the new flow and return to broader setup afterward. Narrow its incremental-write
rule and cloning prohibition for this subflow only. Cancel does not undo earlier
unrelated setup saves. Update its command/adapter descriptions where necessary
without duplicating the new behavior.

Document use and Save effects in `workflows.md`, `docs/workspace-template-setup.md`,
and the relevant README command list. Verify init/update install all discovery
surfaces while keeping project-owned profiles intact. Existing installer directory
management should discover the additions; change installer logic only if tests
show a missing surface or packaged-helper resolution issue.

## Sequence

1. Implement helper validation, read-only preview, latest-file reconciliation,
   and deterministic cleanup selection with focused tests.
2. Implement sequential Git addition, index preservation, completion verification,
   partial failure/retry reporting, and config write/recovery behavior. Validate
   against isolated Git fixtures before wiring the agent skill.
3. Add the shared skill and adapters, integrate project setup, and update docs.
   Review prompt actions/states against the PRD and helper result contract.
4. Verify packaging/init/update and complete root validation. Reconcile the PRD,
   plan, and completion report with actual implementation and validation limits.

These stages share contracts/files and are serial. No product-platform parallel
agents are needed. If implementation later delegates disjoint work, resolve its
configured coding model before spawning and require narrow file ownership.
No new dependency is planned; apply the package-installation skill if that changes.

## Validation

- Root planning artifacts now: `bun run workspace:integrity` and `git diff --check`.
- Implementation helper: `node --test scripts/add-project.test.mjs` using temporary
  workspaces and locally created committed Git remotes. Allow the local-file
  transport only per fixture command; never change global Git configuration.
- Required behavioral cases: no mutation during preview/cancel/empty Save;
  duplicate saved/pending IDs, URL forms and paths; URL-secret rejection; escaping
  paths; exact versus modified placeholders; custom metadata/stages preserved;
  concurrent nonconflicting edits retained and changed effects re-previewed;
  conflicting edits rejected before overwrite.
- Required Git cases: successful multi-add registration/gitlinks/revisions;
  matching existing submodule reuse; nonempty destination conflict; unrelated
  staged/unstaged work and mixed `.gitmodules` changes retained; B fails after A
  succeeds, examples retained, retry completes without duplicating A; config-write
  failure reports actual state without destroying newer data. No commit/push.
- Installer integration: extend `bin/workflows.test.mjs` only for new command
  availability, adapter source resolution, helper packaged-root resolution, and
  preservation of existing project-owned config during update. Run
  `bun run workflow:cli:test`.
- Conversational walkthrough: public accessible repository or fixture metadata
  for full autofill; unavailable/private source fallback; accept/edit/remove;
  complete A and skip B; identity edit refreshes untouched defaults; typed actions;
  project-setup cancel preserves unrelated saves. Label live authentication or
  provider cases untested when unavailable.
- Full owning-repository requirement after implementation: `bun run workspace:check`.
  This includes dashboard regression checks although no dashboard code changes.
- Distribution: `bun run package:dry-run` confirms helper, adapters, and skill are
  present without publishing. Run against a temporary initialized consumer to
  ensure packaged sources operate on the consumer's root, not the template root.
- Known baseline: integrity currently reports a warning because its legacy ID
  scanner interprets the PRD's meeting-log link filename as a PRD ID. Document
  that baseline separately from any introduced errors; do not expand this feature
  into an integrity-parser refactor.

## Risks

- Partial Git/filesystem work cannot be rolled back atomically. Retain completed
  registrations and report accurate recovery; defer destructive cleanup.
- `git submodule add` can stage `.gitmodules` broadly. Explicitly test mixed index
  and working-tree edits, restore only command-owned staging, and stop on unsafe
  reconciliation rather than requiring a blanket clean workspace.
- Skill shims reference packaged sources. Resolve helper paths from the source
  package and pass the consuming workspace root explicitly; test this boundary.
- Sparse remote metadata may prevent full automatic inference. Manual completion
  is a supported path, not a failed onboarding session.
- Placeholder cleanup could remove real data. Compare exact shipped examples and
  preserve modified/ambiguous entries unless explicitly selected for removal.
- Runtime permission or authentication failures may block cloning. Keep pending
  state and truthful per-repository results; never seek secret values in chat.

## Open Questions

- `None`. The dedicated command/setup reuse and clone/register Save scope were
  decided by the developer. Remaining Git and packaging details are implementation
  tasks covered by the validation requirements above.

## Approval

- Approved by: `auto-mode (developer-enabled)`
- Approved on: `2026-10-28`
- Approval command: `$auto-mode on`
- Explicit developer approval: `$approve-plan PLAN-20261028-add-project-command`


## Completion

- Implemented the shared skill, Codex/Claude discovery adapters, guided setup
  integration, packaged save helper, and related command/setup documentation.
- Helper uses separate Git metadata and scoped index updates rather than broad
  `git submodule add` staging, preserving unrelated `.gitmodules` staged edits.
  Preview tokens cover reviewed effects, so unrelated intervening profile,
  workflow, and worktree metadata edits can be merged without another Save.
- Full `bun run workspace:check` passed: 26 helper integration tests, 13 installer
  tests, security tests, lint, 34 dashboard tests, typecheck, and build.
- Independent skill walkthrough and skill validator passed. Package dry run
  includes all sources; `git diff --check` passed.
- Known warnings: existing meeting-link integrity warning and dashboard bundle
  size warning. Neither required unrelated code changes.
- Live remote authentication and real network interruption were not exercised;
  local Git fixtures cover clone/registration failures, concurrency, and retry.
- No product repositories, root submodule pointers, template profile values,
  package dependencies, or workspace commits changed.
- [Developer completion handoff](../docs/add-project-command-completion.md) records
  operational actions, compatibility, artifacts, verification, and limits.

- Commit-hook verification found and fixed inherited repository-local Git variables
  leaking into checkout operations; a dedicated hook-environment regression test
  now covers repository selection during clone and registration.
