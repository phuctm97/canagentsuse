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
import {
  buildSubmitToolAgentPrompt,
  buildSubmitToolBranchName,
  buildSubmitToolPrUrl,
  emptySubmitToolInput,
  type SubmitToolInput,
} from "@/lib/submit-tool"

export function SubmitToolForm() {
  const [form, setForm] = React.useState<SubmitToolInput>(emptySubmitToolInput)
  const [error, setError] = React.useState("")
  const [copyStatus, setCopyStatus] = React.useState<"idle" | "copied" | "failed">(
    "idle"
  )

  const isReady =
    form.toolName.trim().length > 0 && form.websiteUrl.trim().length > 0
  const agentPrompt = React.useMemo(() => buildSubmitToolAgentPrompt(form), [form])

  function updateField(field: keyof SubmitToolInput, value: string) {
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

    window.open(buildSubmitToolPrUrl(form), "_blank", "noopener,noreferrer")
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
              {buildSubmitToolBranchName(form.toolName)}
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
            Copies a ready prompt for an agent to research, edit one tool source
            file, run checks, and open the PR.
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
