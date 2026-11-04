# Public npm Registry PRD

## Metadata

- PRD ID: `PRD-20261104-public-npm-registry`
- Title: `Public npm Registry`
- Type: `prd`
- Status: `approved`
- Created: `2026-11-04`
- Last updated: `2026-11-04`
- Owner: `project-manager`
- Related artifact IDs: `[RESEARCH-20261104-public-npm-registry]`
- Source request: `setup for public package to public registry (npm)`
- Research sources:
  - `RESEARCH-20261104-public-npm-registry`: [Research](../research/research-20261104-public-npm-registry.md) - registry and CI prerequisites.

## Problem

The public package currently publishes to GitHub Packages and installation requires registry-specific authentication.

## Research Context

- Research brief: `RESEARCH-20261104-public-npm-registry`
- Key findings used: npm supports public scoped packages and GitHub OIDC trusted publishing.
- Source gaps: external npm account/package state is unknown; maintainer owns release setup.

## Goals

- Make the existing package publicly installable through npm.
- Keep the Changesets release process and validation gate.

## Non-Goals

- Publishing, account configuration, commits, pushes, package rename, or product changes.

## Users And Use Cases

- Consumers install without GitHub credentials; maintainers publish through the existing version PR flow.

## Requirements

Functional requirements:

- Target https://registry.npmjs.org with explicit public access.
- Release CI supports npm trusted publishing and retains validation before publication.
- Document npm bootstrap, scope ownership, exact publisher settings, and migration from old scope mapping.
- Keep name, version management, and CLI behavior stable.

Non-functional requirements:

- No new package dependencies or stored npm write credentials.
- Do not change unrelated registries or historical release artifacts.

## User Flows

1. Consumer installs @shinnodua/agent-workflows from npm without authentication.
2. Maintainer bootstraps the package if absent, then enables its GitHub trusted publisher.
3. Changesets opens a version PR; merging it validates and publishes to npm.

## Affected Platforms

- `workspace-root`: package metadata, release workflow, and documentation. No submodules.

## Data, API, And Package Contracts

- Shared types or packages: same package name and CLI.
- API endpoints: None.
- Events or runtime interfaces: GitHub OIDC for publication; GitHub token for repository automation.
- Compatibility requirements: existing GitHub scope mappings require migration; old lockfiles may retain GitHub tarball URLs.

## UX Notes

Explain anonymous installation separately from maintainer authentication and first-publication steps. Preserve unrelated consumer configuration.

## Acceptance Criteria

- Packed manifest targets public npm and public access.
- Release workflow uses supported Node/npm and id-token permission without GitHub registry credentials.
- Active docs provide copyable anonymous install and scoped migration commands; warn about old lockfile URLs.
- Maintainer docs name the exact trusted publisher tuple and enable direct npm publish.
- Dashboard package remains private.
- Anonymous installation after publication is an external verification action, not claimed by local checks.
- Workspace validation and package dry-run pass; actual external publication remains untested.

## Risks And Tradeoffs

- npm scope ownership and trust configuration must be completed by maintainer before release.
- Public npm versions are immutable; choose an unused version when bootstrapping.

## Open Questions

- None for implementation; external release prerequisites are documented handoff actions.

## Design Artifacts

- Not applicable: release configuration and text guidance only; no app UI changes.

## Sprint Meetings

- Meeting ID: `MEETING-20261104-0906-public-npm-registry`; saved in [meeting logs](../meeting-logs/).

## Approval

- Approved by: `auto-mode (developer-enabled)`
- Approved on: `2026-11-04`
- Approval command: `$auto-mode on`
