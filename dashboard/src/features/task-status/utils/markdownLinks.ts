import type { Artifact } from "../../../types";

export function resolveLinkedArtifact(
	artifacts: Artifact[],
	currentArtifact: Artifact,
	href: string,
) {
	if (!isSafeMarkdownHref(href)) {
		return undefined;
	}

	const [hrefWithoutHash] = href.split("#");
	let decodedHref: string;
	try {
		decodedHref = decodeURIComponent(hrefWithoutHash ?? "").trim();
	} catch {
		return undefined;
	}

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

export function isSafeMarkdownHref(href: string) {
	if (
		!href ||
		href !== href.trim() ||
		Array.from(href).some((character) => {
			const code = character.charCodeAt(0);
			return code < 32 || code === 127 || character === "\\";
		}) ||
		href.startsWith("//")
	) {
		return false;
	}

	const scheme = /^([a-z][a-z\d+.-]*):/i.exec(href)?.[1];
	return !scheme || /^(https?|mailto)$/i.test(scheme);
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
