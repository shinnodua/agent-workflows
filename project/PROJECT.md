# Generic Project Profile

This file contains project-specific context for the reusable coordination workspace. Replace this file when applying the template to a real project.

## Purpose

Describe the product, platform, or system this workspace coordinates. Include the user value, business context, and why multiple repositories need shared planning.

## Repository Ownership

Repository metadata, submodule paths, validation commands, and agent guide paths are defined in [repositories.json](repositories.json).

Use that file as the source of truth when deciding which repository owns a change.

## Project-Specific Boundaries

Replace these examples with your real ownership rules:

- Shared packages, reusable contracts, design tokens, and cross-product utilities usually belong in a shared or core repository.
- Backend APIs, persistence, queues, jobs, and deployment configuration usually belong in service repositories.
- Web screens, app screens, local integrations, and platform-specific flows usually belong in frontend or application repositories.
- Documentation that explains repository internals should live in that repository; documentation that explains cross-repository behavior may live at the workspace root.

## UI/UX Design Integration

If the project has a design system, design workspace, Figma file, Open Design project, brand guide, or component playground, document it here. Keep durable project-specific visual rules in this profile or in linked submodule docs rather than hard-coding them into reusable workspace instructions.
