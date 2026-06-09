# Catalog Data

`catalog.json` is the source of truth for Can Agents Use.

The project intentionally uses JSON instead of a database:

- JSON is native to Next.js and JavaScript tooling.
- The full catalog can be reviewed in GitHub.
- `catalog.schema.json` documents the fields and gives editors validation hints.
- The website, API, MCP endpoint, LLM files, and sitemap all read the same file.

## Editing A Tool

Update the matching object in `catalog.json`, then run:

```bash
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
checks that `data/catalog.json` has no formatting diff, audits metadata, and
typechecks the website code that reads the catalog.

Markdown is better for long-form docs, and JSON Lines is useful for append-heavy
logs or streaming datasets. This catalog is a bounded structured directory that
is loaded as one searchable payload, so formatted JSON is the simplest durable
format.
