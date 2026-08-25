import fs from "node:fs";
import path from "node:path";
import {
	parseWorkspaceMetadata,
	type WorkspaceMetadata,
} from "../dashboard/src/features/task-status/utils/workspaceMetadata";
import type { ArtifactType, ProjectProfile } from "../dashboard/src/types";

type IntegrityArtifact = {
	content: string;
	id?: string;
	metadata: WorkspaceMetadata;
	relativePath: string;
};

const workspaceRoot = process.cwd();
const workspaceConfig = loadWorkspaceConfig();
const projectProfile = loadProjectProfile(workspaceConfig.projectProfile);
const artifactTargets = buildArtifactTargets(workspaceConfig, projectProfile);
const artifacts: IntegrityArtifact[] = [];
const errors: string[] = [];
const warnings: string[] = [];

for (const { directory, type } of artifactTargets) {
	for (const filePath of walkMarkdown(path.join(workspaceRoot, directory))) {
		const relativePath = path.relative(workspaceRoot, filePath);
		const content = fs.readFileSync(filePath, "utf8");
		const metadata = legacyMetadata(content, type);
		const parsed = parseWorkspaceMetadata(content, metadata);
		const id = parsed.metadata.id ?? metadata.id;

		if (parsed.errors.length > 0) {
			errors.push(...parsed.errors.map((error) => `${relativePath}: ${error}`));
		}
		if (parsed.warnings.length > 0) {
			warnings.push(`${relativePath}: ${parsed.warnings.join(" ")}`);
		}

		artifacts.push({
			content,
			id,
			metadata: parsed.metadata,
			relativePath,
		});
	}
}

const ids = new Map<string, string[]>();
for (const artifact of artifacts) {
	if (!artifact.id) continue;
	ids.set(artifact.id, [
		...(ids.get(artifact.id) ?? []),
		artifact.relativePath,
	]);
}
for (const [id, paths] of ids) {
	if (paths.length > 1) {
		const message = `Duplicate artifact ID ${id}: ${paths.join(", ")}`;
		if (paths.some((artifactPath) => artifactPath.startsWith("modules/"))) {
			warnings.push(message);
		} else {
			errors.push(message);
		}
	}
}

const knownIds = new Set(Array.from(ids.keys(), (id) => id.toUpperCase()));
for (const artifact of artifacts) {
	const references = [
		artifact.metadata.prdId,
		artifact.metadata.planId,
		artifact.metadata.parentPlanId,
		...artifact.metadata.relatedArtifactIds,
	].filter((value): value is string => Boolean(value));
	for (const reference of references) {
		if (reference.toUpperCase() === artifact.id?.toUpperCase()) continue;
		if (!knownIds.has(reference.toUpperCase())) {
			warnings.push(
				`${artifact.relativePath}: unresolved artifact ID ${reference}`,
			);
		}
	}

	for (const match of artifact.content.matchAll(
		/\[[^\]]+\]\(([^)]+\.md(?:#[^)]*)?)\)/gi,
	)) {
		const href = match[1]?.split("#")[0];
		if (!href || /^(https?:|mailto:)/i.test(href)) continue;
		const target = path.resolve(
			path.dirname(path.join(workspaceRoot, artifact.relativePath)),
			href,
		);
		if (!target.startsWith(workspaceRoot) || !fs.existsSync(target)) {
			warnings.push(`${artifact.relativePath}: unresolved local link ${href}`);
		}
	}
}

for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
console.log(
	`Workspace integrity: ${artifacts.length} artifacts, ${errors.length} errors, ${warnings.length} warnings.`,
);
process.exitCode = errors.length > 0 ? 1 : 0;

type WorkspaceConfig = {
	artifactDirectories?: string[];
	projectProfile?: string;
};

function loadWorkspaceConfig(): WorkspaceConfig {
	const configPath = path.join(workspaceRoot, "workspace.config.json");
	if (!fs.existsSync(configPath)) {
		return {};
	}

	return JSON.parse(fs.readFileSync(configPath, "utf8")) as WorkspaceConfig;
}

function loadProjectProfile(profilePath = "project/repositories.json") {
	const resolvedPath = path.join(workspaceRoot, profilePath);
	if (!fs.existsSync(resolvedPath)) {
		return { repositories: [] } satisfies ProjectProfile;
	}

	return JSON.parse(fs.readFileSync(resolvedPath, "utf8")) as ProjectProfile;
}

function buildArtifactTargets(
	config: WorkspaceConfig,
	profile: ProjectProfile,
): Array<{ directory: string; type: ArtifactType }> {
	const rootTargets = (
		config.artifactDirectories ?? [
			"prds",
			"plans",
			"designs",
			"research",
			"docs",
		]
	).flatMap((directory) => {
		const type = artifactTypeFromDirectory(directory);
		return type ? [{ directory, type }] : [];
	});
	const submoduleTargets = profile.repositories.flatMap((repository) => {
		const directories = repository.artifactDirectories ?? {};
		return [
			directories.plans
				? { directory: directories.plans, type: "plan" as const }
				: undefined,
			directories.designs
				? { directory: directories.designs, type: "design" as const }
				: undefined,
			directories.research
				? { directory: directories.research, type: "research" as const }
				: undefined,
			directories.docs
				? { directory: directories.docs, type: "document" as const }
				: undefined,
		].filter((target): target is NonNullable<typeof target> => Boolean(target));
	});

	return [...rootTargets, ...submoduleTargets];
}

function artifactTypeFromDirectory(
	directory: string,
): ArtifactType | undefined {
	const typeByDirectory: Record<string, ArtifactType> = {
		designs: "design",
		docs: "document",
		plans: "plan",
		prds: "prd",
		research: "research",
	};

	return typeByDirectory[directory];
}

function legacyMetadata(
	content: string,
	type: ArtifactType,
): WorkspaceMetadata {
	const idLabelByType: Partial<Record<ArtifactType, string>> = {
		design: "Design ID",
		plan: "Plan ID",
		prd: "PRD ID",
		research: "Research ID",
	};
	const idLabel = idLabelByType[type];
	return {
		created: getField(content, "Created"),
		id: idLabel ? getField(content, idLabel) : undefined,
		owner: getField(content, "Owner"),
		parentPlanId: getField(content, "Parent plan ID"),
		planId: getField(content, "Plan ID"),
		prdId: getField(content, "PRD ID"),
		relatedArtifactIds: Array.from(
			content.matchAll(/\b(?:PRD|PLAN|DESIGN|RESEARCH)-\d{8}-[a-z0-9-]+\b/gi),
		).map((match) => match[0].toUpperCase()),
		status: getField(content, "Status"),
		updated: getField(content, "Last updated"),
	};
}

function getField(content: string, label: string) {
	return content
		.match(new RegExp(`^\\s*-?\\s*${label}:\\s*([^\\n]+)`, "im"))?.[1]
		?.trim()
		.replace(/^`|`$/g, "");
}

function walkMarkdown(directory: string): string[] {
	if (!fs.existsSync(directory)) return [];
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) return walkMarkdown(entryPath);
		return entry.isFile() && entry.name.endsWith(".md") ? [entryPath] : [];
	});
}
