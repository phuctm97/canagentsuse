# Changesets

Add a changeset whenever a change should release the website or CLI.

```bash
bun run changeset
```

Use these package names:

- `canagentsuse` for the public npm CLI.
- `@canagentsuse/website` for the website deployment package.

Example:

```md
---
"canagentsuse": minor
"@canagentsuse/website": patch
---

Add one-command agent setup to the CLI and update website docs.
```

Merging a commit to `main` with a changeset file runs the `Main Validate`
workflow. After that validation passes for the latest `main` commit, trigger
the `Release` workflow manually from the GitHub Actions UI.
