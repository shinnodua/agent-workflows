# Dashboard Task Summary Design

- Design ID: `DESIGN-20261127-task-summary`
- PRD ID: `PRD-20261127-task-summary`
- Type: `design`
- Status: `design-done`
- Owner: `ui-ux-designer`
- PRD: [Persistent Task Summary](../prds/prd-20261127-task-summary.md)
- Design workspace: Local Markdown. Open Design connection returned a closed transport.

## Task overview

Place a single **Task Summary** action in the task card header alongside status and artifact count. Use the existing dashboard Button style. Keep the action visible on compact cards and let the header wrap. Show **No summary yet** as subdued text for missing files and **Summary unavailable** for known loading errors. Keep the remaining task artifacts accessible.

## Read-only preview

Open the existing Markdown drawer with the task title and relative file path. Preserve Escape handling and artifact navigation. Focus the close control on open and restore focus to the task action after close, including after evidence navigation. Render the versioned sections in their documented order. Keep wide Markdown tables within scrollable regions at narrow widths. Preserve text status and coverage labels even when optional usage is missing, so the view stays usable independently of color.

The dashboard reads the saved file on refresh. It leaves the summary's contents and workflow status unchanged. Older templates use the same Markdown preview. Tasks with distinct PRD IDs open their own files, even when their titles match.

## Verification

Check keyboard opening and closing, narrow widths, the empty and unavailable states, navigation from evidence links, and updated text and token counts after refresh.
