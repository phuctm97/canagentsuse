# canagentsuse

## 0.2.7

### Patch Changes

- 7cee008: Split catalog contributions into one-file-per-tool sources and generate the aggregate catalog locally to reduce new-tool PR conflicts.

## 0.2.6

### Patch Changes

- 5671f7c: Compute launch scores from structured launch signals, reject raw launchScore catalog fields, and add the Catalog PR workflow plus formatter checks for canonical catalog JSON.

## 0.2.5

### Patch Changes

- 1c72679: Compute agent-readiness scores from the scoring model instead of storing them in catalog records, sort returned tool lists by highest computed score first, and align add-tool submission templates around evidence-first fields.

## 0.2.4

### Patch Changes

- 02a7822: Add structured install-guide surfaces and validation tests for CLI, MCP, skills, API, and OpenAPI agent workflows.

## 0.2.3

### Patch Changes

- 908c223: Add interactive setup prompts, CLI mode aliases, and agent-facing help guidance.

## 0.2.2

### Patch Changes

- f7c8f57: Add CLI setup guidance to the Can Agents Use skill and sync skills.sh metadata.

## 0.2.1

### Patch Changes

- b348a12: Make the CLI the primary agent setup path, add the install alias, and update website and agent-facing docs.

## 0.2.0

### Minor Changes

- bbaec2c: Release the first Can Agents Use CLI package and deploy the monorepo website package.

  The CLI exposes agent-friendly search, tool detail lookup, MCP config generation, setup helpers, and bundled skills for discovering API, CLI, MCP, and browser tools agents can actually use.
