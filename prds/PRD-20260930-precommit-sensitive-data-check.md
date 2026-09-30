# Pre-commit sensitive data check

- PRD ID: `PRD-20260930-precommit-sensitive-data-check`
- Title: `Pre-commit sensitive data check`
- Type: `prd`
- Status: `approved`
- Created: `2026-09-30`
- Last updated: `2026-09-30`
- Owner: `project-manager`
- Related artifact IDs: `[]`
- Source request: `Run a script before commits that checks security, secrets, and private information, and block failing commits.`

## Problem

The existing pre-commit hook runs workspace validation but does not inspect staged content for credentials or private information.

## Goals

- Reject commits containing high-confidence secrets or private data.
- Scan the staged Git snapshot, including newly added files, without printing detected values.
- Keep the existing workspace validation gate.

## Requirements

- Check staged regular files for private key blocks, common provider tokens, credential assignments, personal email addresses, and local home directory paths.
- Report the file, line, and finding category without echoing sensitive values.
- Allow documented example domains and placeholders.
- Exit nonzero on findings and run from the existing pre-commit hook.
- Document installation, manual use, and the limits of pattern-based scanning.

## Acceptance Criteria

- A staged synthetic credential blocks the check.
- Safe examples pass.
- The hook invokes the security check before workspace validation.

## Approval

- Approved by: `developer`
- Approved on: `2026-09-30`
- Approval source: direct implementation request.
