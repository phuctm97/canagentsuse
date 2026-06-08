---
name: find-cli-tools
description: Find CLI-first and command-line-operable tools with Can Agents Use. Use when a user asks for tools an agent can run in a terminal, install with npm/bun/pip/brew/cargo/go, automate in CI, script locally, or use without browser-only setup.
allowed-tools: WebFetch
---

# Find CLI Tools

Use this skill when the user needs tools an agent can operate through a command-line interface.

## Search

Search for CLI-capable tools:

```bash
curl -fsS 'https://canagentsuse.com/api/agent/search?capability=cli&page=1&limit=20'
```

Search within a domain:

```bash
curl -fsS 'https://canagentsuse.com/api/agent/search?q=<domain>%20cli&capability=cli&page=1&limit=10'
```

Fetch one record:

```bash
curl -fsS 'https://canagentsuse.com/api/agent/tools/<slug>'
```

## Evaluate CLI Fit

- Prefer official packages and documented commands.
- Check install path: npm, bun, pip, brew, cargo, go, Docker-free binary, or platform package.
- Check auth setup and whether the CLI supports non-interactive tokens or service accounts.
- Check dry-run, preview, local mode, or sandbox flags before recommending writes.
- Include caution notes for commands that mutate production resources, spend money, or touch user data.

## Output Shape

Return package/install command, docs URL, auth requirements, safe test command if known, and warnings before live execution.
