import { describe, expect, test } from "bun:test";
import type { Artifact, ProjectRepository } from "../../../../types";
import { buildActionItems, STALE_DRAFT_DAYS } from "../actionItems";

const NOW = new Date("2026-08-20T00:00:00.000Z");

describe("actionItems", () => {
	test("finds approved PRDs without a linked plan", () => {
		const items = buildActionItems(
			[
				createArtifact({
					id: "PRD-20260820-example",
					status: "approved",
					type: "prd",
				}),
			],
			NOW,
		);

		expect(
			items.some((item) => item.title === "Needs implementation plan"),
		).toBe(true);
	});

	test("finds missing detail plans for affected submodules", () => {
		const items = buildActionItems(
			[
				createArtifact({
					content:
						"# Plan\n\n- Status: `approved`\n\n| `example-core` | Shared work |",
					id: "PLAN-20260820-example",
					status: "approved",
					type: "plan",
				}),
			],
			[
				createRepository({
					id: "example-core",
					name: "example-core",
					path: "modules/example-core",
				}),
			],
			NOW,
		);

		expect(items.some((item) => item.title === "Missing submodule plan")).toBe(
			true,
		);
	});

	test("finds stale non-document drafts", () => {
		const items = buildActionItems(
			[
				createArtifact({
					created: `2026-08-${String(20 - STALE_DRAFT_DAYS - 1).padStart(2, "0")}`,
					type: "design",
				}),
				createArtifact({
					created: "2026-07-01",
					type: "document",
				}),
			],
			NOW,
		);

		expect(items.filter((item) => item.title === "Stale draft")).toHaveLength(
			1,
		);
	});

	test("finds unresolved local Markdown links", () => {
		const items = buildActionItems(
			[
				createArtifact({
					content: "# Example\n\n[Missing](../plans/missing.md)",
				}),
			],
			NOW,
		);

		expect(items.some((item) => item.title === "Broken workspace link")).toBe(
			true,
		);
	});

	test("returns no issues for a current complete artifact set", () => {
		const prd = createArtifact({
			id: "PRD-20260820-example",
			status: "approved",
			type: "prd",
		});

		const plan = createArtifact({
			content: "# Plan\n\n- Status: `complete`",
			id: "PLAN-20260820-example",
			prdId: prd.id,
			status: "complete",
			type: "plan",
		});

		expect(buildActionItems([prd, plan], NOW)).toHaveLength(0);
	});
});

function createRepository(
	overrides: Partial<ProjectRepository> = {},
): ProjectRepository {
	return {
		id: "example-web",
		name: "example-web",
		path: "modules/example-web",
		platforms: [],
		purpose: "Desktop app",
		scope: [],
		...overrides,
	};
}

function createArtifact(overrides: Partial<Artifact> = {}): Artifact {
	return {
		content: "# Example",
		created: "2026-08-20",
		modified: "2026-08-20T00:00:00.000Z",
		relatedArtifactIds: [],
		relativePath: "prds/example.md",
		sourceModule: "workspace",
		sourceHref: "/@fs/example.md",
		status: "draft",
		taskKey: "example",
		title: "Example",
		type: "prd",
		...overrides,
	};
}
