import type {
	Artifact,
	ArtifactType,
	DashboardView,
	DocumentModuleFilter,
	DocumentModuleTab,
	TaskGroup,
	TaskSummaries,
} from "../../../types";
import { artifactTypes, statusRank } from "../taskStatusConfig";
import { normalizeStatus } from "./status";

export function filterArtifacts(artifacts: Artifact[], query: string) {
	const normalizedQuery = query.trim().toLowerCase();

	if (!normalizedQuery) {
		return sortArtifactsByTime(artifacts);
	}

	return sortArtifactsByTime(
		artifacts.filter((artifact) =>
			getArtifactSearchValues(artifact).some((value) =>
				value.toLowerCase().includes(normalizedQuery),
			),
		),
	);
}

export function buildTaskGroups(
	artifacts: Artifact[],
	summaries: TaskSummaries = {},
	visibleArtifacts = artifacts,
) {
	const groups = groupRelatedTaskArtifacts(artifacts, summaries);
	const visible = new Set(
		visibleArtifacts.map(({ relativePath }) => relativePath),
	);

	return Array.from(groups.entries())
		.filter(([, { artifacts }]) =>
			artifacts.some(({ relativePath }) => visible.has(relativePath)),
		)
		.map(([key, { artifacts, summary }]) =>
			buildTaskGroup(key, artifacts, summary),
		)
		.sort(sortTaskGroups);
}

export function countArtifactsByType(
	artifacts: Artifact[],
	type: ArtifactType,
) {
	return artifacts.filter((artifact) => artifact.type === type).length;
}

export function getVisibleFiles(
	filteredArtifacts: Artifact[],
	activeView: DashboardView,
) {
	if (activeView === "task") {
		return filteredArtifacts.filter((artifact) => artifact.type !== "document");
	}

	if (
		activeView === "workflow" ||
		activeView === "action-required" ||
		activeView === "lifecycle"
	) {
		return [];
	}

	return filteredArtifacts.filter((artifact) => artifact.type === activeView);
}

export function filterDocumentsByModule(
	artifacts: Artifact[],
	moduleFilter: DocumentModuleFilter,
) {
	const documents = artifacts.filter(
		(artifact) => artifact.type === "document",
	);

	if (moduleFilter === "all") {
		return documents;
	}

	return artifacts.filter(
		(artifact) =>
			artifact.type === "document" && artifact.sourceModule === moduleFilter,
	);
}

export function countDocumentsByModule(
	artifacts: Artifact[],
	documentModuleTabs: DocumentModuleTab[] = inferDocumentModuleTabs(artifacts),
) {
	const documents = artifacts.filter(
		(artifact) => artifact.type === "document",
	);

	return Object.fromEntries(
		documentModuleTabs.map((tab) => [
			tab.module,
			tab.module === "all"
				? documents.length
				: documents.filter((artifact) => artifact.sourceModule === tab.module)
						.length,
		]),
	) as Record<DocumentModuleFilter, number>;
}

function inferDocumentModuleTabs(artifacts: Artifact[]): DocumentModuleTab[] {
	const moduleIds = Array.from(
		new Set(artifacts.map((artifact) => artifact.sourceModule)),
	).sort((first, second) => first.localeCompare(second));

	return [
		{ module: "all", label: "All" },
		...moduleIds.map((moduleId) => ({
			module: moduleId,
			label: moduleId === "workspace" ? "Workspace" : moduleId,
		})),
	];
}

function getArtifactSearchValues(artifact: Artifact) {
	return [
		artifact.title,
		artifact.status,
		artifact.id,
		artifact.prdId,
		artifact.planId,
		...artifact.relatedArtifactIds,
		artifact.relativePath,
		artifact.sourceModule,
		artifact.taskKey,
	].filter((value): value is string => Boolean(value));
}

function groupRelatedTaskArtifacts(
	artifacts: Artifact[],
	summaries: TaskSummaries,
) {
	const taskArtifacts = artifacts.filter(
		(artifact) => artifact.type !== "document",
	);
	const unionFind = new UnionFind(taskArtifacts.length);
	const indexesByTaskKey = new Map<string, number[]>();
	const indexById = new Map<string, number>();
	const indexByPrd = new Map<string, number>();
	const prdByRoot = new Map<number, string>();

	function join(first: number, second: number) {
		const firstRoot = unionFind.find(first);
		const secondRoot = unionFind.find(second);
		const firstPrd = prdByRoot.get(firstRoot);
		const secondPrd = prdByRoot.get(secondRoot);

		if (firstPrd && secondPrd && firstPrd !== secondPrd) return;

		unionFind.union(firstRoot, secondRoot);
		const prd = firstPrd ?? secondPrd;
		if (prd) prdByRoot.set(firstRoot, prd);
	}

	taskArtifacts.forEach((artifact, index) => {
		if (artifact.taskKey) {
			indexesByTaskKey.set(artifact.taskKey, [
				...(indexesByTaskKey.get(artifact.taskKey) ?? []),
				index,
			]);
		}

		if (artifact.id) {
			indexById.set(artifact.id.toLowerCase(), index);
		}

		const prd = getFeatureIdentity(artifact, summaries);
		if (prd) {
			prdByRoot.set(index, prd);
			const existing = indexByPrd.get(prd);
			if (existing === undefined) indexByPrd.set(prd, index);
			else join(existing, index);
		}
	});

	taskArtifacts.forEach((artifact, index) => {
		for (const relatedId of getRelatedArtifactIds(artifact)) {
			const relatedIndex = indexById.get(relatedId.toLowerCase());

			if (relatedIndex !== undefined) {
				join(index, relatedIndex);
			}
		}
	});

	for (const indexes of indexesByTaskKey.values()) {
		const prds = new Set(
			indexes
				.map((index) => prdByRoot.get(unionFind.find(index)))
				.filter(Boolean),
		);
		const [first, ...remaining] = indexes;
		if (first === undefined || prds.size > 1) continue;
		for (const index of remaining) join(first, index);
	}

	const groupsByRoot = new Map<number, Artifact[]>();

	taskArtifacts.forEach((artifact, index) => {
		const root = unionFind.find(index);
		groupsByRoot.set(root, [...(groupsByRoot.get(root) ?? []), artifact]);
	});

	const groups = new Map<
		string,
		{ artifacts: Artifact[]; summary?: TaskGroup["summary"] }
	>();
	const reservedKeys = new Set(prdByRoot.values());

	for (const [root, groupArtifacts] of groupsByRoot) {
		const featureId = prdByRoot.get(root);
		const legacyKey = getTaskGroupKey(groupArtifacts);
		const key =
			featureId ??
			(reservedKeys.has(legacyKey) || groups.has(legacyKey)
				? `${legacyKey}:${groupArtifacts[0]?.relativePath}`
				: legacyKey);
		groups.set(key, {
			artifacts: groupArtifacts,
			summary:
				featureId && Object.hasOwn(summaries, featureId)
					? summaries[featureId]
					: undefined,
		});
	}

	return groups;
}

function getCanonicalPrdId(artifact: Artifact) {
	const canonical = /^prd-\d{8}-[a-z0-9-]+$/i;
	const explicit =
		artifact.type === "prd" ? (artifact.id ?? artifact.prdId) : artifact.prdId;
	if (explicit && canonical.test(explicit)) return explicit.toLowerCase();

	if (artifact.type === "prd") return;
	const references = new Set(
		artifact.relatedArtifactIds
			.filter((id) => canonical.test(id))
			.map((id) => id.toLowerCase()),
	);
	return references.size === 1 ? references.values().next().value : undefined;
}

function getFeatureIdentity(artifact: Artifact, summaries: TaskSummaries) {
	if (artifact.type === "research" && artifact.id) {
		const provisional = `pending-${artifact.id.toLowerCase()}`;
		if (Object.hasOwn(summaries, provisional)) return provisional;
	}

	return getCanonicalPrdId(artifact);
}

function getRelatedArtifactIds(artifact: Artifact) {
	return [
		artifact.prdId,
		artifact.planId,
		artifact.parentPlanId,
		...artifact.relatedArtifactIds,
	].filter((id): id is string => Boolean(id));
}

function getTaskGroupKey(groupArtifacts: Artifact[]) {
	const preferred =
		groupArtifacts.find((artifact) => artifact.type === "prd") ??
		groupArtifacts.find((artifact) => artifact.type === "plan") ??
		groupArtifacts.find((artifact) => artifact.type === "research") ??
		groupArtifacts[0];

	return preferred?.taskKey || "ungrouped";
}

function buildTaskGroup(
	key: string,
	groupArtifacts: Artifact[],
	summary: TaskGroup["summary"],
): TaskGroup {
	return {
		artifacts: groupArtifacts,
		byType: buildArtifactsByType(groupArtifacts),
		key,
		description: getTaskDescription(groupArtifacts),
		status: getGroupStatus(groupArtifacts),
		title: getTaskTitle(groupArtifacts),
		updated: getLatestArtifactDate(groupArtifacts),
		summary,
	};
}

function getTaskDescription(groupArtifacts: Artifact[]) {
	const preferred =
		groupArtifacts.find(
			(artifact) => artifact.type === "prd" && artifact.goal,
		) ??
		groupArtifacts.find(
			(artifact) => artifact.type === "plan" && artifact.goal,
		);

	return preferred?.goal;
}

function buildArtifactsByType(groupArtifacts: Artifact[]) {
	return Object.fromEntries(
		artifactTypes.map((artifactType) => [
			artifactType.type,
			sortArtifactsByTime(
				groupArtifacts.filter(
					(artifact) => artifact.type === artifactType.type,
				),
			),
		]),
	) as Record<ArtifactType, Artifact[]>;
}

function getGroupStatus(groupArtifacts: Artifact[]) {
	const statuses = groupArtifacts.map((artifact) =>
		normalizeStatus(artifact.status),
	);

	return (
		statusRank.find((status) => statuses.includes(status)) ??
		statuses[0] ??
		"unknown"
	);
}

function getTaskTitle(groupArtifacts: Artifact[]) {
	const preferred =
		groupArtifacts.find((artifact) => artifact.type === "prd") ??
		groupArtifacts.find((artifact) => artifact.type === "plan") ??
		groupArtifacts[0];

	return preferred?.title ?? "Untitled task";
}

function getLatestArtifactDate(groupArtifacts: Artifact[]) {
	return groupArtifacts
		.map(getArtifactTime)
		.filter((date): date is string => Boolean(date))
		.sort()
		.at(-1);
}

function getArtifactTime(artifact: Artifact) {
	return artifact.updated ?? artifact.created ?? artifact.modified;
}

function sortArtifactsByTime(artifacts: Artifact[]) {
	return [...artifacts].sort((first, second) => {
		const firstDate = getArtifactTime(first);
		const secondDate = getArtifactTime(second);

		return (
			secondDate.localeCompare(firstDate) ||
			first.relativePath.localeCompare(second.relativePath, "en")
		);
	});
}

function sortTaskGroups(first: TaskGroup, second: TaskGroup) {
	const firstDate = first.updated ?? "";
	const secondDate = second.updated ?? "";

	return (
		secondDate.localeCompare(firstDate) ||
		first.title.localeCompare(second.title)
	);
}

class UnionFind {
	private readonly parents: number[];

	constructor(size: number) {
		this.parents = Array.from({ length: size }, (_value, index) => index);
	}

	find(index: number): number {
		const parent = this.parents[index] ?? index;

		if (parent === index) {
			return index;
		}

		const root = this.find(parent);
		this.parents[index] = root;
		return root;
	}

	union(first: number, second: number) {
		const firstRoot = this.find(first);
		const secondRoot = this.find(second);

		if (firstRoot !== secondRoot) {
			this.parents[secondRoot] = firstRoot;
		}
	}
}
