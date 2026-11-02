# Product Requirements Document: Workspace Check Formatting

## Metadata

- PRD ID: `PRD-20261102-workspace-check-formatting`
- Type: `prd`
- Status: `approved`
- Created: `2026-11-02`
- Last updated: `2026-11-02`
- Owner: `project-manager`
- Research sources: [Research](../research/research-20261102-workspace-check-formatting.md)

## Problem

Packaged workspace validation rejects valid multiline workspace.config.json because it also checks formatting.

## Research Context

The consuming fixture fails with a formatter diagnostic; the root-only Biome override does not propagate to consumers.

## Goals

Accept semantically equivalent JSON regardless of whitespace and line wrapping.

## Non-Goals

Changing project formatting rules, modifying user configuration, dependencies, or product runtime code.

## Users And Use Cases

Developers edit workspace configuration and run workflows check locally or in hooks.

## Requirements

- Packaged workspace check validates content independently of formatting.
- Preserve malformed JSON, invalid model/auto-mode, artifact, and code lint errors.
- Respect consumer lint configuration; keep files byte-for-byte unchanged.
- Dedicated project lint/format commands retain their existing policies.

## User Flows

1. Developer puts each artifactDirectories item on a separate line.
2. Workspace check accepts valid configuration and reports actual content errors.

## Affected Platforms

Root workspace CLI only; no configured product repositories affected.

## Data, API, And Package Contracts

No configuration schema change. The packaged check no longer enforces formatting.

## UX Notes

Diagnostics must remain actionable for malformed content and real lint errors.

## Acceptance Criteria

- Compact and multiline valid configs pass without a root Biome config.
- Explicit consumer formatter configuration does not reintroduce the failure.
- Check leaves config unchanged.
- Malformed JSON, invalid settings, and a code lint violation still fail.

## Risks And Tradeoffs

Formatting enforcement moves to dedicated lint/format commands for consumers relying on packaged check.

## Open Questions

None.

## Design Artifacts

Not applicable: CLI validation correction without a visual interface; UX covered above.

## Review Clarifications

- Formatter disabling covers all scanned files in packaged check, including source files.
- Preserve consumer linter rules, parser behavior, validation order, and integrity failures. Formatting and assist actions such as import sorting are enforced by dedicated Biome check commands.
- Test global and per-file consumer formatter settings and unchanged bytes on success and failure.
- Root workspace:check retains its dedicated lint command and formatting policy.

## Approval

- Approved by: auto-mode (developer-enabled)
- Approved on: `2026-11-02`
- Approval command: `$auto-mode on`

## CI Follow-Up Acceptance

- The formatter-override regression uses a canonical temporary root so consumer configuration is actually discovered on macOS and Linux.
- Use lint-only validation; explicit consumer formatter overrides must never schedule formatting.
- Malformed source code must still fail with parser diagnostics and unchanged bytes.
- Fixture configuration uses the supported preset field without deprecation diagnostics.
