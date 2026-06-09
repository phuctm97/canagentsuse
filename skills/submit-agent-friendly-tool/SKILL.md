---
name: submit-agent-friendly-tool
description: Submit a new tool to Can Agents Use. Use when a user wants to add, suggest, contribute, or open a pull request for an agent-friendly API, CLI, MCP server, browser-operable product, docs source, pricing page, sandbox, or tool record in phuctm97/canagentsuse.
allowed-tools: WebFetch
---

# Submit Agent-Friendly Tool

Use this skill when the user wants to add a new tool to Can Agents Use or improve an existing catalog record.

## Submission Paths

Use one of these paths:

- Website PR flow: open `https://canagentsuse.com/submit`, fill tool name and website URL, then choose `Open GitHub PR template`.
- Website agent flow: open `https://canagentsuse.com/submit`, fill the fields, then choose `Copy agent prompt`.
- Direct GitHub flow: create a branch in `phuctm97/canagentsuse`, edit `data/catalog.json`, and open a PR with `.github/PULL_REQUEST_TEMPLATE/add-tool.md`.

## Direct Agent Workflow

1. Ask for tool name and website URL if missing.
2. Create a branch named `catalog/add-<tool-slug>`.
3. Read `data/README.md`, `data/catalog.schema.json`, and nearby records in `data/catalog.json`.
4. Edit `data/catalog.json` only unless the submission needs a very small docs update.
5. Add or update exactly one tool record.
6. Use a stable unique `slug`.
7. Prefer existing category, use-case, and capability slugs.
8. Use official evidence URLs where possible.
9. Run validation.
10. Commit, push the branch, and open a PR to `main`.

## Required Catalog Shape

Fill these fields from evidence:

- `slug`
- `name`
- `tagline`
- `websiteUrl`
- `docsUrl`
- `githubUrl`
- `shortDescription`
- `agentSummary`
- `bestFor`
- `cautionNotes`
- `pricingSummary`
- `authModel`
- `accountCreation`
- `browserSupport`
- `cliPackage`
- `apiBaseUrl`
- `mcpServer`
- `launchScore`
- `categorySlugs`
- `useCaseSlugs`
- `capabilities`

Each capability must include:

- `slug`
- `supportLevel`: `native`, `strong`, `partial`, `manual`, or `unknown`
- `detail`
- `evidenceUrl`

## Evidence To Research

- Product or homepage.
- Docs home.
- API docs.
- CLI docs or package registry.
- MCP server docs.
- Pricing page.
- Sandbox, test-mode, local-mode, preview, or dry-run docs.
- Account setup, auth, OAuth, API key, or service account docs.
- GitHub repo, package registry, or changelog when relevant.

## Validation

Run:

```bash
bun run catalog:audit
bun run build
git diff --check
```

## Guardrails

- Do not add secrets, database credentials, Docker/Neon setup, generated build output, or unrelated refactors.
- Do not invent evidence. Use `null`, `unknown`, or clear caution notes when evidence is missing.
- Do not set `agentScore`; it is computed automatically from evidence by the repo's scoring algorithm.
- Add caution notes for money, production data, accounts, compliance, infrastructure, browser-only flows, brittle automation, or irreversible actions.
- GitHub's prefilled PR composer requires the head branch to exist, so push the branch before opening the PR.
