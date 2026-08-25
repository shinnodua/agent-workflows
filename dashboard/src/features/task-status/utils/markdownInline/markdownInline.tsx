import type { ReactNode } from "react";
import type { Artifact } from "../../../../types";
import { resolveLinkedArtifact } from "../markdownLinks";
import styles from "./markdownInline.module.css";

export type MarkdownRenderContext = {
	artifacts: Artifact[];
	currentArtifact: Artifact;
	onNavigate: (artifact: Artifact) => void;
};

export function renderInlineMarkdown(
	text: string,
	context: MarkdownRenderContext,
) {
	const nodes: ReactNode[] = [];
	const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
	let lastIndex = 0;

	for (const match of text.matchAll(pattern)) {
		const index = match.index ?? 0;
		const token = match[0];

		if (index > lastIndex) {
			nodes.push(text.slice(lastIndex, index));
		}

		nodes.push(renderInlineToken(token, index, context));
		lastIndex = index + token.length;
	}

	if (lastIndex < text.length) {
		nodes.push(text.slice(lastIndex));
	}

	return nodes;
}

function renderInlineToken(
	token: string,
	index: number,
	context: MarkdownRenderContext,
) {
	if (token.startsWith("`")) {
		return (
			<code className={styles.inlineCode} key={`${token}-${index}`}>
				{token.slice(1, -1)}
			</code>
		);
	}

	if (token.startsWith("**")) {
		return (
			<strong key={`${token}-${index}`}>
				{renderInlineMarkdown(token.slice(2, -2), context)}
			</strong>
		);
	}

	return renderLinkToken(token, index, context);
}

function renderLinkToken(
	token: string,
	index: number,
	context: MarkdownRenderContext,
) {
	const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
	const href = linkMatch?.[2] ?? "#";
	const linkedArtifact = resolveLinkedArtifact(
		context.artifacts,
		context.currentArtifact,
		href,
	);

	if (linkedArtifact) {
		return (
			<button
				className={styles.link}
				key={`${token}-${index}`}
				onClick={() => context.onNavigate(linkedArtifact)}
				type="button"
			>
				{linkMatch?.[1] ?? token}
			</button>
		);
	}

	return (
		<a
			className={styles.link}
			href={href}
			key={`${token}-${index}`}
			target="_blank"
			rel="noreferrer"
		>
			{linkMatch?.[1] ?? token}
		</a>
	);
}
