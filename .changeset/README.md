# Changesets

Use Changesets for package versioning and release notes.

```sh
bun run changeset
```

Commit the generated Markdown file with the package change. The release workflow
turns pending changesets into a version PR on `main`, then publishes when that PR
is merged.

The version PR requires either the repository Actions setting that allows GitHub
Actions to create pull requests, or an `GITHUB_TOKEN` secret with contents and
pull request write access.
