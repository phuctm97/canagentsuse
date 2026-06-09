# canagentsuse CLI

Find tools an AI agent can actually use from the terminal.

```bash
npx canagentsuse@latest setup
npx canagentsuse@latest setup --claude --codex --yes
npx canagentsuse@latest setup --all-agents --project --dry-run
npx canagentsuse search stripe
npx canagentsuse search --capability mcp --json
npx canagentsuse tool stripe
npx canagentsuse mcp-config
npx canagentsuse install-guide --json
```

The CLI reads the public Can Agents Use surfaces. It does not require database
credentials, local setup, or write access.

## Commands

| Command | Purpose |
| --- | --- |
| `canagentsuse setup` | Install MCP config and bundled Can Agents Use skills for detected agents. |
| `canagentsuse remove` | Remove Can Agents Use MCP config and skills. |
| `canagentsuse status` | Show MCP and skill install status. |
| `canagentsuse doctor` | Test the public API, MCP endpoint, and local setup. |
| `canagentsuse skills list` | List bundled skills. |
| `canagentsuse skills install <skill>` | Install one bundled skill locally. |
| `canagentsuse search [query]` | Search agent-friendly APIs, CLIs, MCP servers, and browser-operable tools. |
| `canagentsuse tool <slug>` | Fetch one complete tool record. |
| `canagentsuse catalog` | Show catalog counts or print the full JSON catalog with `--json`. |
| `canagentsuse mcp-config` | Print copyable MCP config for agents. |
| `canagentsuse install-guide` | Fetch structured setup guidance for CLI, MCP, skills, API, and Markdown use. |
| `canagentsuse score-model` | Print the agent-readiness and launch-presence score models used for ranking. |
| `canagentsuse docs` | List all agent-facing surfaces. |

Setup supports Claude Code, Cursor, Codex, OpenCode, Gemini CLI, and the
universal `.agents/skills` directory:

```bash
canagentsuse setup --claude
canagentsuse setup --cursor
canagentsuse setup --codex
canagentsuse setup --opencode
canagentsuse setup --gemini
canagentsuse setup --universal
```

Use `--project` for project-local setup, `--yes` for non-interactive writes,
and `--dry-run` to preview changes. Existing config files are backed up before
the CLI edits them.

Use `--json` for agent workflows:

```bash
canagentsuse search "billing api" --capability api --limit 10 --json
```

Use another deployment with either `--site` or `CANAGENTSUSE_SITE_URL`:

```bash
CANAGENTSUSE_SITE_URL=https://www.canagentsuse.com canagentsuse catalog --json
```

## Release

The package is released by Changesets from the root `Release` GitHub Actions
workflow. Add a changeset for `canagentsuse`, merge it to `main`, and the
workflow versions the package, builds it, and publishes it to npm.

```bash
bun run changeset
```

npm Trusted Publishing through GitHub Actions OIDC is preferred, so no
long-lived npm token is required when the trusted publisher is configured.
