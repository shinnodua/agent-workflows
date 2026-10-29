# Save Helper Protocol

Use this reference only when previewing or saving accepted entries. The helper
handles deterministic validation, related-file cleanup, and Git operations; the
agent owns URL discovery and the interview.

## Resolve The Two Roots

`<workspace-root>` is the consuming project being configured. `<package-root>` is
the source package containing the authoritative add-project skill you read. From
that source skill directory, the helper is `../../../scripts/add-project.mjs`.
Installed workspace discovery shims point to this packaged skill; follow that
pointer before resolving the helper. Scripts are packaged, not copied into the
consumer's `scripts/` directory. Pass `--root` explicitly on every invocation.

## Request And Preview

Write a temporary JSON request outside product repositories containing completed
entries. Use a tool's structured write or JSON serialization, not shell string
interpolation. Do not include incomplete entries or secret-bearing URLs.

```json
{
  "entries": [
    {
      "id": "client",
      "name": "client",
      "path": "modules/client",
      "url": "https://github.com/example/client.git",
      "purpose": "User-facing client",
      "scope": ["client UI"],
      "platforms": ["frontend", "web"],
      "agentGuide": "modules/client/AGENTS.md",
      "artifactDirectories": {
        "plans": "modules/client/plans",
        "designs": "modules/client/designs",
        "research": "modules/client/research",
        "docs": "modules/client/docs"
      },
      "codeScanDirectories": [],
      "validation": []
    }
  ]
}
```

The example shape illustrates keys, not evidence or actual user values. Keep
unknown user-added properties. Remote-relative paths must be converted to the
accepted workspace-relative location.

```sh
node "<package-root>/scripts/add-project.mjs" preview --root "<workspace-root>" --request "<request.json>"
```

Preview is read-only. It returns structured status, `token`, and `effects`
including repositories, example removals, files, and Git index effects. Display
those effects to the user before Save. Exact unchanged shipped examples are
automatically selected; a modified example is preserved unless the user explicitly
chooses its removal. Only then include its ID in `removeExamples` and re-preview.
Custom stages referring to removed IDs need a user-confirmed replacement mapping
in `workflowReplacements`, such as `{"example-core":["my-core"]}`. Do not invent
execution order or delete custom stages to avoid that decision.

## Save And Recovery

After the user chooses **Save repositories** for the displayed preview, add its
`token` to the same request, preserving entries and other accepted selections:

```sh
node "<package-root>/scripts/add-project.mjs" save --root "<workspace-root>" --request "<request.json>"
```

A token validates a preview; it is not a substitute for the user's Save choice.
Never mint a preview token and save autonomously after entry acceptance. Re-read
and display changed effects before requesting a renewed Save.

Inspect the JSON result and exit status. Conflict results can contain a revised
`preview`. Keep accepted values, resolve the conflict or show the fresh preview,
and obtain a fresh Save choice if its effects differ. Empty sessions do not clone
or clean examples. A failure is not successful completion: report per-entry
checkout/registration/revision state, changed/restored files and required recovery.
Retain usable checkouts and completed registrations. After resolving a transient
failure, obtain a fresh preview before retrying; matching registrations are reused.
Do not delete user repositories or reset unrelated changes to force a retry.

The CLI accepts clean HTTPS/SSH repository URLs. Local transport is reserved for
isolated automated fixtures through the exported API test option, not the normal
user command. Git and Node must be available, and private remote access uses the
user's existing Git authentication. No environment secrets or new dependencies
are required by the helper.
