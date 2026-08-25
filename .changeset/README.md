# Changesets

Use Changesets for package versioning and release notes.

```sh
bun run changeset
```

Commit the generated Markdown file with the package change. The release workflow
turns pending changesets into a version PR on `main`, then publishes when that PR
is merged.
