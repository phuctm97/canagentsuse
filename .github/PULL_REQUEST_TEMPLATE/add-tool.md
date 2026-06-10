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

## Scope Rule

Tool PRs should cover one catalog record. Search first by name, slug, domain,
GitHub repo, and package name so you update existing records instead of adding
duplicates. Do not edit generated, package, lockfile, changelog, workflow,
script, app-code, or agent-skill files. Add `.changeset/*.md` version plans
when the change should release the website or CLI.

## Catalog Fields

- `slug`:
- `name`:
- `tagline`:
- `websiteUrl`:
- `docsUrl`:
- `githubUrl`:
- `logoPath`: `/logos/tools/<slug>.svg`
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

## Tool Logo

New tool PRs must include an SVG logo file. Name the file with the exact stable
slug and put it here:

```text
packages/website/public/logos/tools/<slug>.svg
```

Then set the matching public path in the tool source JSON:

```json
"logoPath": "/logos/tools/<slug>.svg"
```

Example for `stripe`:

```text
packages/website/public/logos/tools/stripe.svg
```

```json
"logoPath": "/logos/tools/stripe.svg"
```

Use SVG only. Do not add PNG, JPG, WebP, or remote logo URLs for new tool
submissions.

## Signal Honesty

Every `launchSignals` key must be present. Use exact public numbers for GitHub
stars and package downloads when available, `null` when numeric evidence is not
available, and `unknown` only where the schema allows it. Do not fake or inflate
adoption, ecosystem importance, maturity, stars, downloads, or evidence URLs.

## Official Evidence

- Product or homepage:
- Docs home:
- API docs for API claims:
- CLI docs or package registry for CLI claims:
- MCP docs or package registry for MCP claims:
- Pricing page:
- Sandbox, test-mode, or local-mode docs:
- Account setup or auth docs:
- GitHub or package registry:

## Submitter Notes

Not provided

## PR Checklist

- [ ] Searched for existing records by name, slug, domain, GitHub repo, and package name
- [ ] Added or updated exactly one tool source file in `data/tools/<first-letter>/<slug>.json`
- [ ] Added the SVG logo at `packages/website/public/logos/tools/<slug>.svg`
- [ ] Set `logoPath` in the tool JSON to `/logos/tools/<slug>.svg`
- [ ] Used a stable unique slug and existing category/use-case/capability slugs where possible
- [ ] Filled required fields from `data/catalog.schema.json`
- [ ] Added every `launchSignals` key from honest public adoption, ecosystem, package, GitHub, maturity, or distribution evidence
- [ ] Used `null`, `unknown`, or conservative tiers instead of fake or inflated signal values where evidence is missing
- [ ] Used evidence URLs that match each API, CLI, MCP, pricing, sandbox, browser, and account setup claim
- [ ] Included limitation/caution notes for money, production data, infrastructure, compliance, user accounts, browser-only flows, or brittle automation
- [ ] Did not edit `data/catalog.json`, add secrets, database credentials, Docker/Neon setup, generated build output, or unrelated files
- [ ] Added one or more `.changeset/*.md` version plans if this should release the website or CLI
- [ ] Did not edit package files, lockfiles, changelogs, workflows, repo scripts, app code, agent skills, version bumps, or release workflow files manually

## Validation

- [ ] `bun run catalog:build`
- [ ] `bun run catalog:format`
- [ ] `bun run catalog:audit`
- [ ] `bun run validate`
- [ ] `git diff --check`
