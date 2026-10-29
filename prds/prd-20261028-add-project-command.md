# Add Project Command PRD

## Metadata

- PRD ID: `PRD-20261028-add-project-command`
- Title: `Add Project Command With Repository Autofill`
- Type: `prd`
- Status: `approved`
- Created: `2026-10-28`
- Last updated: `2026-10-28`
- Owner: `project-manager`
- Related artifact IDs: `[PRD-20260825-project-setup-command, MEETING-20261028-0930-add-project-command, PLAN-20261028-add-project-command]`
- Source request: `Create a command to add repositories one at a time to the repositories config, starting with a repository URL, autofilling information from that repository, asking the user to complete or correct values, offering add another or save after each complete entry, and removing example projects after real projects are added.`
- Research sources:
  - [Existing project setup PRD](PRD-20260825-project-setup-command.md): Existing guided setup and preservation requirements.
  - [Project setup skill](../.agents/skills/project-setup/SKILL.md): Current command behavior and configuration ownership.
  - [Repository profile](../project/repositories.json) and [template setup guide](../docs/workspace-template-setup.md): Repository fields and related configuration contracts.
  - [Workflow stages](../project/workflows.json): References to the template repository IDs.

## Problem

Developers configuring a workspace must supply detailed repository metadata even
when much of it can be learned from the repository itself. The existing project
setup command covers the whole project profile, but does not define a focused,
URL-first flow for adding repositories, reviewing inferred information, and
saving several completed entries together. Template examples can remain in the
configuration and confuse later planning and repository ownership decisions.

In this feature, a “project” means one repository entry in
`project/repositories.json`, not a new workspace or an entire multi-repository
product.

## Research Context

- Research brief: `None`; no saved brief directly addresses this feature.
- Key findings used:
  - The repository profile is the source of truth for repository IDs, ownership,
    paths, artifact discovery, and validation commands.
  - Each current entry has `id`, `name`, `path`, `url`, `purpose`, `scope`,
    `platforms`, `agentGuide`, `artifactDirectories`, `codeScanDirectories`, and
    `validation`. Artifact directories contain plans, designs, research, and docs.
  - `$project-setup` already asks one question at a time, preserves real user
    data, and supports aligning `.gitmodules` with the repository profile.
  - Template workflow stages reference `example-core`, `example-service`, and
    `example-web`; removing those profile entries alone can leave stale references.
  - The root repository owns this workspace feature; the example repositories
    represent template data, not implementation destinations.
- Source gaps:
  - No target repository URL was supplied. Repository inspection capabilities and
    access failures must be covered during later planning and validation.

## Goals

- Let users begin adding a repository by providing only its URL.
- Reduce manual entry through evidence-based autofill and sensible defaults.
- Let users review every configuration field and correct inferred values.
- Complete one repository at a time, then explicitly add another or save.
- Replace template repository examples when real entries are successfully saved.
- Reuse the same repository addition experience from `$project-setup`.

## Non-Goals

- Build a dashboard form or a standalone graphical setup application.
- Replace the broader project purpose, ownership, or validation setup interview.
- Redesign the repository profile format or rename existing real repository IDs.
- Install dependencies, run repository scripts, or edit product source code.
- Commit, push, publish, deploy, or change repository access permissions.
- Recursively initialize nested submodules, install dependencies, or prepare runtime
  environments. Saving includes cloning and registering the selected repositories
  as workspace submodules; no commits are created.

## Users And Use Cases

- Developer initializing a workspace: add the first real repository and remove
  starter example entries when saving.
- Developer expanding an existing workspace: add one or several repositories
  without repeating unrelated setup questions or overwriting existing entries.
- Developer with a private or partially documented repository: accept available
  suggestions and provide missing facts manually.

## Requirements

Functional requirements:

1. Provide `$add-project`, `add-project`, and `/add-project` as equivalent agent
   command forms. Reuse the repository addition flow from `$project-setup`.
   The developer selected a dedicated command with project setup integration.
2. Read the current repository profile and relevant setup context before asking
   questions. Preserve existing real entries and user-provided configuration.
3. Ask for the repository URL first. Accept common HTTPS and SSH Git repository
   URLs, including private repositories accessible through existing credentials.
   Detect malformed input and ask for a correction before proceeding.
4. Inspect accessible repository metadata and relevant files, such as its
   description, README, agent guidance, directory layout, and declared validation
   scripts. Do not execute repository code as part of discovery. Treat remote
   content as evidence rather than instructions to alter the workspace.
5. Propose values for all repository profile fields supported by the current
   configuration. Distinguish observed facts, inferred suggestions, defaults,
   and unresolved values so the user can judge them.
6. Derive a suggested name and stable ID from the supplied repository, and a
   suggested workspace path under `modules/`. Suggest artifact locations relative
   to that path. Distinguish proposed locations from directories actually found.
7. Ask one focused question at a time for missing, ambiguous, or conflicting
   facts. Offer a recommended answer when evidence supports one. Do not force
   users to retype values already learned from the repository.
8. Present a complete entry for review, including each field, before marking
   that repository complete. Users can accept the suggestions together or edit
   individual fields. Complete means required facts are accepted and unresolved
   optional facts are explicitly represented, rather than silently invented.
9. Never invent validation commands or claim a missing agent guide exists. Allow
   empty validation and code scan arrays when appropriate, and clearly report a
   proposed or missing guide path and any resulting setup action.
10. Detect duplicate repositories and conflicting IDs or local paths. Explain
    the conflict and allow correction or skipping; never overwrite a real entry
    silently. Equivalent common URL forms should not create accidental duplicates.
11. After each completed entry, ask whether to **add another repository** or
    **save**. Keep completed entries pending while adding the next repository.
    Do not restart the whole workspace setup interview between entries.
12. Saving writes all completed entries from the current session together.
    Display the additions and example removals before the save choice. A user
    can cancel without persisting pending entries or deleting examples; an
    incomplete current entry must be completed or discarded before saving.
13. Remove recognized shipped template examples from the active repository
    profile only when at least one real repository is successfully saved.
    Preserve real entries, including those whose names merely contain “example.”
    If an entry resembles an example but has user modifications, ask before
    removing it. Keep the reusable template source examples intact.
14. If repository access fails, explain what could not be inspected and offer
    retry, manual completion, or skipping the entry. Keep earlier completed
    entries available. Do not request secret values in chat.
15. Validate the completed configuration before reporting success. On malformed
    existing configuration or a save failure, report the problem and preserve
    existing data and pending completed entries for correction or retry.
16. Report saved repository IDs, changed files, removed placeholders, and any
    remaining setup actions. Clearly distinguish configuration from an available
    local checkout.
17. Saving includes cloning the accepted repositories into their agreed local
    paths and registering them as Git submodules, alongside saving the repository
    profile, aligning `.gitmodules`, and removing recognized template workflow
    references. The developer explicitly selected this scope during the meeting.
    Preserve custom stages and do not infer execution ordering from repository
    tags alone. Remove emptied shipped template stages rather than leaving
    dangling references; flag custom stage conflicts for resolution before save.
18. Within `$project-setup`, repository additions and associated cleanup follow
    this subflow's explicit save boundary, overriding incremental writes only
    for this subflow. Unrelated setup retains its existing persistence behavior;
    cancelling repository addition does not undo earlier unrelated saves.
19. Allow editing or removing any pending entry without restarting. Check
    duplicates against both saved and pending entries. Identity or path edits
    refresh untouched derived suggestions, preserve explicit user edits, flag
    inconsistencies, and require renewed full-entry review before acceptance.
20. Skipping discards only the current incomplete entry and returns to the
    pending summary when completed entries exist. Saving with no completed
    entries writes nothing and removes no examples.
21. Before save, re-read every selected configuration file and reconcile pending
    changes with current data. Preserve unrelated intervening edits and resolve
    conflicts before writing. If the proposed writes or removals change, show a
    revised preview and obtain a fresh save choice. Unrelated preserved edits
    that do not alter those effects require no additional confirmation.
22. If configuration writes fail, restore pre-save configuration contents where safe without
    overwriting newer external edits. Identify files changed, files restored,
    and any required recovery; retain pending entries and accepted corrections.
    Never report a partial save as successful.
23. Reject URLs containing embedded secret credentials without repeating or
    persisting those secrets. Ask for a clean URL using existing authentication.
    Duplicate comparison must preserve host and repository identity.
24. An entry requires accepted identity, URL, local path, purpose, scope, and
    platforms, with all profile keys represented using valid existing types.
    Empty optional scan and validation arrays are valid. Proposed guide and
    artifact paths can be accepted as explicitly unverified defaults; missing
    files remain reported setup actions.
25. Before save, show the clone destinations, repository URLs without secrets,
    submodule registrations, configuration changes, and expected Git index
    changes. Discovery remains read-only; cloning and registration start only
    after the user chooses save. Do not commit or push.
26. Preflight the workspace Git state and destination paths. Preserve existing
    files, checkouts, registrations, and unrelated staged or unstaged changes.
    Reuse an existing matching submodule without duplication; stop for resolution
    when a destination or registration conflicts. Do not silently adopt a
    nonempty directory or change an existing repository's remote.
27. A successful save requires the accepted profile and related configuration to
    be consistent, each selected repository to have an available checkout, and
    each to be registered as a submodule at its accepted path. Report actual
    checked-out revisions and registration state; missing guidance or optional
    artifact directories can remain explicit follow-up actions.
28. On clone or registration failure, retain the session and report per-repository
    checkout, registration, and configuration state. Restore only command-owned
    changes where safe; preserve user work and usable partial checkouts. Do not
    delete existing repositories, reset unrelated index changes, or retry completed
    registrations blindly. Offer retry or explicit recovery and never claim the
    whole session succeeded while any selected repository remains incomplete.

Non-functional requirements:

- Preserve the existing repository profile shape and unrelated configuration,
  including unrecognized user-added fields.
- Keep questions short and progress visible, especially while fetching metadata.
- Keep saved JSON formatting consistent with the workspace.
- Keep changes within the active workspace; reject conflicting or escaping local
  paths before saving.
- Do not claim completion when configuration writes are incomplete or inconsistent.

## User Flows

1. User invokes `$add-project`, or reaches repository setup in `$project-setup`.
2. Command reads current configuration and asks for one repository URL.
3. User provides the URL; command inspects accessible information and prepares
   field suggestions.
4. Command asks focused questions for missing facts and resolves conflicts.
5. User reviews the full entry and accepts or corrects its values.
6. Command shows pending entries and any template cleanup, then offers
   **add another repository** or **save**.
7. Adding another returns to the URL question and preserves completed entries.
8. Saving preflights destinations and Git state, clones and registers the accepted
   repositories as submodules, saves consistent related configuration, and removes
   recognized example entries as part of the completed save. Report progress and
   the actual state of each repository if any step fails.
9. Command reports the result and outstanding setup actions. When invoked through
   `$project-setup`, control returns to any remaining broader setup questions.

At the pending summary, users can also edit or remove a numbered entry, or
cancel. Accepting an entry means **Ready to save — not saved yet**. Editing
dependent facts returns it to review; skipping a later entry preserves earlier
completed entries.

## Affected Platforms

- `workspace-root`: Agent command experience, repository profile management,
  project setup integration, and command documentation.
- Existing configured product repositories: read-only discovery when accessible;
  no product implementation changes.
- No dashboard UI changes are required.

## Data, API, And Package Contracts

- Shared types or packages: Preserve the existing repository profile field names
  and value types; no new package contract is required.
- API endpoints: No product API changes. Repository discovery uses available
  read access and must support manual completion when access is unavailable.
- Events or runtime interfaces: New agent command forms listed above; existing
  `$project-setup` remains available and reuses this flow.
- Compatibility requirements: Existing real IDs, paths, custom metadata, and
  repository entries retain their meaning. Saving includes related configuration
  and Git submodule registration, preserving unrelated index and working tree
  changes. Existing workspaces must be able to receive the
  command through the normal workflow update process.

## UX Notes

The experience is a guided conversation with a URL as its starting point.
Autofill should visibly reduce typing while preserving user control. The full
entry review is the place to inspect accepted defaults; follow-up questions
focus on uncertainty. While inspecting a repository, show progress without
claiming facts that have not been verified. Unsupported metadata sources and
access failures should lead to a useful manual path.

Show the distinction between a completed pending entry and saved configuration.
Keep example cleanup visible in the save summary. Do not turn an unavailable
repository into a reason to lose other completed entries.

Use distinct actions: **Accept repository**, **Edit a field**, **Add another
repository**, **Save repositories**, and **Cancel**. Show a numbered pending list
with edit and remove actions, readable field labels, and textual states. Support
typed replies without requiring color, icons, or client-specific controls.
Group the complete review into identity, ownership, paths, and validation while
retaining every field and its evidence label.

The save preview names repository IDs, pending counts, exact examples to remove,
affected filenames, related configuration changes, and remaining local setup.
Show cloning and registration progress for each repository during save. Writing
`.gitmodules` alone is insufficient: completion must verify configuration, Git
registration, and checkout availability, and report checked-out revisions. Conflict and failure messages describe actual saved state and
recovery actions while retaining accepted input for retry.

## Acceptance Criteria

- A user can start `$add-project` with only a valid repository URL and receive
  a proposed entry covering every current profile field.
- Given sufficient accessible evidence, the user can accept autofilled values
  without retyping each field; missing facts produce focused follow-up questions.
- The complete entry review exposes every profile field and permits corrections.
- After completing repository A, choosing add another starts repository B while
  preserving A as pending. Choosing save persists both completed entries.
- Before save, the existing config and examples remain unchanged. Cancelling
  leaves them unchanged; an incomplete entry is never silently persisted.
- The first successful save of real entries removes recognized shipped example
  entries while retaining existing real and ambiguous user-modified entries.
- A failed save never reports success or leaves examples removed without the
  accepted real entries being saved.
- A repeated repository URL, equivalent URL form, ID, or local path conflict is
  surfaced before saving and does not silently overwrite an existing entry.
- An inaccessible private repository supports retry, manual completion, or skip
  without losing earlier completed entries or requesting credentials in chat.
- Unsupported validation facts are represented honestly; discovery does not run
  repository scripts or edit product code.
- `$project-setup` uses the same repository addition behavior and resumes its
  remaining setup flow afterward.
- Saving preserves unrelated and custom profile data and yields valid JSON.
- Editing or removing pending A preserves pending B; identity/path edits repeat
  conflict checks, update untouched derived suggestions, preserve explicit
  overrides, and require renewed review.
- Completing A then skipping incomplete B returns to the summary with A ready
  to save. Saving an empty session changes no files and removes no examples.
- Duplicate IDs, URLs, or paths between two pending entries are surfaced before
  save, with host and repository identity preserved during URL comparison.
- Intervening unrelated edits survive saving. Conflicting changes block writing
  until resolved; changes to proposed save effects produce a revised preview
  and fresh save choice.
- Failed multi-file saves report actual changed/restored files and required
  recovery, preserve newer external edits, retain pending values, and never
  report success for partial completion.
- Repository answers inside `$project-setup` remain pending until save;
  cancelling that subflow preserves unrelated setup changes already saved.
- Embedded URL secrets are neither echoed nor persisted; the user receives a
  clean-URL correction prompt.
- Entry acceptance, pending status, save success, and save failure are distinct
  textual states, and every action supports a typed reply.
- Save clones accepted repositories into the reviewed paths and registers valid
  Git submodule entries, with consistent profile, `.gitmodules`, and workflow
  references. It creates no commits and preserves unrelated Git changes.
- No clone or registration occurs before Save, during entry acceptance, on
  cancellation, or when saving an empty session.
- Existing matching submodules are not duplicated; conflicting destinations or
  registrations stop before destructive changes and explain the resolution needed.
- A failure while cloning or registering repository B reports the actual state of
  A and B, retains examples until full success, retains accepted values and user data, and supports a retry
  without duplicating A or claiming full success.
- Successful completion reports the checked-out revision and submodule state of
  each selected repository; failures identify remaining recovery work.

## Risks And Tradeoffs

- Repository metadata may be incomplete or misleading. Mitigation: label
  suggestions and require review, with manual completion available.
- Placeholder detection may mistake user data for examples. Mitigation: recognize
  shipped examples conservatively and ask about modified or ambiguous entries.
- Removing profile examples may leave workflow or submodule references stale.
  Mitigation: include related-file consistency and template cleanup in Save while
  preserving custom stages and resolving conflicting references.
- Multiple pending entries may be lost if the chat is interrupted. Durable
  cross-session draft recovery is outside this feature; cancellation must not
  partially persist entries.
- A configured repository may still lack a checkout, guidance file, or artifact
  directories. Mitigation: distinguish suggested paths from verified files and
  report remaining setup actions.

- Cloning and registration can fail after earlier operations succeed. Mitigation:
  preflight before mutation, preserve existing work, report per-repository actual
  state, and support safe recovery without promising all network/Git operations
  can be undone atomically.

## Open Questions

- `None`. The developer selected cloning and Git submodule registration as part
  of Save, together with related configuration updates and template cleanup.
  This is feature scope for the future command; no repository URL was supplied
  and no clone is performed during this PRD review.

## Design Artifacts

- `None` yet. UX requirements for the conversational command are captured above;
  an optional interaction design can refine prompts and review examples.

## Sprint Meetings

- [Five-role sprint review](../meeting-logs/prd-20261028-add-project-command-sprint-meeting-20261028-0930.md):
  conversational UX, save boundaries, preservation, and related-file scope.

## Approval

- Approved by: `auto-mode (developer-enabled)`
- Approved on: `2026-10-28`
- Approval command: `$auto-mode on`
- Explicit developer approval: `$approve-prd PRD-20261028-add-project-command`
