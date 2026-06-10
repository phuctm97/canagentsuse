"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  BotIcon,
  BracesIcon,
  CheckIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleDashedIcon,
  Code2Icon,
  CopyIcon,
  CreditCardIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  FilterIcon,
  GitPullRequestIcon,
  Globe2Icon,
  PlugIcon,
  SearchIcon,
  ShieldCheckIcon,
  TerminalIcon,
} from "lucide-react"

import type {
  DirectoryCapability,
  DirectoryCategory,
  DirectoryListTool,
} from "@/lib/directory"
import {
  agentInstallLinks,
  cliAgentInstallExamples,
  cliInstallExample,
  mcpInstallExample,
} from "@/lib/agent-install"
import {
  buildSubmitToolAgentPrompt,
  buildSubmitToolPrUrl,
  buildUpdateToolAgentPrompt,
  buildUpdateToolPrUrl,
  emptySubmitToolInput,
} from "@/lib/submit-tool"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ToolLogo } from "@/components/tool-logo"

const capabilityIcons = {
  cli: TerminalIcon,
  api: Code2Icon,
  mcp: BotIcon,
  browser: Globe2Icon,
  "account-creation": BadgeCheckIcon,
  "pricing-clarity": CreditCardIcon,
  "docs-quality": ShieldCheckIcon,
  sandbox: DatabaseIcon,
}

const highSignalCapabilitySlugs = [
  "cli",
  "api",
  "mcp",
  "browser",
  "pricing-clarity",
]
const scoreWeights = [
  {
    label: "Machine operability",
    value: 25,
    description: "API, CLI, MCP, and browser fallback.",
  },
  {
    label: "Agent safety",
    value: 25,
    description: "Sandbox, scoped auth, dry-runs, and review guardrails.",
  },
  {
    label: "Agent readability",
    value: 20,
    description: "Docs, pricing clarity, and evidence links.",
  },
  {
    label: "Auth and setup",
    value: 15,
    description: "Self-serve signup and clear auth model.",
  },
  {
    label: "Production reliability",
    value: 15,
    description: "Webhooks, logs, versioning, and rate-limit clarity.",
  },
]
const toolsBatchSize = 10
const maxCommandToolResults = 24
const maxCommandCategoryResults = 10
const heroCliInstallCommand = "npx canagentsuse@latest setup"
const tokenDemoApiCall =
  "curl -fsS 'https://canagentsuse.com/api/agent/search?q=billing&capability=api&limit=3'"
const tokenDemoPrompt = [
  "Use Can Agents Use before broad web search to save context.",
  "",
  "Task: Find billing tools with API support, sandbox or test mode, pricing clarity, and caution notes.",
  "",
  "First make this bounded catalog call:",
  "https://canagentsuse.com/api/agent/search?q=billing&capability=api&limit=3",
  "",
  "Then inspect one candidate with /api/agent/tools/{slug}. Only open vendor docs if the structured record is missing evidence for the decision.",
].join("\n")
const githubRepoHref = "https://github.com/phuctm97/canagentsuse"
const cursorMcpInstallHref =
  "cursor://anysphere.cursor-deeplink/mcp/install?name=canagentsuse&config=eyJjYW5hZ2VudHN1c2UiOnsidHlwZSI6Imh0dHAiLCJ1cmwiOiJodHRwczovL2NhbmFnZW50c3VzZS5jb20vYXBpL21jcCJ9fQ=="
const connectAgentPrompt = [
  "Please connect your agent to Can Agents Use.",
  "",
  "Goal: use Can Agents Use as a read-only catalog for finding software that AI agents can safely operate.",
  "",
  "Preferred setup:",
  `1. Run the CLI installer: ${cliInstallExample}`,
  "",
  "2. If the CLI cannot write your agent config, add this MCP server config manually:",
  mcpInstallExample,
  "",
  `3. Otherwise, read ${agentInstallLinks.llmsFull} once and use ${agentInstallLinks.search}?q=<query>&page=1&limit=10 for focused searches.`,
  "",
  "Guardrails:",
  "- Do not request database access.",
  "- Prefer MCP, JSON, OpenAPI, or Markdown surfaces over scraping the website.",
  "- Treat scores as discovery signals, not legal, security, purchasing, or compliance approval.",
].join("\n")
const submitToolPrUrl = buildSubmitToolPrUrl(emptySubmitToolInput)
const submitToolAgentPrompt = buildSubmitToolAgentPrompt(emptySubmitToolInput)
const updateToolPrUrl = buildUpdateToolPrUrl(emptySubmitToolInput)
const updateToolAgentPrompt = buildUpdateToolAgentPrompt(emptySubmitToolInput)

type ToolDirectoryProps = {
  tools: DirectoryListTool[]
  categories: DirectoryCategory[]
  capabilities: DirectoryCapability[]
  isFallback: boolean
}

type AgentAccessCopyTarget =
  | "mcp"
  | "skill"
  | "prompt"
  | "submit"
  | "update"
  | "demo-api"
  | "demo-prompt"
  | "claude-code"
  | "cursor"
  | "codex"
  | "opencode"
  | "gemini-cli"
  | "universal"

const copyToastLabels: Record<AgentAccessCopyTarget, string> = {
  mcp: "MCP config",
  skill: "Install command",
  prompt: "Agent prompt",
  submit: "Submit prompt",
  update: "Update prompt",
  "demo-api": "Demo API call",
  "demo-prompt": "Demo agent prompt",
  "claude-code": "Claude Code command",
  cursor: "Cursor command",
  codex: "Codex command",
  opencode: "OpenCode command",
  "gemini-cli": "Gemini CLI command",
  universal: "Universal skill command",
}

export function ToolDirectory({
  tools,
  categories,
  capabilities,
}: ToolDirectoryProps) {
  const router = useRouter()
  const [commandOpen, setCommandOpen] = React.useState(false)
  const [category, setCategory] = React.useState("all")
  const [categoryMenuOpen, setCategoryMenuOpen] = React.useState(false)
  const [categorySearch, setCategorySearch] = React.useState("")
  const [selectedCapabilities, setSelectedCapabilities] = React.useState<string[]>([])
  const [agentAccessCopy, setAgentAccessCopy] = React.useState<{
    target: AgentAccessCopyTarget
    status: "copied" | "failed"
  } | null>(null)
  const [visibleCount, setVisibleCount] = React.useState(toolsBatchSize)
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null)
  const categorySearchInputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setCommandOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const filteredTools = React.useMemo(() => {
    return tools.filter((tool) => {
      const matchesCategory =
        category === "all" ||
        tool.categories.some((item) => item.slug === category)
      const capabilitySlugs = tool.capabilities.map((item) => item.slug)
      const matchesCapabilities = selectedCapabilities.every((slug) =>
        capabilitySlugs.includes(slug)
      )

      return matchesCategory && matchesCapabilities
    })
  }, [category, selectedCapabilities, tools])

  React.useEffect(() => {
    setVisibleCount(toolsBatchSize)
  }, [category, selectedCapabilities])

  React.useEffect(() => {
    if (!categoryMenuOpen) return

    requestAnimationFrame(() => categorySearchInputRef.current?.focus())
  }, [categoryMenuOpen])

  React.useEffect(() => {
    if (!agentAccessCopy) return

    const timeout = window.setTimeout(() => setAgentAccessCopy(null), 2200)

    return () => window.clearTimeout(timeout)
  }, [agentAccessCopy])

  const visibleTools = filteredTools.slice(0, visibleCount)
  const visibleEnd = Math.min(visibleCount, filteredTools.length)
  const hasMoreTools = visibleEnd < filteredTools.length
  const tokenDemoTools = React.useMemo(() => {
    const preferredSlugs = ["stripe", "paddle", "revenuecat"]
    const bySlug = new Map(tools.map((tool) => [tool.slug, tool]))
    const preferredTools = preferredSlugs
      .map((slug) => bySlug.get(slug))
      .filter((tool): tool is DirectoryListTool => Boolean(tool))

    const demoTools =
      preferredTools.length >= 3
        ? preferredTools
        : [
            ...preferredTools,
            ...tools.filter((tool) => !preferredSlugs.includes(tool.slug)),
          ].slice(0, 3)

    return [...demoTools].sort((left, right) => right.agentScore - left.agentScore)
  }, [tools])

  const loadMoreTools = React.useCallback(() => {
    setVisibleCount((current) =>
      Math.min(current + toolsBatchSize, filteredTools.length)
    )
  }, [filteredTools.length])

  React.useEffect(() => {
    const node = loadMoreRef.current

    if (!node || !hasMoreTools) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreTools()
        }
      },
      { rootMargin: "260px 0px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMoreTools, loadMoreTools])

  const selectedCategoryName =
    category === "all"
      ? "All categories"
      : categories.find((item) => item.slug === category)?.name ?? "Category"

  const categoryCounts = React.useMemo(() => {
    const counts = new Map(categories.map((item) => [item.slug, 0]))

    for (const tool of tools) {
      for (const item of tool.categories) {
        counts.set(item.slug, (counts.get(item.slug) ?? 0) + 1)
      }
    }

    return counts
  }, [categories, tools])

  const categoryOptions = React.useMemo(() => {
    return [
      {
        slug: "all",
        name: "All categories",
        description: `${tools.length} tools`,
      },
      ...categories.map((item) => {
        const count = categoryCounts.get(item.slug) ?? 0

        return {
          slug: item.slug,
          name: item.name,
          description: `${count} tools`,
        }
      }),
    ]
  }, [categories, categoryCounts, tools.length])

  const filteredCategoryOptions = React.useMemo(() => {
    const query = categorySearch.trim().toLowerCase()

    if (!query) return categoryOptions

    return categoryOptions.filter((item) =>
      [item.name, item.description, item.slug]
        .join(" ")
        .toLowerCase()
        .includes(query)
    )
  }, [categoryOptions, categorySearch])

  function setCategoryMenu(open: boolean) {
    setCategoryMenuOpen(open)

    if (!open) {
      setCategorySearch("")
    }
  }

  function toggleCapability(slug: string) {
    setSelectedCapabilities((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug]
    )
  }

  const openTool = React.useCallback((tool: DirectoryListTool) => {
    setCommandOpen(false)
    router.push(`/tools/${tool.slug}`)
  }, [router])

  const chooseCategory = React.useCallback((slug: string) => {
    setCommandOpen(false)
    setCategory(slug)
  }, [])

  const chooseCapability = React.useCallback((slug: string) => {
    setCommandOpen(false)
    setSelectedCapabilities((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug]
    )
  }, [])

  const goToSubmit = React.useCallback(() => {
    setCommandOpen(false)
    router.push("/submit")
  }, [router])

  const copyAgentAccessText = React.useCallback(
    async (target: AgentAccessCopyTarget, text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setAgentAccessCopy({ target, status: "copied" })
        toast.success("Copied", {
          description: `${copyToastLabels[target]} copied to clipboard.`,
        })
      } catch {
        setAgentAccessCopy({ target, status: "failed" })
        toast.error("Clipboard blocked", {
          description: "Open the install guide for manual setup.",
        })
      }
    },
    []
  )

  return (
    <main className="min-h-svh bg-background text-foreground">
      <ToolCommandDialog
        open={commandOpen}
        onOpenChange={setCommandOpen}
        tools={tools}
        categories={categories}
        capabilities={capabilities}
        selectedCapabilities={selectedCapabilities}
        onOpenTool={openTool}
        onChooseCategory={chooseCategory}
        onChooseCapability={chooseCapability}
        onSubmitTool={goToSubmit}
      />

      <section className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8">
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
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild size="icon" variant="outline" aria-label="Open GitHub repo">
                    <a href={githubRepoHref} target="_blank" rel="noopener noreferrer">
                      <GithubMarkIcon aria-hidden="true" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open GitHub repo</TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" type="button">
                    Submit
                    <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onSelect={() => {
                        window.open(submitToolPrUrl, "_blank", "noopener,noreferrer")
                      }}
                    >
                      <GitPullRequestIcon />
                      Open new PR template
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        void copyAgentAccessText("submit", submitToolAgentPrompt)
                      }}
                    >
                      {agentAccessCopy?.target === "submit" &&
                      agentAccessCopy.status === "copied" ? (
                        <CheckIcon />
                      ) : (
                        <CopyIcon />
                      )}
                      {agentAccessCopy?.target === "submit" &&
                      agentAccessCopy.status === "copied"
                        ? "Copied agent prompt"
                        : "Copy prompt for agent"}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" type="button" variant="secondary">
                    Update
                    <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onSelect={() => {
                        window.open(updateToolPrUrl, "_blank", "noopener,noreferrer")
                      }}
                    >
                      <GitPullRequestIcon />
                      Open update PR template
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        void copyAgentAccessText("update", updateToolAgentPrompt)
                      }}
                    >
                      {agentAccessCopy?.target === "update" &&
                      agentAccessCopy.status === "copied" ? (
                        <CheckIcon />
                      ) : (
                        <CopyIcon />
                      )}
                      {agentAccessCopy?.target === "update" &&
                      agentAccessCopy.status === "copied"
                        ? "Copied update prompt"
                        : "Copy update prompt for agent"}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="grid min-w-0 gap-8 pb-7 pt-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <div className="flex min-w-0 max-w-4xl flex-col gap-5 pt-3 lg:pt-10">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-balance sm:text-5xl lg:text-6xl">
                Find tools an agent can actually use.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Search by CLI, API, MCP, browser support, account setup, pricing,
                and documentation quality. Fast enough for builders, structured
                enough for agents.
              </p>
              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="group flex w-full max-w-2xl items-center justify-between overflow-hidden rounded-md border bg-card px-4 py-3 text-left shadow-sm transition-colors hover:bg-muted/50"
                aria-keyshortcuts="Meta+K Control+K"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <SearchIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate text-sm text-muted-foreground sm:hidden">
                    Search tools
                  </span>
                  <span className="hidden truncate text-sm text-muted-foreground sm:inline">
                    Search tools, categories, and agent capabilities
                  </span>
                </span>
                <span className="hidden shrink-0 items-center gap-1 rounded-sm border bg-muted px-2 py-1 font-mono text-xs text-muted-foreground sm:flex">
                  ⌘K / Ctrl K
                </span>
              </button>
              <div className="grid min-w-0 max-w-2xl grid-cols-3 overflow-hidden rounded-md border bg-card text-sm shadow-xs">
                <Stat value={tools.length.toString()} label="tools" />
                <Stat value={categories.length.toString()} label="categories" />
                <Stat value={capabilities.length.toString()} label="signals" />
              </div>
            </div>
            <aside className="min-w-0 rounded-md border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3 border-b pb-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background shadow-xs">
                    <BotIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">Connect your agent</div>
                  </div>
                </div>

                <div className="min-w-0 overflow-hidden rounded-md border bg-background shadow-xs">
                  <div className="flex items-center justify-between border-b px-3 py-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Add in one command
                    </span>
                    <button
                      type="button"
                      onClick={() => copyAgentAccessText("skill", heroCliInstallCommand)}
                      className="inline-flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="Copy CLI install command"
                    >
                      {agentAccessCopy?.target === "skill" &&
                      agentAccessCopy.status === "copied" ? (
                        <CheckIcon className="size-3.5" aria-hidden="true" />
                      ) : (
                        <CopyIcon className="size-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <pre className="max-w-full overflow-x-auto px-3 py-3 text-xs leading-6">
                    <code className="block min-w-max">{heroCliInstallCommand}</code>
                  </pre>
                </div>

                <Button asChild className="w-full justify-start">
                  <a href="/agents" target="_blank" rel="noopener noreferrer">
                    <ExternalLinkIcon data-icon="inline-start" aria-hidden="true" />
                    Read docs
                  </a>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-start">
                      <BotIcon data-icon="inline-start" aria-hidden="true" />
                      Pick your agent
                      <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuLabel>Install for</DropdownMenuLabel>
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <a href={cursorMcpInstallHref}>
                          <PlugIcon />
                          <span className="flex min-w-0 flex-col">
                            <span>Cursor</span>
                            <span className="text-xs text-muted-foreground">
                              Open direct MCP install
                            </span>
                          </span>
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          void copyAgentAccessText("cursor", cliAgentInstallExamples.cursor)
                        }}
                      >
                        <TerminalIcon />
                        <span className="flex min-w-0 flex-col">
                          <span>Cursor CLI setup</span>
                          <span className="text-xs text-muted-foreground">
                            Copy CLI setup command
                          </span>
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          void copyAgentAccessText(
                            "claude-code",
                            cliAgentInstallExamples.claude
                          )
                        }}
                      >
                        <TerminalIcon />
                        <span className="flex min-w-0 flex-col">
                          <span>Claude Code</span>
                          <span className="text-xs text-muted-foreground">
                            Copy CLI setup command
                          </span>
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          void copyAgentAccessText("codex", cliAgentInstallExamples.codex)
                        }}
                      >
                        <BotIcon />
                        <span className="flex min-w-0 flex-col">
                          <span>Codex</span>
                          <span className="text-xs text-muted-foreground">
                            Copy CLI setup command
                          </span>
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          void copyAgentAccessText(
                            "opencode",
                            cliAgentInstallExamples.opencode
                          )
                        }}
                      >
                        <Code2Icon />
                        <span className="flex min-w-0 flex-col">
                          <span>OpenCode</span>
                          <span className="text-xs text-muted-foreground">
                            Copy CLI setup command
                          </span>
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          void copyAgentAccessText(
                            "gemini-cli",
                            cliAgentInstallExamples.gemini
                          )
                        }}
                      >
                        <CircleDashedIcon />
                        <span className="flex min-w-0 flex-col">
                          <span>Gemini CLI</span>
                          <span className="text-xs text-muted-foreground">
                            Copy CLI setup command
                          </span>
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          void copyAgentAccessText(
                            "universal",
                            cliAgentInstallExamples.universal
                          )
                        }}
                      >
                        <BracesIcon />
                        <span className="flex min-w-0 flex-col">
                          <span>Universal skills folder</span>
                          <span className="text-xs text-muted-foreground">
                            Copy fallback setup command
                          </span>
                        </span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onSelect={() => {
                          void copyAgentAccessText("mcp", mcpInstallExample)
                        }}
                      >
                        <BracesIcon />
                        Copy MCP config
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          void copyAgentAccessText("prompt", connectAgentPrompt)
                        }}
                      >
                        <CopyIcon />
                        Copy full agent prompt
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div
                  aria-live="polite"
                  className="min-h-5 text-xs text-muted-foreground"
                >
                  {agentAccessCopy?.status === "failed"
                    ? "Clipboard blocked. Open the install guide for manual setup."
                    : "Uses the CLI, MCP, skills, and public read-only endpoints."}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-xl font-semibold">Search with less context</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Same task. Fewer pages in the agent context.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => copyAgentAccessText("demo-prompt", tokenDemoPrompt)}
            >
              {agentAccessCopy?.target === "demo-prompt" &&
              agentAccessCopy.status === "copied" ? (
                <CheckIcon data-icon="inline-start" aria-hidden="true" />
              ) : (
                <CopyIcon data-icon="inline-start" aria-hidden="true" />
              )}
              Copy prompt
            </Button>
          </div>

          <div className="rounded-md border bg-muted/40 px-4 py-3">
            <p className="text-sm">
              Task: find billing tools with API, sandbox, pricing, and caution notes.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-4 rounded-md border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold">Normal search</h3>
                <Badge variant="outline">Many pages</Badge>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {["Search", "Docs", "Pricing", "API docs", "Setup", "More docs"].map(
                  (item) => (
                    <div
                      key={item}
                      className="rounded-md border bg-muted/50 px-2 py-2 text-center text-xs font-medium text-muted-foreground"
                    >
                      {item}
                    </div>
                  )
                )}
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">Context pressure</span>
                  <span className="text-muted-foreground">High</span>
                </div>
                <div className="grid h-2 grid-cols-5 gap-1">
                  {["search", "docs", "pricing", "api", "setup"].map((item) => (
                    <div key={item} className="rounded-full bg-muted-foreground" />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-4 rounded-md border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold">Can Agents Use</h3>
                <Badge variant="secondary">2 reads</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Search JSON", value: "/api/agent/search" },
                  { label: "Tool record", value: "/api/agent/tools/{slug}" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-md border bg-muted/50 px-3 py-3"
                  >
                    <div className="text-xs font-medium text-muted-foreground">
                      {item.label}
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">Context pressure</span>
                  <span className="text-muted-foreground">Low</span>
                </div>
                <div className="grid h-2 grid-cols-5 gap-1">
                  <div className="rounded-full bg-primary" />
                  <div className="rounded-full bg-primary" />
                  <div className="rounded-full bg-muted" />
                  <div className="rounded-full bg-muted" />
                  <div className="rounded-full bg-muted" />
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-md bg-muted p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs font-medium uppercase text-muted-foreground">
                    First bounded call
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copyAgentAccessText("demo-api", tokenDemoApiCall)}
                  >
                    {agentAccessCopy?.target === "demo-api" &&
                    agentAccessCopy.status === "copied" ? (
                      <CheckIcon data-icon="inline-start" aria-hidden="true" />
                    ) : (
                      <CopyIcon data-icon="inline-start" aria-hidden="true" />
                    )}
                    Copy API
                  </Button>
                </div>
                <pre className="max-w-full overflow-x-auto text-xs leading-6">
                  <code className="block min-w-max">
                    GET /api/agent/search?q=billing&amp;capability=api&amp;limit=3
                  </code>
                </pre>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border bg-card">
            <div className="grid grid-cols-[minmax(0,1fr)_64px] gap-3 border-b bg-muted/50 px-3 py-2 text-xs font-medium uppercase text-muted-foreground sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_72px]">
              <div>Top matches</div>
              <div className="hidden sm:block">Signals</div>
              <div className="text-right">Score</div>
            </div>
            {tokenDemoTools.map((tool) => (
              <TokenDemoToolRow key={tool.slug} tool={tool} />
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            Start narrow. Open docs only when the record is missing evidence.
          </p>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Tool index</h2>
            <p className="text-sm text-muted-foreground">
              {filteredTools.length} results in {selectedCategoryName.toLowerCase()}
              {selectedCapabilities.length > 0
                ? ` with ${selectedCapabilities.length} active filters`
                : ""}
            </p>
          </div>
          {selectedCapabilities.length > 0 || category !== "all" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCategory("all")
                setSelectedCapabilities([])
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </div>

        <DropdownMenu open={categoryMenuOpen} onOpenChange={setCategoryMenu}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full justify-between sm:w-80"
              aria-label={`Category: ${selectedCategoryName}`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <FilterIcon data-icon="inline-start" aria-hidden="true" />
                <span className="truncate">{selectedCategoryName}</span>
              </span>
              <ChevronDownIcon
                data-icon="inline-end"
                className={cn("transition-transform", categoryMenuOpen ? "rotate-180" : "")}
                aria-hidden="true"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[min(22rem,calc(100vw-2rem))] p-2"
          >
            <InputGroup className="h-9">
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                ref={categorySearchInputRef}
                value={categorySearch}
                onChange={(event) => setCategorySearch(event.target.value)}
                onKeyDown={(event) => {
                  event.stopPropagation()

                  if (event.key === "Escape") {
                    setCategoryMenu(false)
                  }
                }}
                placeholder="Search categories"
              />
            </InputGroup>
            <DropdownMenuGroup className="mt-2 max-h-72 overflow-y-auto">
              {filteredCategoryOptions.length > 0 ? (
                filteredCategoryOptions.map((item) => {
                  const selected = item.slug === category

                  return (
                    <DropdownMenuItem
                      key={item.slug}
                      className="items-start gap-3 py-2"
                      onSelect={() => {
                        setCategory(item.slug)
                        setCategoryMenu(false)
                      }}
                    >
                      <FolderDot />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                      {selected ? (
                        <CheckCircle2Icon className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
                      ) : null}
                    </DropdownMenuItem>
                  )
                })
              ) : (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  No matching category.
                </div>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-md border bg-card p-3 lg:sticky lg:top-4 lg:self-start">
            <div className="flex items-center gap-2 px-1 py-2 text-sm font-medium">
              <FilterIcon className="size-4" aria-hidden="true" />
              Agent signals
            </div>
            <div className="flex flex-col gap-1">
              {capabilities.map((capability) => {
                const Icon =
                  capabilityIcons[capability.slug as keyof typeof capabilityIcons] ??
                  CircleDashedIcon
                const selected = selectedCapabilities.includes(capability.slug)

                return (
                  <button
                    key={capability.slug}
                    type="button"
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted",
                      selected ? "bg-muted text-foreground" : "text-muted-foreground"
                    )}
                    onClick={() => toggleCapability(capability.slug)}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{capability.name}</span>
                    </span>
                    {selected ? (
                      <CheckCircle2Icon className="size-4 shrink-0" aria-hidden="true" />
                    ) : null}
                  </button>
                )
              })}
            </div>
            <Separator className="my-3" />
            <div className="px-1">
              <div className="flex flex-col gap-1">
                <div>
                  <div className="text-sm font-medium">100-point agent score</div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Higher means an agent can operate the tool with less manual
                    setup and safer production guardrails.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-3">
                {scoreWeights.map((weight) => (
                  <WeightRow key={weight.label} {...weight} />
                ))}
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-3">
            <div className="overflow-hidden rounded-md border bg-card">
              <div className="grid grid-cols-[48px_minmax(0,1fr)_76px] gap-3 border-b bg-muted/50 px-3 py-2 text-xs font-medium uppercase text-muted-foreground sm:grid-cols-[56px_minmax(0,1fr)_210px_82px]">
                <div>#</div>
                <div>Tool</div>
                <div className="hidden sm:block">Agent access</div>
                <div className="text-right">Score</div>
              </div>
              {filteredTools.length > 0 ? (
                visibleTools.map((tool, index) => (
                  <ToolRow key={tool.slug} tool={tool} rank={index + 1} />
                ))
              ) : (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No tools match those filters yet.
                </div>
              )}
            </div>
            {hasMoreTools ? (
              <div
                ref={loadMoreRef}
                className="flex items-center justify-center rounded-md border bg-card px-3 py-3"
              >
                <Button variant="outline" size="sm" onClick={loadMoreTools}>
                  Load more
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}

function GithubMarkIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4"
      {...props}
    >
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.52 2.86 8.36 6.84 9.72.5.1.68-.22.68-.49 0-.24-.01-1.05-.01-1.9-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1.01.07 1.54 1.06 1.54 1.06.89 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.64-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.33 9.33 0 0 1 12 6.99c.85 0 1.7.12 2.5.34 1.9-1.32 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.1 10.1 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  )
}

const ToolCommandDialog = React.memo(function ToolCommandDialog({
  open,
  onOpenChange,
  tools,
  categories,
  capabilities,
  selectedCapabilities,
  onOpenTool,
  onChooseCategory,
  onChooseCapability,
  onSubmitTool,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tools: DirectoryListTool[]
  categories: DirectoryCategory[]
  capabilities: DirectoryCapability[]
  selectedCapabilities: string[]
  onOpenTool: (tool: DirectoryListTool) => void
  onChooseCategory: (slug: string) => void
  onChooseCapability: (slug: string) => void
  onSubmitTool: () => void
}) {
  const [query, setQuery] = React.useState("")
  const deferredQuery = React.useDeferredValue(query)
  const commandListRef = React.useRef<HTMLDivElement | null>(null)
  const normalizedQuery = normalizeSearchText(deferredQuery)
  const queryTerms = React.useMemo(
    () => normalizedQuery.split(" ").filter(Boolean),
    [normalizedQuery]
  )

  const toolIndex = React.useMemo(
    () =>
      tools.map((tool, index) => ({
        tool,
        index,
        searchText: normalizeSearchText(toolSearchValue(tool)),
      })),
    [tools]
  )
  const categoryIndex = React.useMemo(
    () =>
      [
        {
          category: {
            slug: "all",
            name: "All categories",
            description: "Every tool in the catalog",
          },
          searchText: "all categories every tool catalog",
        },
        ...categories.map((category) => ({
          category,
          searchText: normalizeSearchText(
            `${category.name} ${category.slug} ${category.description} category`
          ),
        })),
      ],
    [categories]
  )
  const capabilityIndex = React.useMemo(
    () =>
      capabilities.map((capability) => ({
        capability,
        searchText: normalizeSearchText(
          `${capability.name} ${capability.slug} ${capability.description} ${capability.group} capability`
        ),
      })),
    [capabilities]
  )

  const toolResults = React.useMemo(() => {
    if (queryTerms.length === 0) {
      return tools.slice(0, maxCommandToolResults)
    }

    return toolIndex
      .map((item) => ({
        ...item,
        rank: rankSearchText(item.searchText, item.tool.name, queryTerms, normalizedQuery),
      }))
      .filter((item) => item.rank > 0)
      .sort(
        (a, b) =>
          b.tool.agentScore - a.tool.agentScore ||
          b.rank - a.rank ||
          a.index - b.index
      )
      .slice(0, maxCommandToolResults)
      .map((item) => item.tool)
  }, [normalizedQuery, queryTerms, toolIndex, tools])

  const categoryResults = React.useMemo(() => {
    if (queryTerms.length === 0) {
      return categoryIndex.slice(0, maxCommandCategoryResults).map((item) => item.category)
    }

    return categoryIndex
      .map((item, index) => ({
        ...item,
        index,
        rank: rankSearchText(item.searchText, item.category.name, queryTerms, normalizedQuery),
      }))
      .filter((item) => item.rank > 0)
      .sort((a, b) => b.rank - a.rank || a.index - b.index)
      .slice(0, maxCommandCategoryResults)
      .map((item) => item.category)
  }, [categoryIndex, normalizedQuery, queryTerms])

  const capabilityResults = React.useMemo(() => {
    if (queryTerms.length === 0) {
      return capabilities
    }

    return capabilityIndex
      .map((item, index) => ({
        ...item,
        index,
        rank: rankSearchText(item.searchText, item.capability.name, queryTerms, normalizedQuery),
      }))
      .filter((item) => item.rank > 0)
      .sort((a, b) => b.rank - a.rank || a.index - b.index)
      .map((item) => item.capability)
  }, [capabilities, capabilityIndex, normalizedQuery, queryTerms])

  const isSearching = query !== deferredQuery
  const hasResults =
    toolResults.length > 0 ||
    categoryResults.length > 0 ||
    capabilityResults.length > 0

  React.useEffect(() => {
    if (!open) {
      setQuery("")
      return
    }

    requestAnimationFrame(() => {
      commandListRef.current?.scrollTo({ top: 0 })
    })
  }, [open])

  React.useEffect(() => {
    commandListRef.current?.scrollTo({ top: 0 })
  }, [deferredQuery])

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Can Agents Use"
      description="Search tools, categories, and agent capabilities."
      className="sm:max-w-2xl"
    >
      <Command loop shouldFilter={false}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search Stripe, scraping, social media, MCP, CLI..."
        />
        <CommandList ref={commandListRef} className="max-h-[520px] scroll-pt-2">
          {!hasResults ? (
            <CommandEmpty>No matching tool or filter found.</CommandEmpty>
          ) : null}
          {isSearching ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Updating results...
            </div>
          ) : null}
          {toolResults.length > 0 ? (
            <CommandGroup heading="Tools">
              {toolResults.map((tool) => (
                <CommandItem
                  key={tool.slug}
                  value={`tool-${tool.slug}`}
                  onSelect={() => onOpenTool(tool)}
                  className="items-start gap-3 py-3"
                >
                  <CommandToolMark tool={tool} />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-medium">{tool.name}</span>
                    <span className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {tool.tagline}
                    </span>
                  </span>
                  <CommandShortcut>{tool.agentScore}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {categoryResults.length > 0 ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="Categories">
                {categoryResults.map((item) => (
                  <CommandItem
                    key={item.slug}
                    value={`category-${item.slug}`}
                    onSelect={() => onChooseCategory(item.slug)}
                  >
                    <FolderDot />
                    {item.name}
                    {item.slug === "all" ? (
                      <CommandShortcut>{tools.length}</CommandShortcut>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}
          {capabilityResults.length > 0 ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="Capabilities">
                {capabilityResults.map((capability) => {
                  const Icon =
                    capabilityIcons[capability.slug as keyof typeof capabilityIcons] ??
                    CircleDashedIcon
                  const active = selectedCapabilities.includes(capability.slug)

                  return (
                    <CommandItem
                      key={capability.slug}
                      value={`capability-${capability.slug}`}
                      onSelect={() => onChooseCapability(capability.slug)}
                      data-checked={active}
                    >
                      <Icon />
                      {capability.name}
                      {active ? <CommandShortcut>On</CommandShortcut> : null}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </>
          ) : null}
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem value="submit-tool" onSelect={onSubmitTool}>
              <ArrowRightIcon />
              Submit a tool
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
})

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-l px-4 py-3 first:border-l-0">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
    </div>
  )
}

function ToolRow({ tool, rank }: { tool: DirectoryListTool; rank: number }) {
  const accessSignals = tool.capabilities
    .filter((capability) => highSignalCapabilitySlugs.includes(capability.slug))
    .slice(0, 4)

  return (
    <div className="grid grid-cols-[48px_minmax(0,1fr)_76px] gap-3 border-b px-3 py-4 last:border-b-0 sm:grid-cols-[56px_minmax(0,1fr)_210px_82px]">
      <div className="pt-1 text-sm tabular-nums text-muted-foreground">{rank}</div>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <ToolMark tool={tool} />
          <Link
            href={`/tools/${tool.slug}`}
            className="truncate text-base font-semibold hover:underline"
          >
            {tool.name}
          </Link>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          {tool.shortDescription}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{tool.categories.map((item) => item.name).join(", ")}</span>
          <span>{tool.pricingSummary}</span>
        </div>
      </div>
      <div className="hidden flex-col gap-2 sm:flex">
        <div className="flex flex-wrap gap-1.5">
          {accessSignals.map((capability) => (
            <CapabilitySignal key={capability.slug} capability={capability} />
          ))}
        </div>
        <span className="line-clamp-2 text-xs leading-5 text-muted-foreground">
          {tool.scoreSummary}
        </span>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <div className="text-xl font-semibold tabular-nums">{tool.agentScore}</div>
        <div className="max-w-20 text-right text-[11px] leading-4 text-muted-foreground">
          {tool.agentTier}
        </div>
        <Button asChild variant="ghost" size="icon" className="size-8">
          <a href={tool.websiteUrl} target="_blank" rel="noreferrer">
            <span className="sr-only">Open {tool.name}</span>
            <ExternalLinkIcon className="size-4" aria-hidden="true" />
          </a>
        </Button>
      </div>
    </div>
  )
}

function TokenDemoToolRow({ tool }: { tool: DirectoryListTool }) {
  const accessSignals = tool.capabilities
    .filter((capability) => highSignalCapabilitySlugs.includes(capability.slug))
    .slice(0, 3)

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_64px] gap-3 border-b px-3 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_72px]">
      <div className="flex min-w-0 items-center gap-2">
        <ToolMark tool={tool} />
        <div className="min-w-0">
          <Link
            href={`/tools/${tool.slug}`}
            className="truncate text-sm font-semibold hover:underline"
          >
            {tool.name}
          </Link>
          <div className="truncate text-xs text-muted-foreground">
            {tool.pricingSummary}
          </div>
        </div>
      </div>
      <div className="hidden flex-wrap items-center gap-1.5 sm:flex">
        {accessSignals.map((capability) => (
          <Badge key={capability.slug} variant="outline" className="rounded-sm">
            {capability.name}
          </Badge>
        ))}
      </div>
      <div className="text-right text-base font-semibold tabular-nums">
        {tool.agentScore}
      </div>
    </div>
  )
}

function toolSearchValue(tool: DirectoryListTool) {
  return [
    tool.name,
    tool.slug,
    tool.tagline,
    tool.shortDescription,
    tool.pricingSummary,
    tool.authModel,
    tool.accountCreation,
    tool.agentTier,
    tool.scoreSummary,
    ...tool.categories.map((item) => item.name),
    ...tool.capabilities.map((item) => item.name),
  ].join(" ")
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function rankSearchText(
  searchText: string,
  label: string,
  terms: string[],
  normalizedQuery: string
) {
  if (terms.length === 0) return 1
  if (!terms.every((term) => searchText.includes(term))) return 0

  const normalizedLabel = normalizeSearchText(label)
  let rank = 10

  if (normalizedLabel === normalizedQuery) rank += 100
  if (normalizedLabel.startsWith(normalizedQuery)) rank += 60
  if (searchText.startsWith(normalizedQuery)) rank += 35

  rank += terms.reduce((score, term) => {
    const index = searchText.indexOf(term)
    return score + Math.max(0, 20 - Math.min(index, 20))
  }, 0)

  return rank
}

function WeightRow({
  description,
  label,
  value,
}: {
  description: string
  label: string
  value: number
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium">{label}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {value} pts
        </span>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  )
}

function ToolMark({ tool }: { tool: DirectoryListTool }) {
  return <ToolLogo tool={tool} />
}

function CommandToolMark({ tool }: { tool: DirectoryListTool }) {
  const initials = tool.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted text-[11px] font-semibold text-muted-foreground"
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

function CapabilitySignal({
  capability,
}: {
  capability: DirectoryListTool["capabilities"][number]
}) {
  const Icon =
    capabilityIcons[capability.slug as keyof typeof capabilityIcons] ??
    CheckCircle2Icon

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 rounded-sm border bg-background px-1.5 py-0.5 text-xs font-medium">
          <Icon className="size-3" aria-hidden="true" />
          {capability.name}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-medium capitalize">{capability.supportLevel}</p>
        <p>{capability.name} support is available for agent discovery.</p>
      </TooltipContent>
    </Tooltip>
  )
}

function FolderDot() {
  return (
    <span className="flex size-4 items-center justify-center rounded-sm border" aria-hidden="true">
      <span className="size-1.5 rounded-full bg-primary" />
    </span>
  )
}
