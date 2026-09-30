import { describe, expect, test } from "bun:test";
import type { ReactElement } from "react";
import type { Artifact } from "../../../../types";
import { renderInlineMarkdown } from "../markdownInline/markdownInline";

const artifact: Artifact = {
	content: "# Example",
	modified: "2026-09-30T00:00:00.000Z",
	relatedArtifactIds: [],
	relativePath: "docs/example.md",
	sourceModule: "workspace",
	sourceHref: "/@fs/example.md",
	status: "unknown",
	taskKey: "example",
	title: "Example",
	type: "document",
};

function renderLink(markdown: string) {
	return renderInlineMarkdown(markdown, {
		artifacts: [artifact],
		currentArtifact: artifact,
		onNavigate: () => {},
	});
}

describe("renderInlineMarkdown links", () => {
	test("renders unsafe URLs as text", () => {
		expect(renderLink("[Run](javascript:evil)")).toEqual(["Run"]);
		expect(renderLink("[Embed](data:text/html,evil)")).toEqual(["Embed"]);
		expect(renderLink("[Host](//example.com)")).toEqual(["Host"]);
	});

	test("keeps safe links clickable", () => {
		const [link] = renderLink("[Docs](https://example.com/docs)");
		expect((link as ReactElement<{ href: string }>).type).toBe("a");
		expect((link as ReactElement<{ href: string }>).props.href).toBe(
			"https://example.com/docs",
		);
	});
});
