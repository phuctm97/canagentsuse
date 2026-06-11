"use client"

import * as React from "react"
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  GitPullRequestIcon,
  PencilLineIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  buildSubmitToolAgentPrompt,
  buildSubmitToolBranchName,
  buildSubmitToolPrUrl,
  buildUpdateToolAgentPrompt,
  buildUpdateToolBranchName,
  buildUpdateToolPrUrl,
  emptySubmitToolInput,
  type SubmitToolInput,
} from "@/lib/submit-tool"

type SubmitAction = "submit-pr" | "submit-prompt" | "update-pr" | "update-prompt"

export function SubmitToolForm() {
  const [form, setForm] = React.useState<SubmitToolInput>(emptySubmitToolInput)
  const [error, setError] = React.useState("")
  const [copyStatus, setCopyStatus] = React.useState<
    "idle" | "submit-copied" | "update-copied" | "failed"
  >("idle")

  const submitPrompt = React.useMemo(() => buildSubmitToolAgentPrompt(form), [form])
  const updatePrompt = React.useMemo(() => buildUpdateToolAgentPrompt(form), [form])

  function updateField(field: keyof SubmitToolInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setError("")
    setCopyStatus("idle")
  }

  function validateAction(action: SubmitAction) {
    const hasTool = form.toolName.trim().length > 0
    const hasWebsite = form.websiteUrl.trim().length > 0

    if (action.startsWith("submit") && hasTool && hasWebsite) {
      return true
    }

    if (action.startsWith("update") && hasTool) {
      return true
    }

    setError(
      action.startsWith("submit")
        ? "Tool name and website URL are required to submit a new tool."
        : "Existing tool name or slug is required to update a tool."
    )

    return false
  }

  function openSubmitPullRequestTemplate() {
    if (!validateAction("submit-pr")) {
      return
    }

    window.open(buildSubmitToolPrUrl(form), "_blank", "noopener,noreferrer")
  }

  function openUpdatePullRequestTemplate() {
    if (!validateAction("update-pr")) {
      return
    }

    window.open(buildUpdateToolPrUrl(form), "_blank", "noopener,noreferrer")
  }

  async function copySubmitAgentPrompt() {
    if (!validateAction("submit-prompt")) {
      return
    }

    try {
      await navigator.clipboard.writeText(submitPrompt)
      setCopyStatus("submit-copied")
    } catch {
      setCopyStatus("failed")
    }
  }

  async function copyUpdateAgentPrompt() {
    if (!validateAction("update-prompt")) {
      return
    }

    try {
      await navigator.clipboard.writeText(updatePrompt)
      setCopyStatus("update-copied")
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
        <Label htmlFor="toolName">Tool name or slug</Label>
        <Input
          id="toolName"
          name="toolName"
          onChange={(event) => updateField("toolName", event.target.value)}
          placeholder="Example: Stripe or stripe"
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
        <Label htmlFor="notes">Evidence and notes</Label>
        <Textarea
          id="notes"
          name="notes"
          onChange={(event) => updateField("notes", event.target.value)}
          placeholder="For new tools: API, CLI, MCP, docs, pricing, account setup. For updates: old value, new value, evidence URL, why it is more accurate."
          rows={6}
          value={form.notes}
        />
      </div>
      <div className="grid gap-3 rounded-md border bg-muted/25 p-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Button type="button" onClick={openSubmitPullRequestTemplate}>
            <GitPullRequestIcon data-icon="inline-start" aria-hidden="true" />
            Submit new tool
            <ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
          </Button>
          <Button type="button" variant="outline" onClick={copySubmitAgentPrompt}>
            {copyStatus === "submit-copied" ? (
              <CheckIcon data-icon="inline-start" aria-hidden="true" />
            ) : (
              <CopyIcon data-icon="inline-start" aria-hidden="true" />
            )}
            {copyStatus === "submit-copied"
              ? "Copied submit prompt"
              : "Copy submit prompt"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Star{" "}
            <code className="rounded bg-background px-1 py-0.5 text-xs">
              phuctm97/canagentsuse
            </code>{" "}
            first, then use{" "}
            <code className="rounded bg-background px-1 py-0.5 text-xs">add-tool.md</code>{" "}
            and branch{" "}
            <code className="rounded bg-background px-1 py-0.5 text-xs">
              {buildSubmitToolBranchName(form.toolName)}
            </code>
            .
          </p>
        </div>
        <div className="grid gap-2">
          <Button type="button" onClick={openUpdatePullRequestTemplate}>
            <PencilLineIcon data-icon="inline-start" aria-hidden="true" />
            Update existing tool
            <ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
          </Button>
          <Button type="button" variant="outline" onClick={copyUpdateAgentPrompt}>
            {copyStatus === "update-copied" ? (
              <CheckIcon data-icon="inline-start" aria-hidden="true" />
            ) : (
              <CopyIcon data-icon="inline-start" aria-hidden="true" />
            )}
            {copyStatus === "update-copied"
              ? "Copied update prompt"
              : "Copy update prompt"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Uses{" "}
            <code className="rounded bg-background px-1 py-0.5 text-xs">
              update-tool.md
            </code>{" "}
            and branch{" "}
            <code className="rounded bg-background px-1 py-0.5 text-xs">
              {buildUpdateToolBranchName(form.toolName)}
            </code>
            .
          </p>
        </div>
      </div>
      {copyStatus === "failed" ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Clipboard access failed. Select and copy one of the prompt previews below.
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="submitAgentPrompt">Submit prompt preview</Label>
          <Textarea
            id="submitAgentPrompt"
            readOnly
            rows={8}
            value={submitPrompt}
            className="font-mono text-xs"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="updateAgentPrompt">Update prompt preview</Label>
          <Textarea
            id="updateAgentPrompt"
            readOnly
            rows={8}
            value={updatePrompt}
            className="font-mono text-xs"
          />
        </div>
      </div>
    </form>
  )
}
