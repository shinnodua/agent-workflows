import type { Artifact } from "../../../types";

export function resolveLinkedArtifact(
	artifacts: Artifact[],
	currentArtifact: Artifact,
	href: string,
) {
	const [hrefWithoutHash] = href.split("#");
	const decodedHref = decodeURIComponent(hrefWithoutHash ?? "").trim();

	if (isExternalOrEmptyHref(decodedHref)) {
		return undefined;
	}

	const targetPath = normalizeWorkspacePath(
		decodedHref.startsWith("/")
			? decodedHref.replace(/^\/+/, "")
			: `${getDirectoryName(currentArtifact.relativePath)}/${decodedHref}`,
	);

	return artifacts.find((artifact) => artifact.relativePath === targetPath);
}

export function normalizeWorkspacePath(filePath: string) {
	const parts: string[] = [];

	for (const part of filePath.split("/")) {
		if (!part || part === ".") {
			continue;
		}

		if (part === "..") {
			parts.pop();
			continue;
		}

		parts.push(part);
	}

	return parts.join("/");
}

function isExternalOrEmptyHref(href: string) {
	return (
		!href ||
		href.startsWith("http://") ||
		href.startsWith("https://") ||
		href.startsWith("mailto:") ||
		href.startsWith("#")
	);
}

function getDirectoryName(filePath: string) {
	const parts = filePath.split("/");
	parts.pop();
	return parts.join("/");
}
