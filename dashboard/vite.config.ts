import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import {
	buildScanReportFromResults,
	type FileScanResult,
} from "./src/features/task-status/utils/hardnessScanner";
import { parseWorkspaceMetadata } from "./src/features/task-status/utils/workspaceMetadata";
import type {
	Artifact,
	ArtifactType,
	ProjectProfile,
	WorkspaceModule,
} from "./src/types";

type WorkspaceConfig = {
	artifactDirectories?: string[];
	projectProfile?: string;
};

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(currentDir, "..");
const workspaceRoot = path.resolve(
	process.env.WORKFLOWS_WORKSPACE_ROOT ?? packageRoot,
);
const virtualModuleId = "virtual:workspace-artifacts";
const resolvedVirtualModuleId = `\0${virtualModuleId}`;
const artifactEndpoint = "/__workspace-artifacts.json";
const workspaceConfig = loadWorkspaceConfig();
const projectProfile = loadProjectProfile(workspaceConfig);
const artifactTargets = buildArtifactTargets(workspaceConfig, projectProfile);

const statusPattern =
	/^\s*-\s*Status:\s*`?([^`\n]+?)`?\s*$|^\s*Status:\s*`?([^`\n]+?)`?\s*$/im;

function walkMarkdown(directory: string): string[] {
	if (!fs.existsSync(directory)) {
		return [];
	}

	const entries = fs.readdirSync(directory, { withFileTypes: true });
	const files: string[] = [];

	for (const entry of entries) {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			if ([".git", "dist", "node_modules"].includes(entry.name)) {
				continue;
			}
			files.push(...walkMarkdown(entryPath));
			continue;
		}

		if (entry.isFile() && entry.name.endsWith(".md")) {
			files.push(entryPath);
		}
	}

	return files;
}

function getFirstMatch(content: string, patterns: RegExp[]) {
	for (const pattern of patterns) {
		const match = content.match(pattern);
		const value = match?.[1]?.trim();
		if (value) {
			return value.replace(/^`|`$/g, "");
		}
	}

	return undefined;
}

function titleFrom(content: string, relativePath: string) {
	return (
		getFirstMatch(content, [
			/^\s*-\s*Title:\s*`?([^`\n]+?)`?\s*$/im,
			/^#\s+(.+)$/m,
		]) ?? path.basename(relativePath, ".md")
	);
}

function statusFrom(content: string) {
	const match = content.match(statusPattern);
	return (match?.[1] ?? match?.[2] ?? "unknown").trim().replace(/^`|`$/g, "");
}

function loadWorkspaceConfig(): WorkspaceConfig {
	const configPath = path.join(workspaceRoot, "workspace.config.json");
	if (!fs.existsSync(configPath)) {
		return {};
	}

	return JSON.parse(fs.readFileSync(configPath, "utf8")) as WorkspaceConfig;
}

function loadProjectProfile(config: WorkspaceConfig): ProjectProfile {
	const profilePath = path.join(
		workspaceRoot,
		config.projectProfile ?? "project/repositories.json",
	);
	if (!fs.existsSync(profilePath)) {
		return { repositories: [] };
	}

	return JSON.parse(fs.readFileSync(profilePath, "utf8")) as ProjectProfile;
}

function buildArtifactTargets(
	config: WorkspaceConfig,
	profile: ProjectProfile,
): Array<{
	type: ArtifactType;
	directory: string;
	sourceModule: WorkspaceModule;
}> {
	const rootTypeByDirectory: Record<string, ArtifactType> = {
		designs: "design",
		docs: "document",
		plans: "plan",
		prds: "prd",
		research: "research",
	};
	const rootTargets = (
		config.artifactDirectories ?? [
			"prds",
			"plans",
			"designs",
			"research",
			"docs",
		]
	).flatMap((directory) => {
		const type = rootTypeByDirectory[directory];
		return type ? [{ type, directory, sourceModule: "workspace" }] : [];
	});
	const submoduleTargets = profile.repositories.flatMap((repository) => {
		const directories = repository.artifactDirectories ?? {};
		return [
			directories.plans
				? {
						type: "plan" as const,
						directory: directories.plans,
						sourceModule: repository.id,
					}
				: undefined,
			directories.designs
				? {
						type: "design" as const,
						directory: directories.designs,
						sourceModule: repository.id,
					}
				: undefined,
			directories.research
				? {
						type: "research" as const,
						directory: directories.research,
						sourceModule: repository.id,
					}
				: undefined,
			directories.docs
				? {
						type: "document" as const,
						directory: directories.docs,
						sourceModule: repository.id,
					}
				: undefined,
		].filter((target): target is NonNullable<typeof target> => Boolean(target));
	});

	return [...rootTargets, ...submoduleTargets];
}

function idFrom(type: ArtifactType, content: string) {
	const labelByType: Record<ArtifactType, string> = {
		design: "Design ID",
		document: "Document ID",
		plan: "Plan ID",
		prd: "PRD ID",
		research: "Research ID",
	};

	return getFirstMatch(content, [
		new RegExp(
			`^\\s*-\\s*${labelByType[type]}:\\s*\`?([^\`\\n]+?)\`?\\s*$`,
			"im",
		),
	]);
}

function relatedArtifactIdsFrom(content: string, ownId?: string) {
	const idPattern = /\b(?:PRD|PLAN|DESIGN|RESEARCH)-\d{8}-[a-z0-9-]+\b/gi;
	const ids = new Set<string>();

	for (const match of content.matchAll(idPattern)) {
		const id = match[0];

		if (id !== ownId) {
			ids.add(id);
		}
	}

	return Array.from(ids);
}

function goalFrom(content: string) {
	const lines = content.replace(/\r\n/g, "\n").split("\n");
	const headingIndex = lines.findIndex((line) =>
		/^##\s+Goal(s)?\s*$/i.test(line),
	);

	if (headingIndex === -1) {
		return undefined;
	}

	const sectionLines = getSectionLines(lines, headingIndex + 1);
	const goalLines = sectionLines
		.map((line) => line.trim())
		.filter(Boolean)
		.filter((line) => !/^[-*]\s*`?<[^>]+>`?\s*$/.test(line))
		.map((line) => line.replace(/^[-*]\s+/, "").trim());

	return goalLines.join(" ").trim() || undefined;
}

function getSectionLines(lines: string[], startIndex: number) {
	const sectionLines: string[] = [];

	for (let index = startIndex; index < lines.length; index += 1) {
		const line = lines[index] ?? "";

		if (/^##\s+/.test(line)) {
			break;
		}

		sectionLines.push(line);
	}

	return sectionLines;
}

function taskKeyFrom(artifact: {
	id?: string;
	prdId?: string;
	planId?: string;
	parentPlanId?: string;
	relativePath: string;
	title: string;
}) {
	const source =
		artifact.prdId ??
		artifact.parentPlanId ??
		artifact.planId ??
		artifact.id ??
		artifact.relativePath.replace(/\.md$/i, "") ??
		artifact.title;

	return source
		.toLowerCase()
		.replace(/^(prd|plan|design|research)-\d{8}-/, "")
		.replace(/^(prd|plan|design|research)-/, "")
		.replace(/-\w+$/, (suffix) => {
			if (["-core", "-api", "-web", "-app"].includes(suffix)) {
				return "";
			}
			return suffix;
		})
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

function readArtifact(
	filePath: string,
	type: ArtifactType,
	sourceModule: WorkspaceModule,
): Artifact {
	const content = fs.readFileSync(filePath, "utf8");
	const modified = fs.statSync(filePath).mtime.toISOString();
	const relativePath = path.relative(workspaceRoot, filePath);
	const prdId = getFirstMatch(content, [
		/^\s*-\s*PRD ID:\s*`?([^`\n]+?)`?\s*$/im,
	]);
	const planId = getFirstMatch(content, [
		/^\s*-\s*Plan ID:\s*`?([^`\n]+?)`?\s*$/im,
	]);
	const parentPlanId = getFirstMatch(content, [
		/^\s*-\s*Parent plan ID:\s*`?([^`\n]+?)`?\s*$/im,
	]);
	const id = idFrom(type, content);
	const markdownMetadata = {
		created: getFirstMatch(content, [
			/^\s*-\s*Created:\s*`?([^`\n]+?)`?\s*$/im,
		]),
		id,
		parentPlanId,
		planId,
		prdId,
		relatedArtifactIds: relatedArtifactIdsFrom(content, id),
		status: statusFrom(content),
		type,
		updated: getFirstMatch(content, [
			/^\s*-\s*Last updated:\s*`?([^`\n]+?)`?\s*$/im,
		]),
		owner: getFirstMatch(content, [/^\s*-\s*Owner:\s*`?([^`\n]+?)`?\s*$/im]),
	};
	const parsedMetadata = parseWorkspaceMetadata(content, markdownMetadata);
	const metadata = parsedMetadata.metadata;
	const artifact = {
		content,
		created: metadata.created,
		goal: goalFrom(content),
		id: metadata.id,
		metadataErrors: parsedMetadata.errors,
		metadataFormat: parsedMetadata.format,
		metadataWarnings: parsedMetadata.warnings,
		modified,
		owner: metadata.owner,
		parentPlanId: metadata.parentPlanId,
		planId: metadata.planId,
		prdId: metadata.prdId,
		relatedArtifactIds: metadata.relatedArtifactIds,
		relativePath,
		sourceModule,
		sourceHref: `/@fs/${filePath}`,
		status: metadata.status ?? "unknown",
		title: titleFrom(content, relativePath),
		type: metadata.type ?? type,
		updated: metadata.updated,
	};

	return {
		...artifact,
		taskKey: taskKeyFrom(artifact),
	};
}

function walkCodeFiles(directory: string): string[] {
	if (!fs.existsSync(directory)) {
		return [];
	}

	const entries = fs.readdirSync(directory, { withFileTypes: true });
	const files: string[] = [];

	for (const entry of entries) {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			if (
				["node_modules", "dist", "target", ".git", "build"].includes(entry.name)
			) {
				continue;
			}
			files.push(...walkCodeFiles(entryPath));
			continue;
		}

		if (entry.isFile() && /\.(tsx?|rs)$/i.test(entry.name)) {
			files.push(entryPath);
		}
	}

	return files;
}

function scanCodeFile(filePath: string): FileScanResult {
	const content = fs.readFileSync(filePath, "utf8");
	const lines = content.split("\n");
	const lineCount = lines.length;
	const relativePath = path.relative(workspaceRoot, filePath);
	const isTsx = filePath.endsWith(".tsx");

	let rawHtmlTagsCount = 0;
	let destructuredParamPropsCount = 0;
	let missingBlockBracesCount = 0;
	let useCallbackCount = 0;
	let hardcodedStringJsxCount = 0;

	if (isTsx) {
		const rawTagsMatches = content.match(
			/<(div|span|p|button|input|select)\b/g,
		);
		rawHtmlTagsCount = rawTagsMatches ? rawTagsMatches.length : 0;

		const destructuredParamMatches = content.match(
			/function\s+[A-Z]\w*\s*\(\s*\{/g,
		);
		destructuredParamPropsCount = destructuredParamMatches
			? destructuredParamMatches.length
			: 0;

		const jsxTextMatches = content.match(/>\s*[A-Za-z][^<{\n]{1,100}\s*</g);
		hardcodedStringJsxCount = jsxTextMatches ? jsxTextMatches.length : 0;
	}

	const missingBracesMatches = content.match(
		/\bif\s*\([^)]+\)\s*(?!\{)[^\n;]+;/g,
	);
	missingBlockBracesCount = missingBracesMatches
		? missingBracesMatches.length
		: 0;

	const useCallbackMatches = content.match(/\buseCallback\b/g);
	useCallbackCount = useCallbackMatches ? useCallbackMatches.length : 0;

	const stateSyncEffectMatches = content.match(
		/useEffect\s*\([\s\S]{0,500}?\bset[A-Z]\w*\s*\(/g,
	);
	const consoleErrorMatches = content.match(/\bconsole\.error\s*\(/g);
	const functionMatches = content.match(
		/\b(?:function\s+\w+|(?:const|let)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)\s*\{/g,
	);

	let longFunctionCount = 0;
	for (const match of functionMatches ?? []) {
		const start = content.indexOf(match);
		const openingBrace = content.indexOf("{", start);
		let depth = 0;
		let closingBrace = -1;

		for (let index = openingBrace; index < content.length; index += 1) {
			if (content[index] === "{") depth += 1;
			if (content[index] === "}") depth -= 1;
			if (depth === 0) {
				closingBrace = index;
				break;
			}
		}

		if (
			closingBrace >= 0 &&
			content.slice(start, closingBrace).split("\n").length > 50
		) {
			longFunctionCount += 1;
		}
	}

	return {
		relativePath,
		lineCount,
		rawHtmlTagsCount,
		destructuredParamPropsCount,
		missingBlockBracesCount,
		useCallbackCount,
		rawUseEffectCount: (content.match(/\buseEffect\b/g) || []).length,
		stateSyncEffectCount: stateSyncEffectMatches?.length ?? 0,
		consoleErrorCount: consoleErrorMatches?.length ?? 0,
		longFunctionCount,
		hardcodedStringJsxCount,
	};
}

function loadHardnessScanReport(timestamp: string) {
	const scanDirs = [
		...projectProfile.repositories.flatMap(
			(repository) => repository.codeScanDirectories ?? [],
		),
		path.join(workspaceRoot, "dashboard/src"),
	].map((directory) =>
		path.isAbsolute(directory)
			? directory
			: path.join(workspaceRoot, directory),
	);

	const codeFiles = scanDirs.flatMap((dir) => walkCodeFiles(dir));
	const scanResults = codeFiles.map((file) => scanCodeFile(file));

	return buildScanReportFromResults(scanResults, timestamp);
}

function loadArtifacts() {
	return artifactTargets
		.flatMap(({ type, directory, sourceModule }) =>
			walkMarkdown(path.join(workspaceRoot, directory)).map((filePath) =>
				readArtifact(filePath, type, sourceModule),
			),
		)
		.sort(sortArtifactsByTime);
}

function loadArtifactPayload() {
	const generatedAt = new Date().toISOString();
	return {
		artifacts: loadArtifacts(),
		hardnessReport: loadHardnessScanReport(generatedAt),
		projectProfile,
		generatedAt,
	};
}

function getArtifactTime(artifact: Artifact) {
	return artifact.updated ?? artifact.created ?? artifact.modified;
}

function sortArtifactsByTime(first: Artifact, second: Artifact) {
	return (
		getArtifactTime(second).localeCompare(getArtifactTime(first)) ||
		first.relativePath.localeCompare(second.relativePath, "en")
	);
}

function workspaceArtifactsPlugin(): Plugin {
	return {
		name: "workspace-artifacts",
		resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
			return null;
		},
		load(id) {
			if (id !== resolvedVirtualModuleId) {
				return null;
			}

			const payload = loadArtifactPayload();

			return `export const artifacts = ${JSON.stringify(payload.artifacts)};
export const hardnessReport = ${JSON.stringify(payload.hardnessReport)};
export const projectProfile = ${JSON.stringify(payload.projectProfile)};
export const artifactEndpoint = ${JSON.stringify(artifactEndpoint)};
export const generatedAt = ${JSON.stringify(payload.generatedAt)};`;
		},
		handleHotUpdate({ file, server }) {
			if (!file.endsWith(".md") && !file.endsWith(".json")) {
				return;
			}

			const isArtifactFile = artifactTargets.some(({ directory }) => {
				const targetPath = path.join(workspaceRoot, directory);
				return file.startsWith(targetPath);
			});

			if (!isArtifactFile) {
				return;
			}

			const module = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
			if (module) {
				server.moduleGraph.invalidateModule(module);
			}

			server.ws.send({ type: "full-reload" });
		},
		configureServer(server) {
			server.middlewares.use((request, response, next) => {
				const requestPath = request.url?.split("?")[0];

				if (requestPath !== artifactEndpoint) {
					next();
					return;
				}

				response.setHeader("Cache-Control", "no-store");
				response.setHeader("Content-Type", "application/json");
				response.end(JSON.stringify(loadArtifactPayload()));
			});

			for (const target of artifactTargets) {
				const targetPath = path.join(workspaceRoot, target.directory);
				if (fs.existsSync(targetPath)) {
					server.watcher.add(targetPath);
				}
			}
		},
	};
}

export default defineConfig({
	plugins: [workspaceArtifactsPlugin(), tailwindcss(), react()],
	server: {
		fs: {
			allow: [packageRoot, workspaceRoot],
		},
	},
});
