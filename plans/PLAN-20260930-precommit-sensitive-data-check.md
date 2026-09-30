# Pre-commit sensitive data check

- Plan ID: `PLAN-20260930-precommit-sensitive-data-check`
- Status: `approved`
- PRD: [Pre-commit sensitive data check](../prds/PRD-20260930-precommit-sensitive-data-check.md)
- Owner: root workspace

## Implementation

Add a dependency-free staged-file scanner under `scripts/`. Run it as the first Lefthook pre-commit command, retain the workspace check, and document installation and limitations in the README. Keep all changes in the root repository.

## Validation

Test synthetic staged content in a temporary Git repository, run the scanner against the current index, and run root workspace validation.

## Approval

Approved by developer's direct request to implement the commit gate on 2026-09-30.
