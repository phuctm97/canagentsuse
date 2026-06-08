"use client"

import * as React from "react"
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  GitPullRequestIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { GITHUB_REPO_URL } from "@/lib/site"

type SubmitToolFormState = {
  toolName: string
  websiteUrl: string
  submitter: string
  notes: string
}

const INITIAL_FORM_STATE: SubmitToolFormState = {
  toolName: "",
  websiteUrl: "",
  submitter: "",
  notes: "",
}

function cleanValue(value: string, fallback = "Not provided") {
  const trimmed = value.trim()

  return trimmed || fallback
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)

  return slug || "new-tool"
}

function buildBranchName(toolName: string) {
  return `catalog/add-${slugify(toolName)}`
}

function buildPullRequestBody(form: SubmitToolFormState) {
  return [
    "## Tool",
    `- Name: ${cleanValue(form.toolName)}`,
    `- Website: ${cleanValue(form.websiteUrl)}`,
    `- Submitted by: ${cleanValue(form.submitter)}`,
    "",
    "## Catalog Checklist",
    "- [ ] Added or updated the tool record in `data/catalog.json`",
    "- [ ] Used a stable slug, category slugs, use case slugs, and capability records",
    "- [ ] Added evidence URLs for API, CLI, MCP, docs, pricing, sandbox, browser, or account setup claims",
    "- [ ] Included limitation notes for paid actions, production data, infrastructure, browser-only flows, or brittle automation",
    "",
    "## Evidence To Check",
    "- API docs:",
    "- CLI docs:",
    "- MCP server docs:",
    "- Pricing page:",
    "- Sandbox or test-mode docs:",
    "- Account setup docs:",
    "",
    "## Submitter Notes",
    cleanValue(form.notes),
    "",
    "## Validation",
    "- [ ] `bun run catalog:audit`",
    "- [ ] `bun run build`",
  ].join("\n")
}

function buildPullRequestUrl(form: SubmitToolFormState) {
  const branchName = buildBranchName(form.toolName)
  const pullRequestUrl = new URL(
    `${GITHUB_REPO_URL}/compare/main...${branchName}`
  )

  pullRequestUrl.searchParams.set("quick_pull", "1")
  pullRequestUrl.searchParams.set("template", "add-tool.md")
  pullRequestUrl.searchParams.set("title", `Add ${cleanValue(form.toolName)}`)
  pullRequestUrl.searchParams.set("body", buildPullRequestBody(form))

  return pullRequestUrl.toString()
}

function buildAgentPrompt(form: SubmitToolFormState) {
  const branchName = buildBranchName(form.toolName)

  return [
    `Please add this tool to ${GITHUB_REPO_URL} and open a pull request.`,
    "",
    "Tool to add:",
    `- Name: ${cleanValue(form.toolName)}`,
    `- Website: ${cleanValue(form.websiteUrl)}`,
    `- Submitter: ${cleanValue(form.submitter)}`,
    `- Notes: ${cleanValue(form.notes)}`,
    "",
    "Expected workflow:",
    `1. Create a branch named \`${branchName}\`.`,
    "2. Edit `data/catalog.json` with a stable slug, category slugs, use case slugs, capability records, pricing/auth/account setup details, and limitation notes.",
    "3. Research and cite evidence URLs for important API, CLI, MCP, documentation, pricing, sandbox, browser support, and account setup claims.",
    "4. Keep the catalog entry agent-friendly: describe how an AI agent can operate the tool safely, what setup is required, and what actions need human approval.",
    "5. Run `bun run catalog:audit` and `bun run build`.",
    "6. Commit the catalog change, push the branch, and open a pull request to `phuctm97/canagentsuse` using `.github/PULL_REQUEST_TEMPLATE/add-tool.md`.",
  ].join("\n")
}

export function SubmitToolForm() {
  const [form, setForm] = React.useState<SubmitToolFormState>(INITIAL_FORM_STATE)
  const [error, setError] = React.useState("")
  const [copyStatus, setCopyStatus] = React.useState<"idle" | "copied" | "failed">(
    "idle"
  )

  const isReady =
    form.toolName.trim().length > 0 && form.websiteUrl.trim().length > 0
  const agentPrompt = React.useMemo(() => buildAgentPrompt(form), [form])

  function updateField(field: keyof SubmitToolFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setError("")
    setCopyStatus("idle")
  }

  function validateForm() {
    if (isReady) {
      return true
    }

    setError("Tool name and website URL are required.")

    return false
  }

  function openPullRequestTemplate() {
    if (!validateForm()) {
      return
    }

    window.open(buildPullRequestUrl(form), "_blank", "noopener,noreferrer")
  }

  async function copyAgentPrompt() {
    if (!validateForm()) {
      return
    }

    try {
      await navigator.clipboard.writeText(agentPrompt)
      setCopyStatus("copied")
    } catch {
      setCopyStatus("failed")
    }
  }

  return (
    <form className="grid gap-5" onSubmit={(event) => event.preventDefault()}>
      {error ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          {error}
        </div>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="toolName">Tool name</Label>
        <Input
          id="toolName"
          name="toolName"
          onChange={(event) => updateField("toolName", event.target.value)}
          placeholder="Example: Stripe"
          value={form.toolName}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="websiteUrl">Website URL</Label>
        <Input
          id="websiteUrl"
          name="websiteUrl"
          onChange={(event) => updateField("websiteUrl", event.target.value)}
          placeholder="https://example.com"
          type="url"
          value={form.websiteUrl}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="submitter">Submitter</Label>
        <Input
          id="submitter"
          name="submitter"
          onChange={(event) => updateField("submitter", event.target.value)}
          placeholder="Name or email, optional"
          value={form.submitter}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Agent-readiness notes</Label>
        <Textarea
          id="notes"
          name="notes"
          onChange={(event) => updateField("notes", event.target.value)}
          placeholder="CLI, API, MCP, docs, pricing, account creation, browser support..."
          rows={6}
          value={form.notes}
        />
      </div>
      <div className="grid gap-3 rounded-md border bg-muted/25 p-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Button type="button" onClick={openPullRequestTemplate}>
            <GitPullRequestIcon data-icon="inline-start" aria-hidden="true" />
            Open GitHub PR template
            <ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
          </Button>
          <p className="text-sm text-muted-foreground">
            Opens a prefilled PR composer for branch{" "}
            <code className="rounded bg-background px-1 py-0.5 text-xs">
              {buildBranchName(form.toolName)}
            </code>
            .
          </p>
        </div>
        <div className="grid gap-2">
          <Button type="button" variant="outline" onClick={copyAgentPrompt}>
            {copyStatus === "copied" ? (
              <CheckIcon data-icon="inline-start" aria-hidden="true" />
            ) : (
              <CopyIcon data-icon="inline-start" aria-hidden="true" />
            )}
            {copyStatus === "copied" ? "Copied agent prompt" : "Copy agent prompt"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Copies a ready prompt for an agent to research, edit the catalog, run
            checks, and open the PR.
          </p>
        </div>
      </div>
      {copyStatus === "failed" ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Clipboard access failed. Select and copy the prompt preview below.
        </div>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="agentPrompt">Agent prompt preview</Label>
        <Textarea
          id="agentPrompt"
          readOnly
          rows={8}
          value={agentPrompt}
          className="font-mono text-xs"
        />
      </div>
    </form>
  )
}
