import type { Metadata } from "next"
import Link from "next/link"
import {
  BotIcon,
  BracesIcon,
  CheckCircle2Icon,
  Code2Icon,
  CopyIcon,
  FileTextIcon,
  PlugIcon,
  TerminalIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  agentInstallLinks,
  mcpInstallExample,
  mcpSmokeTest,
  skillInstallExample,
} from "@/lib/agent-install"
import { SITE_ASSET_URL, SITE_NAME, SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: "Agent install guide for MCP, skill, llms.txt, and API access",
  description:
    "Install guide for using Can Agents Use through llms.txt, MCP-style tools, OpenAPI, JSON endpoints, and a reusable agent skill.",
  alternates: {
    canonical: `${SITE_URL}/agents`,
  },
  openGraph: {
    title: `Agent install guide | ${SITE_NAME}`,
    description:
      "Connect agents to Can Agents Use through MCP, skill Markdown, llms.txt, OpenAPI, and read-only JSON APIs.",
    url: `${SITE_URL}/agents`,
    images: [
      {
        url: `${SITE_ASSET_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} agent install guide`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Agent install guide | ${SITE_NAME}`,
    description:
      "Connect agents to Can Agents Use through MCP, skill Markdown, llms.txt, OpenAPI, and read-only JSON APIs.",
    images: [`${SITE_ASSET_URL}/twitter-image`],
  },
}

export default function AgentsPage() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-card">
              <img
                src="/brand/can-agents-use-icon.png"
                alt=""
                className="size-full object-cover"
                aria-hidden="true"
              />
            </span>
            <span className="truncate text-sm font-semibold">Can Agents Use</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Directory</Link>
          </Button>
        </header>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
                Install Can Agents Use for your agent.
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                Give agents a clean read-only way to discover tool readiness without
                database access. Use MCP when your client supports remote HTTP tools,
                or install the skill Markdown as persistent instructions.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Surface
                icon={PlugIcon}
                title="MCP tools"
                body="Search and fetch catalog records with JSON-RPC tool calls."
              />
              <Surface
                icon={FileTextIcon}
                title="Agent skill"
                body="A portable SKILL.md with workflow, endpoints, and guardrails."
              />
              <Surface
                icon={BracesIcon}
                title="JSON + OpenAPI"
                body="Stable HTTP endpoints for agents that prefer direct API reads."
              />
            </div>
          </div>

          <aside className="rounded-md border bg-card p-4">
            <h2 className="text-sm font-medium">Quick links</h2>
            <Separator className="my-3" />
            <div className="grid gap-2 text-sm">
              <QuickLink href={agentInstallLinks.mcp} label="MCP endpoint" />
              <QuickLink href={agentInstallLinks.skill} label="Skill Markdown" />
              <QuickLink href={agentInstallLinks.llms} label="llms.txt" />
              <QuickLink href={agentInstallLinks.openapi} label="OpenAPI" />
              <QuickLink href={agentInstallLinks.catalog} label="Catalog JSON" />
            </div>
          </aside>
        </section>

        <section className="grid min-w-0 gap-5 lg:grid-cols-2">
          <InstallBlock
            icon={PlugIcon}
            title="Install as MCP"
            description="Use this when your agent client supports remote HTTP MCP-style servers."
            code={mcpInstallExample}
            note="Add this server config in your client MCP settings, then run the smoke test below."
          />
          <InstallBlock
            icon={BotIcon}
            title="Install as a skill"
            description="Use this when your agent supports persistent skills or project instructions."
            code={skillInstallExample}
            note="Agents can also fetch /skill.md directly and add it to their own skill registry."
          />
        </section>

        <section className="min-w-0 rounded-md border bg-card p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md border bg-background">
              <TerminalIcon className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold">MCP smoke test</h2>
              <p className="text-sm text-muted-foreground">
                This confirms that tool discovery is reachable.
              </p>
            </div>
          </div>
          <CodeBlock code={mcpSmokeTest} />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Step
            title="1. Discover"
            body="Call search_agent_tools or /api/agent/search with page 1 and limit 10 for a query like billing, scraping, stripe, MCP, or browser."
          />
          <Step
            title="2. Inspect"
            body="Fetch /api/agent/tools/{slug} to read evidence, support level, pricing, auth, and caution fields."
          />
          <Step
            title="3. Verify"
            body="Follow evidence URLs to official docs before live money, production data, or account changes."
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Step
            title="Safe access"
            body="Agents should use MCP, JSON, OpenAPI, or Markdown surfaces. The database is private persistence, not an agent integration contract."
          />
          <Step
            title="Bulk reads"
            body="Use MCP get_agent_catalog, canagentsuse://catalog, /api/agent/catalog, or /llms-full.txt once per session when comparing many tools."
          />
          <Step
            title="Request limits"
            body="Search returns 10 tools per page by default and maxes at 50. Request the next page only when hasMore is true."
          />
        </section>
      </div>
    </main>
  )
}

function Surface({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof PlugIcon
  title: string
  body: string
}) {
  return (
    <div className="rounded-md border bg-card p-4">
      <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      <h2 className="mt-3 text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  )
}

function InstallBlock({
  icon: Icon,
  title,
  description,
  code,
  note,
}: {
  icon: typeof PlugIcon
  title: string
  description: string
  code: string
  note: string
}) {
  return (
    <section className="min-w-0 rounded-md border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <CodeBlock code={code} />
      <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
        <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {note}
      </p>
    </section>
  )
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="mt-4 min-w-0 max-w-full overflow-hidden rounded-md border bg-background">
      <div className="flex items-center justify-between border-b px-3 py-2 text-xs text-muted-foreground">
        <span>copy</span>
        <CopyIcon className="size-3.5" aria-hidden="true" />
      </div>
      <pre className="max-w-full overflow-x-auto p-3 text-xs leading-6">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 font-medium transition-colors hover:bg-muted"
    >
      {label}
      <Code2Icon className="size-4 text-muted-foreground" aria-hidden="true" />
    </a>
  )
}

function Step({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border bg-card p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  )
}
