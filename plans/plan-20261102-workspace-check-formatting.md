# Root Overview Plan: Workspace Check Formatting

## Metadata

- Plan ID: `PLAN-20261102-workspace-check-formatting`
- PRD ID: `PRD-20261102-workspace-check-formatting`
- Type: `plan`
- Status: `complete`
- PRD link: [PRD](../prds/prd-20261102-workspace-check-formatting.md)
- Research sources: [Research](../research/research-20261102-workspace-check-formatting.md)
- Created: `2026-11-02`
- Last updated: `2026-11-02`
- Owner: `tech-lead`

## Goal

Make packaged workspace checks formatting independent while preserving content validation.

## Research Inputs

Temporary consuming fixture reproduced formatter-only rejection. The root Biome exception does not reach consumers. Five-role review found no blockers.

## Scope

Root bin/workflows.js, its integration tests, README.md and INSTALL.md. No submodules, dependencies, schema, UI, or deployment changes.

## Affected Platforms

Root CLI only; no submodule plans needed.

## Cross-Repo Design

None. Consumer check invokes packaged Biome with explicit formatter disabling, then existing integrity. Consumer lint rules and assist remain intact; no config writes.

## Sequence

1. Add real CLI fixtures for compact/multiline config, consumer formatting overrides, source formatting, no writes, malformed settings, lint, and artifact failures; observe red.
2. Explicitly disable Biome formatter in runCheck. Preserve command ordering and other options.
3. Document dedicated lint/format boundary and correct bootstrap advice.
4. Run focused tests then full root workspace:check. Record results.

## Validation

`node --test --test-name-pattern='workspace check' bin/workflows.test.mjs`; `bun run workspace:check`. Re-run original consuming fixture. Dedicated Biome check should still reject formatting-only differences.

## Risks

Consumers relying on packaged check for style must use dedicated lint/format commands. Explicit consumer overrides require regression coverage.

## Open Questions

None.

## Approval

- Approved by: auto-mode (developer-enabled)
- Approved on: `2026-11-02`
- Approval command: `$auto-mode on`

## Completion Handoff

### Developer actions

- Build: None for this checkout; full validation and dashboard build passed.
- Run: None for this checkout. The local CLI uses the fixed implementation.
- Roll out: Installed consumers need a future package release containing this fix and then a dependency upgrade. No release or publishing performed.

### Artifacts created and approved

- [Research](../research/research-20261102-workspace-check-formatting.md): reviewed.
- [PRD](../prds/prd-20261102-workspace-check-formatting.md): approved by auto mode.
- Design: not applicable; no visual surface change.
- Five-role sprint meeting (record in `meeting-logs/`): complete; no unresolved questions.
- Root plan: approved before implementation, now complete.
- Repository plans: none; no submodules affected.

### Implementation summary

Root bin/workflows.js explicitly disables Biome formatting in packaged check, preserving consumer lint configuration, parser/assist behavior, config validation, and integrity ordering. Two integration tests cover formatting and retained failures. README.md and INSTALL.md explain the dedicated lint boundary. Root biome.json and workspace.config.json were not changed.

### Breaking changes and compatibility

Packaged check no longer enforces formatting across scanned files; dedicated lint/format commands retain that responsibility. No config schema or API change, migrations, service rollout ordering, or downtime. External consumer upgrade timing is unknown; owner: package maintainer/consumer developers.

### Environment and operational configuration

None: checked CLI command options, package scripts, and root configuration. No environment variables, secrets, infrastructure, runtime services, migrations, or backfills changed.

### Validation results

- Original consuming fixture: reproduced exit 1 before fix; exit 0 afterward with multiline artifactDirectories and unchanged file bytes.
- Focused workspace-check tests: 3 passed. Regression tests were observed failing before the implementation change.
- Full `bun run workspace:check`: passed (15 CLI tests, 26 repository-add tests, 5 security tests, lint, 34 dashboard tests, dashboard typecheck and build).
- Dedicated Biome check against the same fixture still rejects formatting differences, as intended.
- `git diff --check`: passed.
- Limits: one existing unresolved artifact-ID warning and a dashboard bundle-size warning; no validation failures. Published-package installation was not tested or released.
- Root submodule pointer status: None; no submodules changed.

### Human-only questions

None.
