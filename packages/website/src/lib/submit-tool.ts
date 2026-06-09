import { GITHUB_REPO_URL } from "@/lib/site"

export type SubmitToolInput = {
  toolName: string
  websiteUrl: string
  submitter: string
  notes: string
}

export const emptySubmitToolInput: SubmitToolInput = {
  toolName: "",
  websiteUrl: "",
  submitter: "",
  notes: "",
}

function cleanValue(value: string, fallback = "Not provided") {
  const trimmed = value.trim()

  return trimmed || fallback
}

function fieldLine(label: string, value: string) {
  const trimmed = value.trim()

  return trimmed ? `- ${label}: ${trimmed}` : `- ${label}:`
}

export function slugifyToolName(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)

  return slug || "new-tool"
}

export function buildSubmitToolBranchName(toolName: string) {
  return `catalog/add-${slugifyToolName(toolName)}`
}

export function buildSubmitToolPrBody(input: SubmitToolInput) {
  return [
    "## Tool",
    "",
    fieldLine("Name", input.toolName),
    fieldLine("Website", input.websiteUrl),
    "- Stable slug:",
    fieldLine("Submitted by", input.submitter),
    "",
    "## Change Type",
    "",
    "- [ ] Add a new tool",
    "- [ ] Update an existing tool",
    "- [ ] Change website, API, MCP, CLI, or skill behavior",
    "- [ ] Maintenance only",
    "",
    "## Release Impact",
    "",
    "- User-facing summary:",
    "- Requires package release: yes/no",
    "- Changeset included: yes/no, path:",
    "",
    "## Catalog Fields",
    "",
    "- `slug`:",
    "- `name`:",
    "- `tagline`:",
    "- `websiteUrl`:",
    "- `docsUrl`:",
    "- `githubUrl`:",
    "- `shortDescription`:",
    "- `agentSummary`:",
    "- `bestFor`:",
    "- `cautionNotes`:",
    "- `pricingSummary`:",
    "- `authModel`:",
    "- `accountCreation`:",
    "- `browserSupport`:",
    "- `cliPackage`:",
    "- `apiBaseUrl`:",
    "- `mcpServer`:",
    "- `launchSignals`:",
    "  - `adoptionTier`:",
    "  - `ecosystemImportance`:",
    "  - `githubStars`:",
    "  - `packageDownloadsMonthly`:",
    "  - `maturity`:",
    "  - `distribution`:",
    "  - `evidenceUrl`:",
    "- `categorySlugs`:",
    "- `useCaseSlugs`:",
    "",
    "## Agent Capability Evidence",
    "",
    "For each capability, include support level (`native`, `strong`, `partial`, `manual`, or `unknown`), a short detail, and a public evidence URL when available.",
    "",
    "- CLI:",
    "- API:",
    "- MCP:",
    "- Browser:",
    "- Account creation:",
    "- Pricing clarity:",
    "- Docs quality:",
    "- Sandbox:",
    "",
    "## Official Evidence",
    "",
    "- Product or homepage:",
    "- Docs home:",
    "- API docs:",
    "- CLI docs:",
    "- MCP server docs:",
    "- Pricing page:",
    "- Sandbox, test-mode, or local-mode docs:",
    "- Account setup or auth docs:",
    "- GitHub or package registry:",
    "",
    "## Submitter Notes",
    "",
    cleanValue(input.notes),
    "",
    "## PR Checklist",
    "",
    "- [ ] Added or updated exactly one tool source file in `data/tools/<first-letter>/<slug>.json`",
    "- [ ] Used a stable unique slug and existing category/use-case/capability slugs where possible",
    "- [ ] Filled required fields from `data/catalog.schema.json`",
    "- [ ] Added `launchSignals` from public adoption, ecosystem, package, GitHub, maturity, or distribution evidence",
    "- [ ] Added evidence URLs for important API, CLI, MCP, docs, pricing, sandbox, browser, and account setup claims",
    "- [ ] Included limitation/caution notes for money, production data, infrastructure, compliance, user accounts, browser-only flows, or brittle automation",
    "- [ ] Did not edit `data/catalog.json`, add secrets, database credentials, Docker/Neon setup, generated build output, or unrelated files",
    "- [ ] Added a `.changeset/*.md` file when this changes public website, API, MCP, CLI, or skill behavior",
    "",
    "## Validation",
    "",
    "- [ ] `bun run catalog:build`",
    "- [ ] `bun run catalog:format`",
    "- [ ] `bun run catalog:audit`",
    "- [ ] `bun run validate`",
    "- [ ] `git diff --check`",
  ].join("\n")
}

export function buildSubmitToolPrUrl(input: SubmitToolInput) {
  const branchName = buildSubmitToolBranchName(input.toolName)
  const title =
    input.toolName.trim().length > 0
      ? `Add ${cleanValue(input.toolName)}`
      : "Add an agent-friendly tool"
  const pullRequestUrl = new URL(`${GITHUB_REPO_URL}/compare/main...${branchName}`)

  pullRequestUrl.searchParams.set("quick_pull", "1")
  pullRequestUrl.searchParams.set("template", "add-tool.md")
  pullRequestUrl.searchParams.set("title", title)
  pullRequestUrl.searchParams.set("body", buildSubmitToolPrBody(input))

  return pullRequestUrl.toString()
}

export function buildSubmitToolAgentPrompt(input: SubmitToolInput) {
  const branchName = buildSubmitToolBranchName(input.toolName)
  const slug = slugifyToolName(input.toolName)
  const sourcePath = `data/tools/${sourceFolderForSlug(slug)}/${slug}.json`
  const prBody = buildSubmitToolPrBody(input)

  return [
    `Please add a new agent-friendly tool to ${GITHUB_REPO_URL} and open a pull request.`,
    "",
    "Tool request:",
    `- Name: ${cleanValue(input.toolName)}`,
    `- Website: ${cleanValue(input.websiteUrl)}`,
    `- Submitter: ${cleanValue(input.submitter)}`,
    `- Notes: ${cleanValue(input.notes)}`,
    "",
    "If the tool name or website URL is missing, ask me for it before editing files. If optional fields are missing, research them from official public sources.",
    "",
    "Repository workflow:",
    `1. Create a branch named \`${branchName}\`.`,
    "2. Read `data/README.md`, `data/catalog.schema.json`, `data/taxonomy.json`, and nearby records in `data/tools/` before editing.",
    `3. Add or update exactly one tool source file at \`${sourcePath}\`. Do not edit \`data/catalog.json\`; it is generated.`,
    "4. The tool source file must contain a stable unique `slug`, `name`, `tagline`, `websiteUrl`, `docsUrl`, `githubUrl`, `shortDescription`, `agentSummary`, `bestFor`, `cautionNotes`, `pricingSummary`, `authModel`, `accountCreation`, `browserSupport`, `cliPackage`, `apiBaseUrl`, `mcpServer`, `launchSignals`, `categorySlugs`, `useCaseSlugs`, and `capabilities`.",
    "5. Use existing category, use-case, and capability slugs where possible. Do not invent new slugs unless the catalog schema/data already supports them or the new slug is truly required.",
    "6. For each capability, use support level `native`, `strong`, `partial`, `manual`, or `unknown`; include a concrete detail and an official/public evidence URL when available.",
    "7. Prefer official docs, product docs, GitHub repos, package registries, pricing pages, and auth/setup docs as evidence. Avoid marketing-only or unsourced claims.",
    "8. Use `launchSignals` for public adoption, ecosystem importance, GitHub stars, package downloads, maturity, distribution, and evidence URL. Add caution notes for money, production data, accounts, compliance, infrastructure, browser-only flows, or brittle automation.",
    "9. Do not add secrets, database credentials, Docker/Neon setup, generated build output, or unrelated refactors.",
    "10. Run `bun run catalog:build`, `bun run catalog:format`, `bun run catalog:audit`, `bun run build`, and `git diff --check`.",
    "11. Commit the change and push the branch before opening the PR. GitHub's prefilled PR composer requires the head branch to exist.",
    "12. Open a PR to `main` in `phuctm97/canagentsuse` using `.github/PULL_REQUEST_TEMPLATE/add-tool.md`.",
    "",
    "Use this PR body exactly, filling any remaining blank fields with researched evidence or `Not applicable`:",
    "",
    prBody,
  ].join("\n")
}

function sourceFolderForSlug(slug: string) {
  const first = slug.charAt(0)

  return /^[a-z]$/.test(first) ? first : "0-9"
}
