import type {
	Artifact,
	ArtifactType,
	DashboardView,
	DocumentModuleFilter,
	DocumentModuleTab,
	TaskGroup,
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

export function buildTaskGroups(filteredArtifacts: Artifact[]) {
	const groups = groupRelatedTaskArtifacts(filteredArtifacts);

	return Array.from(groups.entries())
		.map(([key, groupArtifacts]) => buildTaskGroup(key, groupArtifacts))
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

function groupRelatedTaskArtifacts(artifacts: Artifact[]) {
	const taskArtifacts = artifacts.filter(
		(artifact) => artifact.type !== "document",
	);
	const unionFind = new UnionFind(taskArtifacts.length);
	const indexesByTaskKey = new Map<string, number[]>();
	const indexById = new Map<string, number>();

	taskArtifacts.forEach((artifact, index) => {
		if (artifact.taskKey) {
			indexesByTaskKey.set(artifact.taskKey, [
				...(indexesByTaskKey.get(artifact.taskKey) ?? []),
				index,
			]);
		}

		if (artifact.id) {
			indexById.set(artifact.id, index);
		}
	});

	for (const indexes of indexesByTaskKey.values()) {
		unionIndexes(unionFind, indexes);
	}

	taskArtifacts.forEach((artifact, index) => {
		for (const relatedId of getRelatedArtifactIds(artifact)) {
			const relatedIndex = indexById.get(relatedId);

			if (relatedIndex !== undefined) {
				unionFind.union(index, relatedIndex);
			}
		}
	});

	const groupsByRoot = new Map<number, Artifact[]>();

	taskArtifacts.forEach((artifact, index) => {
		const root = unionFind.find(index);
		groupsByRoot.set(root, [...(groupsByRoot.get(root) ?? []), artifact]);
	});

	const groups = new Map<string, Artifact[]>();

	for (const groupArtifacts of groupsByRoot.values()) {
		groups.set(getTaskGroupKey(groupArtifacts), groupArtifacts);
	}

	return groups;
}

function unionIndexes(unionFind: UnionFind, indexes: number[]) {
	const [firstIndex, ...remainingIndexes] = indexes;

	if (firstIndex === undefined) {
		return;
	}

	for (const index of remainingIndexes) {
		unionFind.union(firstIndex, index);
	}
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

function buildTaskGroup(key: string, groupArtifacts: Artifact[]): TaskGroup {
	return {
		artifacts: groupArtifacts,
		byType: buildArtifactsByType(groupArtifacts),
		key,
		description: getTaskDescription(groupArtifacts),
		status: getGroupStatus(groupArtifacts),
		title: getTaskTitle(groupArtifacts),
		updated: getLatestArtifactDate(groupArtifacts),
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
