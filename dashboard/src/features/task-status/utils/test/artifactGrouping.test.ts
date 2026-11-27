import { describe, expect, test } from "bun:test";
import type { Artifact } from "../../../../types";
import {
	buildTaskGroups,
	countDocumentsByModule,
	filterArtifacts,
	filterDocumentsByModule,
	getVisibleFiles,
} from "../artifactGrouping";

describe("artifactGrouping", () => {
	test("keeps an active research summary separate from a historical PRD", () => {
		const prd = createArtifact({
			type: "prd",
			id: "PRD-20261101-older",
			relativePath: "prds/older.md",
		});
		const research = createArtifact({
			type: "research",
			id: "RESEARCH-20261127-new",
			relatedArtifactIds: ["PRD-20261101-older"],
			relativePath: "research/new.md",
		});
		const provisionalId = "pending-research-20261127-new";
		const summary = createArtifact({
			type: "document",
			relativePath: `task-summary/${provisionalId}.md`,
			isTaskSummary: true,
		});

		const groups = buildTaskGroups([prd, research], {
			[provisionalId]: summary,
		});
		expect(groups).toHaveLength(2);
		expect(groups.find(({ key }) => key === provisionalId)?.artifacts).toEqual([
			research,
		]);
		expect(groups.find(({ key }) => key === provisionalId)?.summary).toEqual(
			summary,
		);
	});

	test("reserves summary identity for its feature when legacy slugs collide", () => {
		const id = "prd-20261127-collision";
		const prd = createArtifact({
			type: "prd",
			id: id.toUpperCase(),
			relativePath: "prds/current.md",
			taskKey: "collision",
		});
		const legacy = createArtifact({
			type: "research",
			relativePath: "research/legacy.md",
			taskKey: id,
		});
		const inheritedKey = createArtifact({
			type: "research",
			relativePath: "research/constructor.md",
			taskKey: "constructor",
		});
		const summary = createArtifact({
			type: "document",
			relativePath: `task-summary/${id}.md`,
			isTaskSummary: true,
		});

		for (const articles of [
			[legacy, prd],
			[prd, legacy],
		]) {
			const groups = buildTaskGroups([...articles, inheritedKey], {
				[id]: summary,
			});
			expect(groups.find(({ key }) => key === id)?.artifacts).toEqual([prd]);
			expect(groups.filter((group) => group.summary)).toHaveLength(1);
		}
		expect(
			buildTaskGroups([legacy], { [id]: summary })[0]?.summary,
		).toBeUndefined();
	});

	test("opens the correct summary for same-slug PRDs when search matches a plan", () => {
		const firstId = "PRD-20261122-workflow-refresh";
		const secondId = "PRD-20261127-workflow-refresh";
		const taskKey = "workflow-refresh";
		const firstPrd = createArtifact({
			type: "prd",
			id: firstId,
			relativePath: "prds/first.md",
			taskKey,
			title: "Workflow refresh",
			relatedArtifactIds: [secondId],
		});
		const secondPrd = createArtifact({
			type: "prd",
			id: secondId,
			relativePath: "prds/second.md",
			taskKey,
			title: "Workflow refresh",
		});
		const secondPlan = createArtifact({
			type: "plan",
			prdId: secondId,
			relativePath: "plans/second.md",
			taskKey,
		});
		const firstResearch = createArtifact({
			type: "research",
			id: "RESEARCH-20261122-workflow-refresh",
			relatedArtifactIds: [firstId],
			relativePath: "research/first.md",
			taskKey,
		});
		secondPrd.relatedArtifactIds.push(firstResearch.id ?? "");
		const secondSummary = createArtifact({
			type: "document",
			relativePath: "task-summary/second.md",
			isTaskSummary: true,
		});
		const articles = [firstPrd, secondPrd, secondPlan, firstResearch];
		const summaries = {
			[firstId.toLowerCase()]: "unavailable" as const,
			[secondId.toLowerCase()]: secondSummary,
		};

		expect(buildTaskGroups(articles, summaries)).toHaveLength(2);
		const searched = buildTaskGroups(articles, summaries, [secondPlan]);
		expect(searched).toHaveLength(1);
		expect(searched[0]?.byType.prd).toEqual([secondPrd]);
		expect(searched[0]?.byType.research).toEqual([]);
		expect(searched[0]?.summary).toEqual(secondSummary);
	});

	test("groups artifacts by task key and prioritizes PRD title", () => {
		const groups = buildTaskGroups([
			createArtifact({
				goal: "Build it from the plan.",
				title: "Implementation plan",
				type: "plan",
			}),
			createArtifact({
				goal: "Solve the user problem.",
				title: "Product requirements",
				type: "prd",
			}),
		]);

		expect(groups).toHaveLength(1);
		expect(groups[0]?.title).toBe("Product requirements");
		expect(groups[0]?.description).toBe("Solve the user problem.");
		expect(groups[0]?.byType.prd).toHaveLength(1);
		expect(groups[0]?.byType.plan).toHaveLength(1);
	});

	test("uses plan goal when a grouped PRD goal is missing", () => {
		const groups = buildTaskGroups([
			createArtifact({
				title: "Product requirements",
				type: "prd",
			}),
			createArtifact({
				goal: "Use the implementation goal.",
				title: "Implementation plan",
				type: "plan",
			}),
		]);

		expect(groups[0]?.description).toBe("Use the implementation goal.");
	});

	test("groups artifacts that reference another artifact ID", () => {
		const groups = buildTaskGroups([
			createArtifact({
				id: "RESEARCH-20260816-app-performance-optimization",
				relativePath:
					"research/research-20260816-app-performance-optimization.md",
				taskKey: "app-performance-optimization",
				title:
					"How desktop apps improve game experience, reduce lag, smooth gameplay, and stabilize FPS",
				type: "research",
			}),
			createArtifact({
				id: "PRD-20260816-performance-profiles-diagnostics",
				relatedArtifactIds: ["RESEARCH-20260816-app-performance-optimization"],
				relativePath: "prds/prd-20260816-performance-profiles-diagnostics.md",
				taskKey: "performance-profiles-diagnostics",
				title: "Example Project Performance Profiles And Diagnostics",
				type: "prd",
			}),
		]);

		expect(groups).toHaveLength(1);
		expect(groups[0]?.title).toBe(
			"Example Project Performance Profiles And Diagnostics",
		);
		expect(groups[0]?.byType.research).toHaveLength(1);
		expect(groups[0]?.byType.prd).toHaveLength(1);
	});

	test("allows multiple research, design, and plan artifacts in one task", () => {
		const groups = buildTaskGroups([
			createArtifact({
				id: "PRD-20260816-performance-profiles-diagnostics",
				taskKey: "performance-profiles-diagnostics",
				type: "prd",
			}),
			createArtifact({
				id: "RESEARCH-20260816-performance-a",
				relatedArtifactIds: ["PRD-20260816-performance-profiles-diagnostics"],
				taskKey: "performance-research-a",
				title: "Performance research A",
				type: "research",
			}),
			createArtifact({
				id: "RESEARCH-20260816-performance-b",
				relatedArtifactIds: ["PRD-20260816-performance-profiles-diagnostics"],
				taskKey: "performance-research-b",
				title: "Performance research B",
				type: "research",
			}),
			createArtifact({
				id: "DESIGN-20260816-performance-a",
				relatedArtifactIds: ["PRD-20260816-performance-profiles-diagnostics"],
				taskKey: "performance-design-a",
				title: "Performance design A",
				type: "design",
			}),
			createArtifact({
				id: "DESIGN-20260816-performance-b",
				relatedArtifactIds: ["PRD-20260816-performance-profiles-diagnostics"],
				taskKey: "performance-design-b",
				title: "Performance design B",
				type: "design",
			}),
			createArtifact({
				id: "PLAN-20260816-performance-a",
				prdId: "PRD-20260816-performance-profiles-diagnostics",
				taskKey: "performance-plan-a",
				title: "Performance plan A",
				type: "plan",
			}),
			createArtifact({
				id: "PLAN-20260816-performance-b",
				prdId: "PRD-20260816-performance-profiles-diagnostics",
				taskKey: "performance-plan-b",
				title: "Performance plan B",
				type: "plan",
			}),
		]);

		expect(groups).toHaveLength(1);
		expect(groups[0]?.byType.research).toHaveLength(2);
		expect(groups[0]?.byType.design).toHaveLength(2);
		expect(groups[0]?.byType.plan).toHaveLength(2);
	});

	test("filters artifacts by title, status, and path", () => {
		const artifacts = [
			createArtifact({ status: "approved", title: "Launcher Plan" }),
			createArtifact({
				relativePath: "docs/preferences.md",
				status: "unknown",
				title: "Settings",
			}),
		];

		expect(filterArtifacts(artifacts, "approved")).toHaveLength(1);
		expect(filterArtifacts(artifacts, "preferences.md")).toHaveLength(1);
	});

	test("returns all files for task view and category files for artifact views", () => {
		const artifacts = [
			createArtifact({ type: "prd" }),
			createArtifact({ type: "document" }),
		];

		expect(getVisibleFiles(artifacts, "task")).toHaveLength(1);
		expect(getVisibleFiles(artifacts, "document")).toHaveLength(1);
		expect(getVisibleFiles(artifacts, "workflow")).toHaveLength(0);
	});

	test("does not create task groups from documents", () => {
		const groups = buildTaskGroups([
			createArtifact({ type: "document" }),
			createArtifact({ type: "document" }),
		]);

		expect(groups).toHaveLength(0);
	});

	test("filters documents by workspace module", () => {
		const artifacts = [
			createArtifact({
				relativePath: "docs/workspace.md",
				sourceModule: "workspace",
				type: "document",
			}),
			createArtifact({
				relativePath: "modules/example-web/docs/app.md",
				sourceModule: "example-web",
				type: "document",
			}),
			createArtifact({
				relativePath: "plans/app.md",
				sourceModule: "workspace",
				type: "plan",
			}),
		];

		expect(filterDocumentsByModule(artifacts, "all")).toHaveLength(2);
		expect(filterDocumentsByModule(artifacts, "workspace")).toHaveLength(1);
		expect(filterDocumentsByModule(artifacts, "example-web")).toHaveLength(1);
		expect(filterDocumentsByModule(artifacts, "example-core")).toHaveLength(0);
	});

	test("counts document tabs by workspace module", () => {
		const counts = countDocumentsByModule(
			[
				createArtifact({
					sourceModule: "workspace",
					type: "document",
				}),
				createArtifact({
					sourceModule: "example-web",
					type: "document",
				}),
				createArtifact({
					sourceModule: "example-web",
					type: "document",
				}),
			],
			[
				{ module: "all", label: "All" },
				{ module: "workspace", label: "Workspace" },
				{ module: "example-web", label: "example-web" },
				{ module: "example-core", label: "example-core" },
			],
		);

		expect(counts.all).toBe(3);
		expect(counts.workspace).toBe(1);
		expect(counts["example-web"]).toBe(2);
		expect(counts["example-core"]).toBe(0);
	});

	test("sorts visible artifact lists by latest time first", () => {
		const artifacts = [
			createArtifact({
				modified: "2026-08-14T00:00:00.000Z",
				relativePath: "plans/older.md",
				title: "Older",
				type: "plan",
			}),
			createArtifact({
				created: "2026-08-16",
				modified: "2026-08-13T00:00:00.000Z",
				relativePath: "plans/newer.md",
				title: "Newer",
				type: "plan",
			}),
			createArtifact({
				modified: "2026-08-15T00:00:00.000Z",
				relativePath: "docs/middle.md",
				title: "Middle",
				type: "document",
			}),
		];

		expect(
			filterArtifacts(artifacts, "").map((artifact) => artifact.title),
		).toEqual(["Newer", "Middle", "Older"]);
		expect(
			getVisibleFiles(filterArtifacts(artifacts, ""), "plan").map(
				(artifact) => artifact.title,
			),
		).toEqual(["Newer", "Older"]);
	});

	test("sorts artifacts inside each task column by latest time first", () => {
		const groups = buildTaskGroups([
			createArtifact({
				modified: "2026-08-14T00:00:00.000Z",
				relativePath: "plans/older.md",
				title: "Older",
				type: "plan",
			}),
			createArtifact({
				modified: "2026-08-16T00:00:00.000Z",
				relativePath: "plans/newer.md",
				title: "Newer",
				type: "plan",
			}),
		]);

		expect(groups[0]?.byType.plan.map((artifact) => artifact.title)).toEqual([
			"Newer",
			"Older",
		]);
	});
});

function createArtifact(overrides: Partial<Artifact> = {}): Artifact {
	return {
		content: "# Example",
		modified: "2026-08-13T00:00:00.000Z",
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
