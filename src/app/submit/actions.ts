"use server"

import { redirect } from "next/navigation"

import { GITHUB_REPO_URL } from "@/lib/site"

function readField(formData: FormData, name: string) {
  const value = formData.get(name)

  return typeof value === "string" ? value.trim() : ""
}

export async function createSubmission(formData: FormData) {
  const toolName = readField(formData, "toolName").slice(0, 120)
  const websiteUrl = readField(formData, "websiteUrl").slice(0, 500)
  const submitter = readField(formData, "submitter").slice(0, 180)
  const notes = readField(formData, "notes").slice(0, 2000)

  if (!toolName || !websiteUrl) {
    redirect("/submit?missing=1")
  }

  const issueUrl = new URL(`${GITHUB_REPO_URL}/issues/new`)
  issueUrl.searchParams.set("title", `Add ${toolName}`)
  issueUrl.searchParams.set(
    "body",
    [
      "## Tool",
      toolName,
      "",
      "## Website",
      websiteUrl,
      "",
      "## Submitter",
      submitter || "Not provided",
      "",
      "## Agent-readiness notes",
      notes || "Not provided",
      "",
      "## Suggested evidence to check",
      "- API docs",
      "- CLI docs",
      "- MCP server docs",
      "- Pricing page",
      "- Sandbox or test-mode docs",
      "- Account setup docs",
    ].join("\n")
  )
  issueUrl.searchParams.set("labels", "catalog")

  redirect(issueUrl.toString())
}
