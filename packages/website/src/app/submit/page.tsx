import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SITE_ASSET_URL, SITE_URL } from "@/lib/site"

import { SubmitToolForm } from "./submit-tool-form"

export const metadata: Metadata = {
  title: "Submit an agent-friendly tool",
  description:
    "Suggest a new tool or update an existing Can Agents Use catalog record with agent-readiness evidence for API, CLI, MCP, docs, pricing, sandbox, browser, and account setup support.",
  alternates: {
    canonical: `${SITE_URL}/submit`,
  },
  openGraph: {
    title: "Submit an agent-friendly tool",
    description:
      "Suggest a new tool or update an existing Can Agents Use catalog record with agent-readiness evidence.",
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
      "Suggest a new tool or update an existing Can Agents Use catalog record with agent-readiness evidence.",
    images: [`${SITE_ASSET_URL}/twitter-image`],
  },
}

export default function SubmitPage() {
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
            <h1
              data-slot="card-title"
              className="font-heading text-base leading-snug font-medium"
            >
              Submit an agent-friendly tool
            </h1>
          </CardHeader>
          <CardContent>
            <SubmitToolForm />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
