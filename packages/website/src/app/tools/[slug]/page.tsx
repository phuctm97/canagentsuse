import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  BadgeCheckIcon,
  BotIcon,
  Code2Icon,
  CreditCardIcon,
  ExternalLinkIcon,
  Globe2Icon,
  ShieldCheckIcon,
  TerminalIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ToolLogo } from "@/components/tool-logo"
import { tools } from "@/lib/catalog-data"
import { getToolBySlug } from "@/lib/directory"
import { SITE_ASSET_URL, SITE_NAME, SITE_URL } from "@/lib/site"

type ToolPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return tools.map((tool) => ({
    slug: tool.slug,
  }))
}

export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const { slug } = await params
  const tool = await getToolBySlug(slug)

  if (!tool) {
    return {
      title: `Tool not found | ${SITE_NAME}`,
    }
  }

  const description = `${tool.name} agent readiness: score ${tool.agentScore}/100. ${tool.shortDescription}`
  const keywords = [
    tool.name,
    `${tool.name} agent friendly`,
    `${tool.name} API`,
    `${tool.name} CLI`,
    `${tool.name} MCP`,
    ...tool.categories.map((category) => category.name),
    ...tool.capabilities.map((capability) => capability.name),
  ]

  return {
    title: `${tool.name} agent readiness (${tool.agentScore}/100)`,
    description,
    keywords,
    alternates: {
      canonical: `${SITE_URL}/tools/${tool.slug}`,
    },
    openGraph: {
      title: `${tool.name} agent readiness (${tool.agentScore}/100)`,
      description,
      url: `${SITE_URL}/tools/${tool.slug}`,
      siteName: SITE_NAME,
      images: [
        {
          url: `${SITE_ASSET_URL}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${tool.name} agent readiness on ${SITE_NAME}`,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.name} agent readiness (${tool.agentScore}/100)`,
      description,
      images: [`${SITE_ASSET_URL}/twitter-image`],
    },
  }
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params
  const tool = await getToolBySlug(slug)

  if (!tool) {
    notFound()
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    url: `${SITE_URL}/tools/${tool.slug}`,
    sameAs: [tool.websiteUrl, tool.docsUrl, tool.githubUrl].filter(Boolean),
    applicationCategory: tool.categories.map((category) => category.name).join(", "),
    description: tool.shortDescription,
    operatingSystem: "Web",
    isAccessibleForFree: true,
    mainEntityOfPage: `${SITE_URL}/tools/${tool.slug}`,
    offers: {
      "@type": "Offer",
      description: tool.pricingSummary,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: tool.agentScore,
      bestRating: 100,
      ratingCount: 1,
    },
  }

  return (
    <main className="min-h-svh bg-background text-foreground">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
              Back to directory
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`/api/agent/tools/${tool.slug}`}>
                Agent JSON
                <ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
              </a>
            </Button>
            {tool.docsUrl ? (
              <Button asChild variant="outline" size="sm">
                <a href={tool.docsUrl} target="_blank" rel="noreferrer">
                  Docs
                  <ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
                </a>
              </Button>
            ) : null}
            <Button asChild size="sm">
              <a href={tool.websiteUrl} target="_blank" rel="noreferrer">
                Visit {tool.name}
                <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {tool.categories.map((category) => (
                  <Badge key={category.slug} variant="secondary" className="rounded-sm">
                    {category.name}
                  </Badge>
                ))}
              </div>
              <div className="flex items-start gap-4">
                <ToolLogo
                  tool={tool}
                  className="mt-1 size-14 rounded-lg text-base"
                  imageClassName="size-9"
                />
                <div>
                  <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">
                    {tool.name}
                  </h1>
                  <p className="mt-3 text-xl text-muted-foreground">{tool.tagline}</p>
                </div>
              </div>
              <p className="max-w-3xl text-base leading-7">{tool.agentSummary}</p>
            </div>

            <Card className="rounded-md">
              <CardHeader>
                <CardTitle className="text-base">Agent access evidence</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {tool.capabilities.map((capability) => (
                  <div
                    key={capability.slug}
                    className="grid gap-3 rounded-md border p-4 sm:grid-cols-[180px_minmax(0,1fr)]"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <CapabilityIcon slug={capability.slug} />
                      {capability.name}
                    </div>
                    <div className="space-y-2">
                      <Badge variant="outline" className="rounded-sm capitalize">
                        {capability.supportLevel}
                      </Badge>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {capability.detail}
                      </p>
                      {capability.evidenceUrl ? (
                        <a
                          href={capability.evidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
                        >
                          Evidence
                          <ExternalLinkIcon className="size-3" aria-hidden="true" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="rounded-md">
              <CardHeader>
                <CardTitle className="text-base">Readiness score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-6xl font-semibold tabular-nums">
                  {tool.agentScore}
                </div>
                <div>
                  <div className="text-sm font-medium">{tool.agentTier}</div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {tool.scoreBreakdown.summary}
                  </p>
                </div>
                <div className="space-y-2">
                  {tool.scoreBreakdown.groups.map((group) => (
                    <ScoreGroupRow
                      key={group.key}
                      label={group.label}
                      score={group.score}
                      maxScore={group.maxScore}
                    />
                  ))}
                </div>
                <Separator />
                <Fact label="Best for" value={tool.bestFor} />
                <Fact label="Pricing" value={tool.pricingSummary} />
                <Fact label="Auth" value={tool.authModel} />
                <Fact label="Account creation" value={tool.accountCreation} />
                <Fact label="Browser support" value={tool.browserSupport} />
                {tool.cliPackage ? <Fact label="CLI" value={tool.cliPackage} /> : null}
                {tool.apiBaseUrl ? <Fact label="API" value={tool.apiBaseUrl} /> : null}
                {tool.mcpServer ? <Fact label="MCP" value={tool.mcpServer} /> : null}
              </CardContent>
            </Card>

            {tool.cautionNotes ? (
              <Card className="rounded-md border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                <CardHeader>
                  <CardTitle className="text-base">Limitations</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6">
                  {tool.cautionNotes}
                </CardContent>
              </Card>
            ) : null}
          </aside>
        </section>
      </div>
    </main>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="text-sm leading-6">{value}</div>
    </div>
  )
}

function ScoreGroupRow({
  label,
  score,
  maxScore,
}: {
  label: string
  score: number
  maxScore: number
}) {
  const percent = Math.round((score / maxScore) * 100)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {score}/{maxScore}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-foreground" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function CapabilityIcon({ slug }: { slug: string }) {
  const icons = {
    cli: TerminalIcon,
    api: Code2Icon,
    mcp: BotIcon,
    browser: Globe2Icon,
    "account-creation": BadgeCheckIcon,
    "pricing-clarity": CreditCardIcon,
    "docs-quality": ShieldCheckIcon,
  }
  const Icon = icons[slug as keyof typeof icons] ?? ShieldCheckIcon

  return <Icon className="size-4" aria-hidden="true" />
}
