## Tool

- Name:
- Website:
- Stable slug:
- Submitted by:

## Change Type

- [ ] Add a new tool
- [ ] Update an existing tool
- [ ] Change website, API, MCP, CLI, or skill behavior
- [ ] Maintenance only

## Release Impact

- User-facing summary:
- Requires package release: yes/no
- Changeset included: yes/no, path:

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
- `launchSignals`:
  - `adoptionTier`:
  - `ecosystemImportance`:
  - `githubStars`:
  - `packageDownloadsMonthly`:
  - `maturity`:
  - `distribution`:
  - `evidenceUrl`:
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
- [ ] Added `launchSignals` from public adoption, ecosystem, package, GitHub, maturity, or distribution evidence
- [ ] Added evidence URLs for important API, CLI, MCP, docs, pricing, sandbox, browser, and account setup claims
- [ ] Included limitation/caution notes for money, production data, infrastructure, compliance, user accounts, browser-only flows, or brittle automation
- [ ] Did not add secrets, database credentials, Docker/Neon setup, generated build output, or unrelated files
- [ ] Added a `.changeset/*.md` file when this changes public website, API, MCP, CLI, or skill behavior

## Validation

- [ ] `bun run catalog:format`
- [ ] `bun run catalog:audit`
- [ ] `bun run validate`
- [ ] `git diff --check`
