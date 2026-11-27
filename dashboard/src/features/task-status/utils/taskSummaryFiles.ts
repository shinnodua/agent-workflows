import fs from "node:fs";
import path from "node:path";
import type { Artifact, TaskSummaries } from "../../../types";

const summaryName =
	/^(prd-\d{8}-[a-z0-9-]+|pending-research-\d{8}-[a-z0-9-]+)\.md$/;
const maxDocumentBytes = 512 * 1024;

type MarkdownEntry = {
	content: string;
	modified: string;
};

export function readTaskSummaries(workspaceRoot: string): TaskSummaries {
	return Object.fromEntries(
		[...readMarkdownDirectory(workspaceRoot, "task-summary", summaryName)].map(
			([name, entry]) => {
				const id = name.slice(0, -3);
				if (!entry) return [id, "unavailable"];
				const title = entry.content.match(/^#\s+(.+)$/m)?.[1]?.trim();
				const declaredId = entry.content.match(
					/^- Feature ID and PRD link:\s*\[?(prd-\d{8}-[a-z0-9-]+)/im,
				)?.[1];
				if (!title || (declaredId && declaredId.toLowerCase() !== id)) {
					return [id, "unavailable"];
				}

				return [
					id,
					{
						...previewArtifact(entry, `task-summary/${name}`),
						isTaskSummary: true,
						status:
							entry.content.match(/^- Task status:\s*(.+)$/im)?.[1] ??
							"unknown",
						taskKey: id,
						title,
					},
				];
			},
		),
	);
}

export function readTaskSummaryEvidence(workspaceRoot: string): Artifact[] {
	return ["meeting-logs", "templates"].flatMap((directory) =>
		[
			...readMarkdownDirectory(
				workspaceRoot,
				directory,
				/^[a-z0-9][a-z0-9-]*\.md$/i,
			),
		].flatMap(([name, entry]) =>
			entry ? [previewArtifact(entry, `${directory}/${name}`)] : [],
		),
	);
}

function previewArtifact(entry: MarkdownEntry, relativePath: string): Artifact {
	return {
		...entry,
		relatedArtifactIds: [],
		relativePath,
		sourceHref: "",
		sourceModule: "workspace",
		status: "unknown",
		taskKey: "",
		title:
			entry.content.match(/^#\s+(.+)$/m)?.[1]?.trim() ??
			path.basename(relativePath),
		type: "document",
	};
}

function readMarkdownDirectory(
	workspaceRoot: string,
	name: string,
	allowed: RegExp,
): Map<string, MarkdownEntry | undefined> {
	try {
		const directory = path.join(fs.realpathSync(workspaceRoot), name);
		const identity = fs.lstatSync(directory);
		if (!identity.isDirectory()) return new Map();

		const stableDirectory = () => {
			const current = fs.lstatSync(directory);
			return (
				current.isDirectory() &&
				sameFile(current, identity) &&
				fs.realpathSync(directory) === directory
			);
		};

		return new Map(
			fs
				.readdirSync(directory)
				.filter((filename) => allowed.test(filename))
				.map((filename) => [
					filename,
					readMarkdownEntry(path.join(directory, filename), stableDirectory),
				]),
		);
	} catch {
		return new Map();
	}
}

function readMarkdownEntry(
	filename: string,
	stableDirectory: () => boolean,
): MarkdownEntry | undefined {
	try {
		const entry = fs.lstatSync(filename);
		if (!entry.isFile() || !stableDirectory()) return;

		const handle = fs.openSync(
			filename,
			fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK,
		);
		try {
			const stat = fs.fstatSync(handle);
			if (
				!stat.isFile() ||
				!sameFile(stat, entry) ||
				stat.size < 1 ||
				stat.size > maxDocumentBytes ||
				!stableDirectory()
			)
				return;

			const bytes = Buffer.alloc(stat.size + 1);
			const length = fs.readSync(handle, bytes);
			if (
				length !== stat.size ||
				!stableDirectory() ||
				!sameFile(fs.lstatSync(filename), stat)
			)
				return;

			return {
				content: new TextDecoder("utf-8", { fatal: true }).decode(
					bytes.subarray(0, length),
				),
				modified: stat.mtime.toISOString(),
			};
		} finally {
			fs.closeSync(handle);
		}
	} catch {
		return;
	}
}

function sameFile(first: fs.Stats, second: fs.Stats) {
	return first.dev === second.dev && first.ino === second.ino;
}
