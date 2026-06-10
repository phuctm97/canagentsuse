## Existing Tool

- Name or slug:
- Website:
- Existing slug:
- Existing file:
- Submitted by:

## Update Type

- [ ] Correct catalog info
- [ ] Update API, CLI, MCP, or browser support
- [ ] Update pricing, auth, account, docs, or sandbox notes
- [ ] Refresh launch signals
- [ ] Fix evidence URLs
- [ ] Add or fix SVG logo

## What Changed

- Old value:
- New value:
- Evidence URL:
- Why this is more accurate:

## Scope Rule

Existing-tool PRs must update one current catalog record. Search by name, slug,
domain, GitHub repo, CLI package, and MCP package, then edit the matching file
in `data/tools/<first-letter>/<tool-slug>.json`. Do not create a duplicate
record under a new slug. Do not edit generated, package, lockfile, changelog,
workflow, script, app-code, or agent-skill files. Add `.changeset/*.md` version
plans when the change should release the website or CLI.

## Signal Honesty

When updating `launchSignals`, use exact public numbers for GitHub stars and
package downloads when available, `null` when numeric evidence is not available,
and `unknown` only where the schema allows it. Do not fake or inflate adoption,
ecosystem importance, maturity, stars, downloads, or evidence URLs.

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
- [ ] Updated exactly one existing tool source file in `data/tools/<first-letter>/<slug>.json`
- [ ] Did not create a duplicate tool record
- [ ] If adding a custom SVG logo, added it at `packages/website/public/logos/tools/<slug>.svg`
- [ ] If adding a custom SVG logo, set `logoPath` in the tool JSON to `/logos/tools/<slug>.svg`
- [ ] Used the existing stable slug unless the PR is explicitly about correcting the slug
- [ ] Used evidence URLs that match each changed API, CLI, MCP, pricing, sandbox, browser, account setup, or signal claim
- [ ] Used `null`, `unknown`, or conservative tiers instead of fake or inflated signal values where evidence is missing
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
