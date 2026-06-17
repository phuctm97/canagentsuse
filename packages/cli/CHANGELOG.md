# canagentsuse

## 0.2.15

### Patch Changes

- 8396167: Add ScreenshotOne to the agent-friendly tool catalog.

## 0.2.14

### Patch Changes

- 67887a6: Remove the standalone submit route, replace command-search submission with copy-prompt and open-PR actions, and speed up tool detail builds by resolving one catalog record at a time.

## 0.2.13

### Patch Changes

- 9285b58: Require new-tool submit prompts and skills to star the repository first.

## 0.2.12

### Patch Changes

- 95d5e90: Split new-tool submission and existing-tool update contribution flows with separate PR templates, skills, and website actions.

## 0.2.11

### Patch Changes

- f641fda: Document optional slug-named SVG logo assets for tool submissions and support explicit local logo paths in the website.

## 0.2.10

### Patch Changes

- 568c6c6: Add main-branch validation gating for manual releases and strengthen agent-facing catalog PR rules for honest signals and version plans.

## 0.2.9

### Patch Changes

- e0bf413: Add Quave ONE to the catalog: a container PaaS for apps and databases with an official remote MCP server, CLI, and REST public API.

## 0.2.8

### Patch Changes

- 5e6f97a: Rank searched tool results by text relevance before readiness score so exact tool names surface first across the API, MCP, and CLI surfaces.

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
