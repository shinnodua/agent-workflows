import { describe, expect, test } from "bun:test";
import { parseWorkspaceMetadata } from "../workspaceMetadata";

describe("workspaceMetadata", () => {
	test("parses structured front matter", () => {
		const result = parseWorkspaceMetadata(
			"---\nid: PRD-20260820-example\ntype: prd\nstatus: approved\ncreated: 2026-08-20\nupdated: 2026-08-20\nowner: developer\nrelatedArtifactIds: [RESEARCH-20260820-example]\n---\n# Example",
			{ relatedArtifactIds: [] },
		);

		expect(result.format).toBe("structured");
		expect(result.errors).toHaveLength(0);
		expect(result.metadata.relatedArtifactIds).toEqual([
			"RESEARCH-20260820-example",
		]);
	});

	test("keeps Markdown metadata readable without requiring YAML front matter", () => {
		const result = parseWorkspaceMetadata("# Example", {
			id: "PRD-20260820-example",
			relatedArtifactIds: [],
		});

		expect(result.format).toBe("markdown");
		expect(result.metadata.id).toBe("PRD-20260820-example");
		expect(result.warnings).toHaveLength(0);
	});

	test("reports invalid structured metadata", () => {
		const result = parseWorkspaceMetadata(
			"---\nid: example\ntype: invalid\nstatus: pending\ncreated: invalid\n---\n# Example",
			{ relatedArtifactIds: [] },
		);

		expect(result.errors.length).toBeGreaterThan(3);
	});
});
