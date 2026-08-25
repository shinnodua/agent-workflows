import type {
	Artifact,
	LifecycleStage,
	LifecycleStageState,
	TaskGroup,
} from "../../../types";
import { normalizeStatus } from "./status";

export const lifecycleStageNames = [
	"Research",
	"PRD",
	"Design",
	"Plan",
	"Implementation",
	"Validation",
	"Complete",
] as const;

export function buildLifecycleStages(group: TaskGroup): LifecycleStage[] {
	const stageArtifacts: Record<string, Artifact[]> = {
		Research: group.byType.research,
		PRD: group.byType.prd,
		Design: group.byType.design,
		Plan: group.byType.plan,
		Implementation: findEvidence(group.artifacts, /implementation evidence/i),
		Validation: findEvidence(group.artifacts, /validation evidence/i),
		Complete: [],
	};

	return lifecycleStageNames.map((name) => ({
		artifacts: stageArtifacts[name] ?? [],
		name,
		state: getStageState(name, stageArtifacts[name] ?? [], group.artifacts),
	}));
}

function getStageState(
	name: string,
	artifacts: Artifact[],
	allArtifacts: Artifact[],
): LifecycleStageState {
	if (name === "Implementation" || name === "Validation") {
		return artifacts.length > 0 ? "complete" : "not-verified";
	}

	if (name === "Complete") {
		const hasImplementation =
			findEvidence(allArtifacts, /implementation evidence/i).length > 0;
		const hasValidation =
			findEvidence(allArtifacts, /validation evidence/i).length > 0;
		return hasImplementation && hasValidation ? "complete" : "not-verified";
	}

	if (artifacts.length === 0) {
		return "missing";
	}

	const hasBlocked = artifacts.some(
		(artifact) => normalizeStatus(artifact.status) === "blocked",
	);
	if (hasBlocked) {
		return "blocked";
	}

	const hasCurrent = artifacts.some((artifact) =>
		["draft", "in-progress"].includes(normalizeStatus(artifact.status)),
	);
	return hasCurrent ? "current" : "complete";
}

function findEvidence(artifacts: Artifact[], pattern: RegExp) {
	return artifacts.filter((artifact) => pattern.test(artifact.content));
}
