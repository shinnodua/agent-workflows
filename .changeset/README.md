# Changesets

Use Changesets for package versioning and release notes.

```sh
bun run changeset
```

Commit the generated Markdown file with the package change. The release workflow
turns pending changesets into a version PR on `main`, then publishes when that PR
is merged.

This package publishes publicly to npm as `@shinnodua/agent-workflows`.
The release workflow uses npm trusted publishing (GitHub OIDC) with
`id-token: write`. `GITHUB_TOKEN` is used for release PRs and GitHub releases.
No npm publish token is required in CI.

Before the first automated release, complete the bootstrap and trusted publisher
setup in [the README](../README.md#npm-maintainer-setup).
