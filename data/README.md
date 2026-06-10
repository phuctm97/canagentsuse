# Catalog Data

The `data/tools` directory is the source of truth for Can Agents Use. Each tool
has one canonical JSON file at:

```text
data/tools/<first-letter>/<tool-slug>.json
```

For example, Stripe lives at `data/tools/s/stripe.json`.

`data/taxonomy.json` stores shared categories, capabilities, and use cases.
`data/catalog.json` is generated from those sources for the website, API, MCP
endpoint, LLM files, and sitemap. Do not edit or commit `data/catalog.json`.

The project intentionally uses split JSON files instead of a hosted database:

- JSON is native to Next.js and JavaScript tooling.
- Each tool can be reviewed independently in GitHub.
- Parallel new-tool PRs do not edit the same hot catalog file.
- `catalog.schema.json` documents the fields and gives editors validation hints.
- The generated catalog keeps every public surface on one consistent payload.

## Editing A Tool

Search existing records before adding a tool. Check the tool name, slug,
website domain, GitHub repo, CLI package, and MCP package so you update an
existing record instead of creating a duplicate.

Update exactly one matching file in `data/tools/<first-letter>/<tool-slug>.json`,
then run:

```bash
bun run catalog:build
bun run catalog:format
bun run catalog:audit
bun run build
```

For high-confidence entries, include evidence URLs for API, CLI, MCP, pricing,
docs, sandbox, or account setup claims.

Evidence URLs should match the claim they support. Use API docs for API claims,
CLI docs or package registries for CLI claims, MCP docs or package registries
for MCP claims, and the pricing page for pricing claims.

`agentScore` and `launchScore` are derived by the app. Catalog records only need
capability evidence and `launchSignals`. `launchSignals` should describe
verifiable adoption and importance signals such as adoption tier, ecosystem
importance, GitHub stars, package downloads, maturity, distribution handling,
and an evidence URL.

Every tool submission must include every `launchSignals` key. Treat these fields
as evidence, not marketing copy: use exact public counts for GitHub stars and
package downloads when available, use `null` when a numeric signal is not
available, use `unknown` only where the schema allows it, and choose the most
conservative tier that the evidence supports. Do not fake or inflate launch
signals to make a tool look stronger.

Every pull request runs the Catalog PR workflow. It reruns the formatter,
checks that the generated catalog can be rebuilt from source, audits metadata,
and typechecks the website code that reads the catalog.

Catalog PRs may include related documentation, tests, validation changes, and
one or more `.changeset/*.md` version plans when the change should release the
website or CLI. Do not edit package files, lockfiles, changelogs, workflows,
repo scripts, app code, agent skills, version bumps, or release workflow files
manually; the manual Release workflow handles version commits from committed
changesets. Catalog PRs still must not edit the generated `data/catalog.json`
file.

Markdown is better for long-form docs, and JSON Lines is useful for append-heavy
logs or streaming datasets. This catalog is a bounded structured directory whose
records need independent review, so split formatted JSON plus a generated read
model is the simplest durable format.
