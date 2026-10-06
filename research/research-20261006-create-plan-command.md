# Create Plan Command Research

## Metadata

- Research ID: `RESEARCH-20261006-create-plan-command`
- Title: Extract plan creation from PRD approval
- Type: `research`
- Status: `reviewed`
- Created: `2026-10-06`
- Last updated: `2026-10-06`
- Owner: `tech-lead`
- Related artifact IDs: `[]`
- Source request: `Extract from approve PRD skill and create the create-plan skill and command; allow direct use and use after PRD approval.`
- Researcher role: `Project Manager + Tech Lead`

## Executive Summary

The existing `approve-prd` skill owns both approval and plan creation. A reusable `create-plan` entry point should own plan creation, require an approved PRD, and be callable directly or from `approve-prd`. Workspace command discovery uses a canonical `.agents/skills` file plus Codex, Claude, and compatibility shims.

## Short Version

Move planning instructions into `create-plan`, delegate to it after PRD approval, and update auto mode and workflow documentation to reflect separate stages.

## Research Questions

- How does the current approval workflow create plans?
- Which files expose a command across supported agents?

## Context

This is workspace tooling owned by the root repository. The example submodules in `project/repositories.json` are not affected.

## Current Workspace Findings

- Root workspace: `.agents/skills/approve-prd/SKILL.md` contains planning steps 12–25; `workflows.md` and `.agents/skills/auto-mode/SKILL.md` describe the combined stage. `.codex/prompts/`, `.claude/skills/`, and `commands/` expose command shims.
- Diagram: `.archify/workflow-workspace-delivery-20260929-093455/` depicts approval followed by root and submodule plans.

## External Findings

- None. This change is defined by repository behavior.

## Reference URLs

- None.

## Product Implications

- Users can invoke `$create-plan <prd-id>` after a PRD is approved.
- `$approve-prd <prd-id>` retains its existing automatic handoff to planning.
- Planning must not silently approve a draft PRD or start implementation.

## Technical Implications

- The new skill is the single source for root and submodule plan creation.
- The approval skill delegates after updating PRD metadata.
- Auto mode calls the new skill in its planning stage.
- Validate command discovery and workspace integrity.

## Open Questions

- None.
