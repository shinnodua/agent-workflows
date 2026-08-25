import { describe, expect, test } from "bun:test";
import type { Artifact } from "../../../../types";
import {
	normalizeWorkspacePath,
	resolveLinkedArtifact,
} from "../markdownLinks";

describe("markdownLinks", () => {
	test("normalizes relative workspace paths", () => {
		expect(
			normalizeWorkspacePath(
				"docs/example-web/features/app/../../../../modules/example-web/docs/API.md",
			),
		).toBe("modules/example-web/docs/API.md");
	});

	test("resolves a relative markdown link to a known artifact", () => {
		const current = createArtifact({
			relativePath: "docs/example-web/features/app/README.md",
		});
		const target = createArtifact({
			relativePath: "modules/example-web/docs/features/app/README.md",
			title: "Launcher Feature",
		});

		expect(
			resolveLinkedArtifact(
				[current, target],
				current,
				"../../../../modules/example-web/docs/features/app/README.md",
			),
		).toBe(target);
	});

	test("resolves a root plan table link to a submodule plan artifact", () => {
		const current = createArtifact({
			relativePath: "plans/plan-20260813-move-submodules-to-modules.md",
			type: "plan",
		});
		const target = createArtifact({
			relativePath:
				"modules/example-core/plans/plan-20260813-move-submodules-to-modules-core.md",
			title: "Move Submodules Core Plan",
			type: "plan",
		});

		expect(
			resolveLinkedArtifact(
				[current, target],
				current,
				"../modules/example-core/plans/plan-20260813-move-submodules-to-modules-core.md",
			),
		).toBe(target);
	});

	test("resolves a root design mapping link to a submodule design artifact", () => {
		const current = createArtifact({
			relativePath: "designs/design-20260814-advanced-search-filters.md",
			type: "design",
		});
		const target = createArtifact({
			relativePath:
				"modules/example-web/designs/design-20260814-advanced-search-filters.md",
			title: "Advanced Mod Filters Design",
			type: "design",
		});

		expect(
			resolveLinkedArtifact(
				[current, target],
				current,
				"../modules/example-web/designs/design-20260814-advanced-search-filters.md",
			),
		).toBe(target);
	});

	test("resolves a root research link to a submodule research artifact", () => {
		const current = createArtifact({
			relativePath: "research/research-20260813-catalog-filtering.md",
			type: "research",
		});
		const target = createArtifact({
			relativePath:
				"modules/example-web/research/research-20260813-catalog-filtering.md",
			title: "Submodule research",
			type: "research",
		});

		expect(
			resolveLinkedArtifact(
				[current, target],
				current,
				"../modules/example-web/research/research-20260813-catalog-filtering.md",
			),
		).toBe(target);
	});

	test("ignores external links", () => {
		const current = createArtifact();

		expect(
			resolveLinkedArtifact([current], current, "https://example.com/doc.md"),
		).toBeUndefined();
	});
});

function createArtifact(overrides: Partial<Artifact> = {}): Artifact {
	return {
		content: "# Example",
		modified: "2026-08-13T00:00:00.000Z",
		relatedArtifactIds: [],
		relativePath: "docs/example.md",
		sourceModule: "workspace",
		sourceHref: "/@fs/example.md",
		status: "unknown",
		taskKey: "example",
		title: "Example",
		type: "document",
		...overrides,
	};
}
