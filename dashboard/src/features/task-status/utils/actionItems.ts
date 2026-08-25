import type {
	ActionItem,
	ActionItemSeverity,
	Artifact,
	ProjectRepository,
} from "../../../types";
import { resolveLinkedArtifact } from "./markdownLinks";
import { normalizeStatus } from "./status";

export const STALE_DRAFT_DAYS = 14;

const severityRank: Record<ActionItemSeverity, number> = {
	blocked: 0,
	high: 1,
	medium: 2,
	low: 3,
};

export function buildActionItems(
	artifacts: Artifact[],
	repositoriesOrNow:
		| ProjectRepository[]
		| Date = inferRepositoriesFromArtifacts(artifacts),
	now = new Date(),
): ActionItem[] {
	const repositories =
		repositoriesOrNow instanceof Date
			? inferRepositoriesFromArtifacts(artifacts)
			: repositoriesOrNow;
	const currentDate =
		repositoriesOrNow instanceof Date ? repositoriesOrNow : now;
	const items = [
		...findMissingPlans(artifacts),
		...findMissingSubmodulePlans(artifacts, repositories),
		...findStaleDrafts(artifacts, currentDate),
		...findBrokenLinks(artifacts),
	];

	const uniqueItems = new Map<string, ActionItem>();

	for (const item of items) {
		uniqueItems.set(item.id, item);
	}

	return Array.from(uniqueItems.values()).sort((first, second) => {
		return (
			severityRank[first.severity] - severityRank[second.severity] ||
			second.date.localeCompare(first.date) ||
			first.title.localeCompare(second.title)
		);
	});
}

export function filterActionItems(items: ActionItem[], query: string) {
	const normalizedQuery = query.trim().toLowerCase();

	if (!normalizedQuery) {
		return items;
	}

	return items.filter((item) =>
		[
			item.title,
			item.reason,
			item.severity,
			item.artifact.relativePath,
			item.artifact.status,
		]
			.join(" ")
			.toLowerCase()
			.includes(normalizedQuery),
	);
}

function findMissingPlans(artifacts: Artifact[]) {
	const plans = artifacts.filter((artifact) => artifact.type === "plan");

	return artifacts
		.filter(
			(artifact) =>
				artifact.type === "prd" &&
				normalizeStatus(artifact.status) === "approved" &&
				artifact.id &&
				!plans.some(
					(plan) =>
						plan.prdId === artifact.id ||
						plan.relatedArtifactIds.includes(artifact.id ?? ""),
				),
		)
		.map((artifact) =>
			createItem(
				"missing-plan",
				"blocked",
				"Needs implementation plan",
				`Approved PRD has no linked plan.`,
				artifact,
			),
		);
}

function findMissingSubmodulePlans(
	artifacts: Artifact[],
	repositories: ProjectRepository[],
) {
	const rootPlans = artifacts.filter(
		(artifact) =>
			artifact.type === "plan" &&
			artifact.sourceModule === "workspace" &&
			normalizeStatus(artifact.status) === "approved",
	);

	return rootPlans.flatMap((plan) => {
		const affectedModules = repositories.filter((repository) =>
			isModuleAffected(plan.content, repository),
		);

		return affectedModules
			.filter(
				(repository) =>
					!artifacts.some(
						(artifact) =>
							artifact.type === "plan" &&
							artifact.sourceModule === repository.id &&
							(artifact.parentPlanId === plan.id ||
								artifact.relatedArtifactIds.includes(plan.id ?? "")),
					),
			)
			.map((repository) =>
				createItem(
					`missing-submodule-plan-${repository.id}`,
					"high",
					"Missing submodule plan",
					`Approved plan names ${repository.name} as affected but has no linked detail plan.`,
					plan,
				),
			);
	});
}

function findStaleDrafts(artifacts: Artifact[], now: Date) {
	const cutoff = now.getTime() - STALE_DRAFT_DAYS * 24 * 60 * 60 * 1000;

	return artifacts
		.filter(
			(artifact) =>
				artifact.type !== "document" &&
				normalizeStatus(artifact.status) === "draft" &&
				getArtifactDate(artifact).getTime() < cutoff,
		)
		.map((artifact) =>
			createItem(
				"stale-draft",
				"medium",
				"Stale draft",
				`Draft has not been updated in ${STALE_DRAFT_DAYS} days.`,
				artifact,
			),
		);
}

function findBrokenLinks(artifacts: Artifact[]) {
	return artifacts.flatMap((artifact) => {
		const links = Array.from(
			artifact.content.matchAll(/\[[^\]]+\]\(([^)]+\.md(?:#[^)]*)?)\)/gi),
		);

		return links
			.map((match) => match[1]?.trim())
			.filter((href): href is string => Boolean(href))
			.filter((href) => !resolveLinkedArtifact(artifacts, artifact, href))
			.map((href) =>
				createItem(
					`broken-link-${artifact.relativePath}-${href}`,
					"high",
					"Broken workspace link",
					`Local Markdown target could not be found: ${href}`,
					artifact,
				),
			);
	});
}

function inferRepositoriesFromArtifacts(
	artifacts: Artifact[],
): ProjectRepository[] {
	const moduleIds = new Set(
		artifacts
			.map((artifact) => artifact.sourceModule)
			.filter((moduleId) => moduleId !== "workspace"),
	);

	return Array.from(moduleIds).map((moduleId) => ({
		id: moduleId,
		name: moduleId,
		path: `modules/${moduleId}`,
		purpose: "",
		scope: [],
		platforms: [],
	}));
}

function isModuleAffected(content: string, repository: ProjectRepository) {
	const moduleNames = [repository.id, repository.name].filter(Boolean);
	const moduleRow = new RegExp(
		`\\|\\s*[^a-z0-9]*(${moduleNames.map(escapeRegExp).join("|")})[^a-z0-9]*\\|([^\\n]+)`,
		"i",
	).exec(content)?.[2];

	if (moduleRow) {
		return !/not affected|no product submodule|not required/i.test(moduleRow);
	}

	return [
		repository.path,
		`modules/${repository.id}/`,
		`modules/${repository.name}/`,
	]
		.filter(Boolean)
		.some((repositoryPath) =>
			new RegExp(escapeRegExp(repositoryPath), "i").test(content),
		);
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createItem(
	check: string,
	severity: ActionItemSeverity,
	title: string,
	reason: string,
	artifact: Artifact,
): ActionItem {
	return {
		artifact,
		date: getArtifactDate(artifact).toISOString(),
		id: `${check}-${artifact.relativePath}`,
		reason,
		severity,
		title,
	};
}

function getArtifactDate(artifact: Artifact) {
	return new Date(artifact.updated ?? artifact.created ?? artifact.modified);
}
