import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SITE_ASSET_URL, SITE_URL } from "@/lib/site"

import { createSubmission } from "./actions"

export const metadata: Metadata = {
  title: "Submit an agent-friendly tool",
  description:
    "Suggest a tool for Can Agents Use and include agent-readiness notes for API, CLI, MCP, docs, pricing, sandbox, browser, and account setup support.",
  alternates: {
    canonical: `${SITE_URL}/submit`,
  },
  openGraph: {
    title: "Submit an agent-friendly tool",
    description:
      "Suggest a tool for the Can Agents Use catalog with agent-readiness evidence.",
    url: `${SITE_URL}/submit`,
    images: [
      {
        url: `${SITE_ASSET_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Submit an agent-friendly tool to Can Agents Use",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Submit an agent-friendly tool",
    description:
      "Suggest a tool for the Can Agents Use catalog with agent-readiness evidence.",
    images: [`${SITE_ASSET_URL}/twitter-image`],
  },
}

type SubmitPageProps = {
  searchParams: Promise<{
    missing?: string
  }>
}

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const params = await searchParams

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/">
            <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
            Back to directory
          </Link>
        </Button>
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle>Submit an agent-friendly tool</CardTitle>
          </CardHeader>
          <CardContent>
            {params.missing ? (
              <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
                Tool name and website URL are required.
              </div>
            ) : null}
            <form action={createSubmission} className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="toolName">Tool name</Label>
                <Input id="toolName" name="toolName" placeholder="Example: Stripe" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input
                  id="websiteUrl"
                  name="websiteUrl"
                  placeholder="https://example.com"
                  type="url"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="submitter">Submitter</Label>
                <Input
                  id="submitter"
                  name="submitter"
                  placeholder="Name or email, optional"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Agent-readiness notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="CLI, API, MCP, docs, pricing, account creation, browser support..."
                  rows={6}
                />
              </div>
              <Button type="submit" className="w-fit">
                Open GitHub issue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
