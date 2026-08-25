import type {
	ArtifactType,
	ProjectRepository,
	WorkspaceModule,
} from "../../../types";

export type MetadataFormat = "structured" | "markdown";

export type WorkspaceMetadata = {
	id?: string;
	type?: ArtifactType;
	status?: string;
	created?: string;
	updated?: string;
	owner?: string;
	prdId?: string;
	planId?: string;
	parentPlanId?: string;
	relatedArtifactIds: string[];
};

export type MetadataParseResult = {
	format: MetadataFormat;
	metadata: WorkspaceMetadata;
	warnings: string[];
	errors: string[];
};

const artifactTypes = new Set<ArtifactType>([
	"prd",
	"plan",
	"design",
	"research",
	"document",
]);
const statuses = new Set([
	"draft",
	"approved",
	"in-progress",
	"blocked",
	"complete",
	"superseded",
	"unknown",
]);

export function parseWorkspaceMetadata(
	content: string,
	markdownMetadata: WorkspaceMetadata,
): MetadataParseResult {
	const frontMatter = getFrontMatter(content);

	if (!frontMatter) {
		return {
			errors: [],
			format: "markdown",
			metadata: markdownMetadata,
			warnings: [],
		};
	}

	const values = parseYamlSubset(frontMatter);
	const metadata: WorkspaceMetadata = {
		created: values.created,
		id: values.id,
		owner: values.owner,
		parentPlanId: values.parentPlanId,
		planId: values.planId,
		prdId: values.prdId,
		relatedArtifactIds: values.relatedArtifactIds ?? [],
		status: values.status,
		type: values.type as ArtifactType | undefined,
		updated: values.updated,
	};
	const errors = validateWorkspaceMetadata(metadata);

	return {
		errors,
		format: "structured",
		metadata,
		warnings: [],
	};
}

export function validateWorkspaceMetadata(metadata: WorkspaceMetadata) {
	const errors: string[] = [];

	if (!metadata.id) {
		errors.push("Missing required metadata field: id.");
	}
	if (!metadata.type || !artifactTypes.has(metadata.type)) {
		errors.push(`Invalid or missing metadata field: type.`);
	}
	if (!metadata.status || !statuses.has(metadata.status)) {
		errors.push(`Invalid or missing metadata field: status.`);
	}
	if (!metadata.created) {
		errors.push("Missing required metadata field: created.");
	}
	if (!metadata.updated) {
		errors.push("Missing required metadata field: updated.");
	}
	if (!metadata.owner) {
		errors.push("Missing required metadata field: owner.");
	}

	for (const field of ["created", "updated"] as const) {
		const value = metadata[field];
		if (value && Number.isNaN(Date.parse(value))) {
			errors.push(`Invalid date in metadata field: ${field}.`);
		}
	}

	return errors;
}

export function parseInlineList(value: string) {
	const trimmed = value.trim();
	if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
		return [];
	}

	return trimmed
		.slice(1, -1)
		.split(",")
		.map((item) => stripQuotes(item.trim()))
		.filter(Boolean);
}

function getFrontMatter(content: string) {
	const normalized = content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
	if (!normalized.startsWith("---\n")) {
		return undefined;
	}

	const endIndex = normalized.indexOf("\n---", 4);
	return endIndex === -1 ? undefined : normalized.slice(4, endIndex);
}

function parseYamlSubset(frontMatter: string) {
	const values: Record<string, string | string[] | undefined> = {};

	for (const line of frontMatter.split("\n")) {
		const match = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/.exec(line.trim());
		if (!match) {
			continue;
		}

		const key = match[1] ?? "";
		const rawValue = match[2] ?? "";
		values[key] = rawValue.startsWith("[")
			? parseInlineList(rawValue)
			: stripQuotes(rawValue);
	}

	return values as WorkspaceMetadata;
}

function stripQuotes(value: string) {
	return value.replace(/^['"]|['"]$/g, "").trim();
}

export function sourceModuleFromPath(
	relativePath: string,
	repositories: ProjectRepository[] = [],
): WorkspaceModule {
	const repository = repositories.find((candidate) =>
		relativePath.startsWith(`${candidate.path.replace(/\/$/, "")}/`),
	);

	if (repository) {
		return repository.id;
	}

	return "workspace";
}
