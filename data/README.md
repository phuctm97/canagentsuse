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

Update the matching file in `data/tools/<first-letter>/<tool-slug>.json`, then
run:

```bash
bun run catalog:build
bun run catalog:format
bun run catalog:audit
bun run build
```

For high-confidence entries, include evidence URLs for API, CLI, MCP, pricing,
docs, sandbox, or account setup claims.

`agentScore` and `launchScore` are derived by the app. Catalog records only need
capability evidence and `launchSignals`. `launchSignals` should describe
verifiable adoption and importance signals such as adoption tier, ecosystem
importance, GitHub stars, package downloads, maturity, distribution handling,
and an evidence URL.

Every pull request runs the Catalog PR workflow. It reruns the formatter,
checks that the generated catalog can be rebuilt from source, audits metadata,
and typechecks the website code that reads the catalog.

Catalog PRs may include related documentation, tests, or changesets when the
submission changes public behavior. They still must not edit the generated
`data/catalog.json` file.

Markdown is better for long-form docs, and JSON Lines is useful for append-heavy
logs or streaming datasets. This catalog is a bounded structured directory whose
records need independent review, so split formatted JSON plus a generated read
model is the simplest durable format.
