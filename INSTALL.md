# Install and initialize an Agent Workflows workspace

Use this guide to set up a **consuming workspace** with
`@shinnodua/agent-workflows`, from package installation through project and
repository configuration. Run commands in the target workspace, which may be
different from the checkout containing this guide.

Give your coding agent this request (Agent chat):

```text
Read INSTALL.md from the Agent Workflows repository and follow it to initialize
my workspace at <absolute-workspace-path>. Preserve existing work, ask for
missing project facts, and report validation results and remaining blockers.
```

Before installation, open this file directly from the source repository; it
requires no installed skills. After installation it is also available at
`node_modules/@shinnodua/agent-workflows/INSTALL.md`. Follow existing target
workspace instructions throughout setup. Finish with the readiness report below;
commits, publishing, deployment, and product implementation are separate work.

## Start or resume

| Current state | Where to start |
| --- | --- |
| Empty directory or no installed package | Step 1, then install in step 2 |
| Package installed, workflow files missing | Step 1, then initialize in step 3 |
| Initialized but project facts or repositories incomplete | Inspect state in step 1, then resume step 4 |
| Existing workspace needs newer workflow instructions | Read [Update and recovery](#update-and-recovery) before refreshing |

## 1. Inspect the target and prerequisites

Identify the intended directory before making changes. Read its existing
`AGENTS.md`, `CLAUDE.md`, `package.json`, package-manager declaration/lockfile,
`workspace.config.json`, `project/`, and `.agent-workflows/manifest.json` where
present. Inspect Git status if it is a Git checkout. Preserve existing files,
dependencies, project facts, and pending changes.

If the target directory does not exist, create the requested directory. For a
new coordination workspace that will register submodules, initialize a Git
repository there if none exists. Keep product code in its owning repositories;
the coordination root holds project profiles, artifacts, and workspace tooling.

Check tools in the target workspace (Terminal):

```sh
git --version
node --version
bun --version
```

Git is needed for repository registration, Node.js runs the CLI, and Bun runs the
packaged integrity checks and dashboard. Resolve missing tools before continuing;
use their official installation instructions for the user's platform. Keep an
existing package manager; Bun is the default for a new workspace, even when npm
or pnpm is used to install the dependency in an existing project.

The package is published to GitHub Packages. Preserve existing registry settings
and add this scope mapping to the target's `.npmrc` if absent (configuration):

```ini
@shinnodua:registry=https://npm.pkg.github.com
```

The user needs package read access and authentication configured through their
package manager's supported credential mechanism. Follow
[GitHub's npm registry authentication instructions](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages);
GitHub documents a personal access token (classic) with appropriate package-read
permissions. [Bun supports npmrc registry configuration](https://bun.sh/docs/install/npmrc).
Keep secret values out of repository files, command examples, chat, and logs.
If authentication requires the user, let them complete it privately and resume
afterward. A scope mapping alone does not authenticate a package download.

**Ready to continue:** target root, current setup state, package-manager choice,
required tools, and registry/access prerequisites are known. Report any access
failure without repeatedly retrying or claiming installation succeeded.

## 2. Add the package

For an empty workspace without `package.json`, create a minimal private package
manifest with a project name agreed with the user and `"private": true`. Preserve
an existing manifest and lockfile. Choose **one** install command matching the
workspace package manager (Terminal, from the target root):

```sh
# Bun
bun add --dev @shinnodua/agent-workflows
```

```sh
# npm
npm install --save-dev @shinnodua/agent-workflows
```

```sh
# pnpm
pnpm add --save-dev @shinnodua/agent-workflows
```

If the target is already a package-manager monorepo, follow its root dependency
rules and required workspace-root flags. Do not switch package managers or
replace the dependency set to make installation work.

If an approved global installation is already being used, `workflows` can replace
the explicit local CLI path below; the local dev dependency is the default path
in this guide. See [README installation alternatives](README.md#install).

**Expected outcome:** package installation exits successfully, the dependency
and lockfile reflect the selected package, and
`node_modules/@shinnodua/agent-workflows/bin/workflows.js` exists. Inspect this
before executing the CLI. The explicit local path below avoids downloading an
unrelated CLI when installation has failed.

## 3. Initialize instructions and reload the agent

Terminal, from the target root:

```sh
node node_modules/@shinnodua/agent-workflows/bin/workflows.js init
```

Initialization creates missing project scaffolding and local discovery shims,
records `.agent-workflows/manifest.json`, and synchronizes agent definitions.
Existing scaffold files are retained, but initialization can normalize workspace
configuration, synchronize model files, and merge package scripts. Review the
resulting diff rather than assuming existing files are untouched.

Read the generated `AGENTS.md`/`CLAUDE.md` and skill pointers. If pre-existing
instruction files were retained, preserve their rules and reconcile the generated
workflow references with them. Ask about conflicting project rules instead of
overwriting user instructions.

**Expected outcome:** the manifest, workspace configuration, project profile
scaffolding, and local command/skill shims exist. This establishes initialization;
the project is still incomplete until the next steps configure real facts.

Restart or reload the active agent session so it can discover the new agents,
commands, and skills. Before the reload, return this filled-in handoff (Agent chat):

```text
Workspace: <absolute target root>
Completed: <successful steps and observed results>
Next: read target workspace instructions and run $project-setup (step 4)
Blockers: <missing facts/access, or None>
Resume with INSTALL.md; inspect existing state before repeating commands.
```

A new tracking file is unnecessary. If this session cannot reload itself, the
user performs the reload and supplies the handoff to the next session.

## 4. Configure the project and repositories

After reloading, read the target's generated instructions and invoke this in
**Agent chat**, not in a shell:

```text
$project-setup
```

Plain `project-setup` or `/project-setup` is also supported. If command discovery
is unavailable, read the target's `.agents/skills/project-setup/SKILL.md` and its
packaged source completely, then follow it directly.

The setup skill owns the interview and edits. It reads existing answers, asks
one focused question at a time, and configures:

- `project/PROJECT.md`: real project purpose and ownership boundaries.
- `project/repositories.json`: actual repository identities, URLs, paths, scopes,
  platforms, agent guides, artifact directories, code scan paths, and known checks.
- `project/validation.json`: applicable root and local validation commands.
- `project/workflows.json`: implementation stages or an explicit empty stage list.
- `.gitmodules` and repository registration, through the repository-addition flow.

For repository additions, project setup delegates to `$add-project`. Supply a
repository URL, review the inferred entry, then choose Add another repository or
Save repositories. **Save** is the existing boundary that clones/registers the
reviewed repositories as submodules and applies related configuration changes.
Follow that flow's preview and mutation helper; a profile entry or `.gitmodules`
entry by itself does not register a submodule. Existing cloned submodules should
be inspected and reused rather than added again.

If this is a cloned, already configured workspace and the user requested its
submodules, initialize the commits recorded by that checkout (Terminal):

```sh
git submodule update --init --recursive
```

Do this only after inspecting local submodule changes and access requirements.
Fresh repository additions use the reviewed Save flow above. Do not invent
private URLs, credentials, validation commands, or missing project facts.

**Expected outcome:** project facts are real, examples are removed or explicitly
intentional, configured repository paths match registered submodules, and any
unknown validation command is recorded for follow-up. A failed or cancelled
repository batch leaves setup incomplete for those repositories; preserve and
report successful work before resuming the pending entries.

## 5. Verify and report readiness

Terminal, from the target root:

```sh
node node_modules/@shinnodua/agent-workflows/bin/workflows.js integrity
node node_modules/@shinnodua/agent-workflows/bin/workflows.js check
git status --short
git submodule status
```

`integrity` checks workspace artifacts; `check` also runs packaged formatting
checks. Run the applicable commands in `project/validation.json` and repository
checks from `project/repositories.json` in their owning directories. Review failures
before changing files; formatting failures do not authorize discarding user work.
Generated JSON can require formatting before `check` passes. Use the workspace's
formatter on the reported files, inspect the diff, and rerun the failed check.
Passing structural checks alone does not prove the project facts are complete.

Return a readiness report covering every item:

- [ ] Dependency installed and local CLI available.
- [ ] Initialization manifest and agent discovery files present; session reloaded.
- [ ] Actual project purpose, ownership, repository metadata, and stages configured.
- [ ] Reviewed repositories saved/registered, accessible, and aligned with profiles.
- [ ] Applicable checks passed, with exact commands and results recorded.
- [ ] Changed files, submodule/index effects, unknown facts, and any blockers listed.

Call setup ready only when required items are satisfied. If a tool, credential,
repository, or validation check is unavailable, report **incomplete**, the affected
step, successful work to retain, and the next corrective action. Keep commits
under developer control.

## Optional preferences and dashboard

These do not block core workspace readiness. Keep current role-model and auto-mode
settings unless the user requests changes. See the [README](README.md) for role
model configuration. Auto mode is an opt-in; initialization does not authorize
enabling it on the user's behalf.

To open the local artifact dashboard (Terminal, from the target root):

```sh
node node_modules/@shinnodua/agent-workflows/bin/workflows.js dashboard
```

Report dashboard startup separately from required setup checks.

## Update and recovery

| Situation | Action |
| --- | --- |
| Missing tools or registry authentication/access | Resolve the named prerequisite privately, then resume the failed step. Keep completed configuration. |
| Package installed but initialization missing | Inspect existing files and run step 3. |
| Initialized with generic or partially completed profiles | Resume `$project-setup`; preserve saved answers. |
| Repository batch partially failed | Report registered and pending repositories; resume the existing add-project review/Save flow. |
| Skills unavailable after init/update | Reload the agent, or read the generated skill pointer and complete packaged source directly. |
| Validation fails | Report the failing command and cause; correct only relevant configuration, rerun the affected check, and retain an incomplete status until resolved. |

After upgrading the dependency with the workspace's package manager, inspect
pending changes before refreshing workflow-owned instructions (Terminal):

```sh
node node_modules/@shinnodua/agent-workflows/bin/workflows.js update
```

`update` replaces managed shims. Review custom changes to those files before
running it, and review the resulting diff afterward. Project-owned profiles and
artifacts remain under developer control; config migration can add defaults.
Reload the agent after refreshing, then repeat the readiness checks. Use `init`
for missing initialization and `update` deliberately for managed-file refreshes.

## Conventions and further reading

This guide uses ordinary Markdown and the established installation-document name
`INSTALL.md`, as seen in [Neovim's installation guide](https://github.com/neovim/neovim/blob/master/INSTALL.md).
The [AGENTS.md open format](https://agents.md/) provides predictable agent
instructions and setup-command context. INSTALL.md itself is not automatically
discovered by every agent; README.md and AGENTS.md link here for that reason.

For detailed workspace ownership and profile reference, see
[Reusable Workspace Template Setup](docs/workspace-template-setup.md). Existing
CLI commands and setup skills remain the source of truth for their behavior.
