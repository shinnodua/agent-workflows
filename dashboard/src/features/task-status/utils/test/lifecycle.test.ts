import { describe, expect, test } from "bun:test";
import type { TaskGroup } from "../../../../types";
import { buildLifecycleStages } from "../lifecycle";

describe("lifecycle", () => {
	test("marks explicit artifacts and missing evidence accurately", () => {
		const prd = createArtifact("prd", "approved");
		const plan = createArtifact("plan", "complete");
		const group = {
			artifacts: [prd, plan],
			byType: {
				design: [],
				document: [],
				plan: [plan],
				prd: [prd],
				research: [],
			},
			key: "example",
			status: "complete",
			title: "Example",
		} as TaskGroup;

		const stages = buildLifecycleStages(group);
		expect(stages.find((stage) => stage.name === "PRD")?.state).toBe(
			"complete",
		);
		expect(stages.find((stage) => stage.name === "Plan")?.state).toBe(
			"complete",
		);
		expect(stages.find((stage) => stage.name === "Implementation")?.state).toBe(
			"not-verified",
		);
	});
});

function createArtifact(type: "prd" | "plan", status: string) {
	return {
		content: "# Example",
		modified: "2026-08-20T00:00:00.000Z",
		relatedArtifactIds: [],
		relativePath: `${type}s/example.md`,
		sourceModule: "workspace" as const,
		sourceHref: "/@fs/example.md",
		status,
		taskKey: "example",
		title: "Example",
		type,
	};
}
