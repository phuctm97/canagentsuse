## Tool

- Name:
- Website:
- Stable slug:
- Submitted by:

## Catalog Fields

- `slug`:
- `name`:
- `tagline`:
- `websiteUrl`:
- `docsUrl`:
- `githubUrl`:
- `shortDescription`:
- `agentSummary`:
- `bestFor`:
- `cautionNotes`:
- `pricingSummary`:
- `authModel`:
- `accountCreation`:
- `browserSupport`:
- `cliPackage`:
- `apiBaseUrl`:
- `mcpServer`:
- `agentScore` (0-100):
- `launchScore` (0+):
- `categorySlugs`:
- `useCaseSlugs`:

## Agent Capability Evidence

For each capability, include support level (`native`, `strong`, `partial`, `manual`, or `unknown`), a short detail, and a public evidence URL when available.

- CLI:
- API:
- MCP:
- Browser:
- Account creation:
- Pricing clarity:
- Docs quality:
- Sandbox:

## Official Evidence

- Product or homepage:
- Docs home:
- API docs:
- CLI docs:
- MCP server docs:
- Pricing page:
- Sandbox, test-mode, or local-mode docs:
- Account setup or auth docs:
- GitHub or package registry:

## Submitter Notes

Not provided

## PR Checklist

- [ ] Added or updated exactly one tool record in `data/catalog.json`
- [ ] Used a stable unique slug and existing category/use-case/capability slugs where possible
- [ ] Filled required fields from `data/catalog.schema.json`
- [ ] Added evidence URLs for important API, CLI, MCP, docs, pricing, sandbox, browser, and account setup claims
- [ ] Included limitation/caution notes for money, production data, infrastructure, compliance, user accounts, browser-only flows, or brittle automation
- [ ] Did not add secrets, database credentials, Docker/Neon setup, generated build output, or unrelated files

## Validation

- [ ] `bun run catalog:audit`
- [ ] `bun run build`
- [ ] `git diff --check`
