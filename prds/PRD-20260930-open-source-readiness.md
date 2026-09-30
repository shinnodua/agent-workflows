# Open source readiness

- PRD ID: `PRD-20260930-open-source-readiness`
- Title: `Open source readiness`
- Type: `prd`
- Status: `approved`
- Created: `2026-09-30`
- Last updated: `2026-09-30`
- Owner: `project-manager`
- Related artifact IDs: `[]`
- Source request: `Fix the issues found in the repository publication review; use MIT.`

## Problem

The repository has conflicting license metadata, generated receipts containing local paths, incomplete secret-file ignore rules, and an install hook that changes consumer files automatically.
The dashboard also renders URLs from workspace Markdown as clickable links without checking their schemes.

## Goals

- Make the published tree consistent with the MIT license.
- Remove generated local-path receipts from the published tree and prevent recurrence.
- Prevent common local credential files from being added accidentally.
- Make updates to consumer workspaces explicit.
- Allow only safe URL schemes and relative links in dashboard Markdown.

## Requirements

- Package manifests declare MIT, matching `LICENSE`.
- Keep the interactive diagram while removing local generated receipts.
- Ignore environment and npm credential files, with an exception for safe examples.
- Package installation does not update consumer files unless explicitly enabled.
- Document the install behavior and the Git-history limitation.
- Render unsafe Markdown links as text rather than clickable links.

## Acceptance Criteria

- Current tracked content has no generated receipt with a local home path.
- License declarations agree.
- Ignored credential-file examples are verified with `git check-ignore`.
- Postinstall skips updates by default, and the opt-in path remains available.
- Workspace validation passes.
- `javascript:`, `data:`, and protocol-relative links are not clickable; HTTPS, mailto, fragments, and relative links still work.

## Risks And Tradeoffs

- Existing commits still contain historical metadata until history is rewritten or a clean public repository is created.
- Consumers relying on automatic updates must opt in or run `workflows update`.

## Approval

- Approved by: `developer`
- Approved on: `2026-09-30`
- Approval source: `fix all above issue, the license should be MIT`
