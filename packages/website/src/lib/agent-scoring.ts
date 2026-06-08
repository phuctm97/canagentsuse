export type AgentScoreGroupKey =
  | "operability"
  | "safety"
  | "readability"
  | "setup"
  | "reliability"

export type AgentScoreSignal = {
  slug: string
  label: string
  weight: number
  score: number
  maxScore: number
  supportLevel: string
  evidence: string
}

export type AgentScoreGroup = {
  key: AgentScoreGroupKey
  label: string
  weight: number
  score: number
  maxScore: number
  signals: AgentScoreSignal[]
}

export type AgentScoreBreakdown = {
  score: number
  tier: string
  summary: string
  groups: AgentScoreGroup[]
}

type ScoreInput = Pick<
  {
    authModel: string
    accountCreation: string
    browserSupport: string
    pricingSummary: string
    agentSummary: string
    bestFor: string
    cautionNotes?: string | null
    cliPackage?: string | null
    apiBaseUrl?: string | null
    mcpServer?: string | null
    docsUrl?: string | null
    capabilities: {
      slug: string
      supportLevel: string
      detail: string
      evidenceUrl?: string | null
    }[]
  },
  | "authModel"
  | "accountCreation"
  | "browserSupport"
  | "pricingSummary"
  | "agentSummary"
  | "bestFor"
  | "cautionNotes"
  | "cliPackage"
  | "apiBaseUrl"
  | "mcpServer"
  | "docsUrl"
  | "capabilities"
>

const supportScores: Record<string, number> = {
  native: 1,
  strong: 0.8,
  partial: 0.5,
  manual: 0.25,
  unknown: 0,
}

const scoreModel = [
  {
    key: "operability",
    label: "Machine operability",
    weight: 25,
    signals: [
      { slug: "api", label: "API", weight: 10 },
      { slug: "mcp", label: "MCP", weight: 4 },
      { slug: "cli", label: "CLI", weight: 6 },
      { slug: "browser", label: "Browser fallback", weight: 5 },
    ],
  },
  {
    key: "safety",
    label: "Agent safety",
    weight: 25,
    signals: [
      { slug: "sandbox", label: "Sandbox or test mode", weight: 10 },
      { slug: "scoped-auth", label: "Scoped auth", weight: 6 },
      { slug: "dry-run-preview", label: "Dry-run or preview", weight: 4 },
      { slug: "human-review", label: "Human review guidance", weight: 3 },
      { slug: "idempotency", label: "Idempotency or retry safety", weight: 2 },
    ],
  },
  {
    key: "readability",
    label: "Agent readability",
    weight: 20,
    signals: [
      { slug: "docs-quality", label: "Docs quality", weight: 8 },
      { slug: "pricing-clarity", label: "Pricing clarity", weight: 5 },
      { slug: "evidence-depth", label: "Evidence links", weight: 4 },
      { slug: "docs-url", label: "Dedicated docs URL", weight: 3 },
    ],
  },
  {
    key: "setup",
    label: "Auth and setup",
    weight: 15,
    signals: [
      { slug: "account-creation", label: "Account setup", weight: 7 },
      { slug: "auth-clarity", label: "Auth model clarity", weight: 5 },
      { slug: "self-serve", label: "Self-serve onboarding", weight: 3 },
    ],
  },
  {
    key: "reliability",
    label: "Production reliability",
    weight: 15,
    signals: [
      { slug: "webhook-events", label: "Webhooks or events", weight: 5 },
      { slug: "logs-audit", label: "Logs or audit trail", weight: 4 },
      { slug: "versioned-api", label: "Versioned API", weight: 3 },
      { slug: "rate-limit-clarity", label: "Rate limit clarity", weight: 3 },
    ],
  },
] as const

export const agentScoreWeights = scoreModel.map(({ key, label, weight, signals }) => ({
  key,
  label,
  weight,
  signals,
}))

export function scoreAgentFriendliness(tool: ScoreInput): AgentScoreBreakdown {
  const groups = scoreModel.map((group) => {
    const signals = group.signals.map((signal) =>
      scoreSignal(tool, signal.slug, signal.label, signal.weight)
    )
    const score = round(signals.reduce((total, signal) => total + signal.score, 0))

    return {
      key: group.key,
      label: group.label,
      weight: group.weight,
      score,
      maxScore: group.weight,
      signals,
    }
  })
  const score = Math.min(100, Math.round(groups.reduce((total, group) => total + group.score, 0)))
  const tier = agentTier(score, tool)

  return {
    score,
    tier,
    summary: scoreSummary(score, tier, groups),
    groups,
  }
}

function scoreSignal(
  tool: ScoreInput,
  slug: string,
  label: string,
  weight: number
): AgentScoreSignal {
  const capability = tool.capabilities.find((item) => item.slug === slug)
  const inferred = capability
    ? {
        supportLevel: capability.supportLevel,
        ratio: supportScores[capability.supportLevel] ?? 0,
        evidence: capability.detail,
      }
    : inferSignal(tool, slug)

  return {
    slug,
    label,
    weight,
    score: round(weight * inferred.ratio),
    maxScore: weight,
    supportLevel: inferred.supportLevel,
    evidence: inferred.evidence,
  }
}

function inferSignal(tool: ScoreInput, slug: string) {
  const haystack = [
    tool.authModel,
    tool.accountCreation,
    tool.browserSupport,
    tool.pricingSummary,
    tool.agentSummary,
    tool.bestFor,
    tool.cautionNotes,
    tool.cliPackage,
    tool.apiBaseUrl,
    tool.mcpServer,
    tool.docsUrl,
    ...tool.capabilities.flatMap((item) => [item.detail, item.evidenceUrl]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  switch (slug) {
    case "api":
      return tool.apiBaseUrl
        ? { supportLevel: "strong", ratio: 0.8, evidence: "API base URL is listed." }
        : { supportLevel: "unknown", ratio: 0, evidence: "No API evidence listed." }
    case "mcp":
      return tool.mcpServer
        ? { supportLevel: "native", ratio: 1, evidence: "MCP server is listed." }
        : { supportLevel: "unknown", ratio: 0, evidence: "No MCP server evidence listed." }
    case "cli":
      return tool.cliPackage
        ? { supportLevel: "strong", ratio: 0.8, evidence: "CLI package is listed." }
        : { supportLevel: "unknown", ratio: 0, evidence: "No CLI evidence listed." }
    case "browser":
      return tool.browserSupport.length > 24
        ? { supportLevel: "strong", ratio: 0.8, evidence: tool.browserSupport }
        : { supportLevel: "partial", ratio: 0.5, evidence: tool.browserSupport }
    case "account-creation":
      return keywordSignal(
        haystack,
        ["self-serve", "self serve", "signup", "sign up", "trial", "free", "verification"],
        tool.accountCreation
      )
    case "pricing-clarity":
      return tool.pricingSummary.length > 24
        ? { supportLevel: "strong", ratio: 0.8, evidence: tool.pricingSummary }
        : { supportLevel: "partial", ratio: 0.5, evidence: tool.pricingSummary }
    case "docs-quality":
      return tool.docsUrl
        ? { supportLevel: "strong", ratio: 0.8, evidence: "Dedicated documentation URL is listed." }
        : { supportLevel: "unknown", ratio: 0, evidence: "No dedicated documentation URL listed." }
    case "sandbox":
      return keywordSignal(
        haystack,
        ["sandbox", "test mode", "test", "local", "preview", "branch"],
        "Tool mentions sandbox, test, local, preview, or branching workflows."
      )
    case "scoped-auth":
      return keywordSignal(
        haystack,
        {
          native: ["restricted key", "restricted keys", "fine-grained", "service account", "scoped token", "scoped api"],
          strong: ["restricted", "scoped", "oauth", "permission", "permissions", "service account"],
        },
        "Auth supports scoped or permissioned access."
      )
    case "dry-run-preview":
      return keywordSignal(
        haystack,
        {
          native: ["dry run", "dry-run", "test mode", "test clock", "test clocks", "sandbox", "preview deployment", "branching", "local stack"],
          strong: ["preview", "test", "local", "staging"],
        },
        "Tool exposes preview, test, local, or branching workflows."
      )
    case "human-review":
      return tool.cautionNotes
        ? {
            supportLevel: "strong",
            ratio: 0.8,
            evidence: "Caution notes identify workflows that need human review.",
          }
        : {
            supportLevel: "partial",
            ratio: 0.5,
            evidence: "No explicit caution notes are listed.",
          }
    case "idempotency":
      return keywordSignal(
        haystack,
        {
          native: ["idempotency", "idempotent", "idempotency key", "idempotency keys", "request id", "request ids"],
          strong: ["retry", "retries", "replay"],
        },
        "Docs or summaries mention retry/idempotency safety."
      )
    case "evidence-depth": {
      const evidenceCount = tool.capabilities.filter((item) => item.evidenceUrl).length
      const ratio = evidenceCount >= 3 ? 1 : evidenceCount === 2 ? 0.8 : evidenceCount === 1 ? 0.5 : 0.25

      return {
        supportLevel: evidenceCount >= 3 ? "native" : evidenceCount > 0 ? "partial" : "manual",
        ratio,
        evidence: `${evidenceCount} signal evidence link${evidenceCount === 1 ? "" : "s"} listed.`,
      }
    }
    case "docs-url":
      return tool.docsUrl
        ? { supportLevel: "native", ratio: 1, evidence: "Dedicated documentation URL is listed." }
        : { supportLevel: "unknown", ratio: 0, evidence: "No dedicated documentation URL listed." }
    case "auth-clarity":
      return authModelScore(tool.authModel)
    case "self-serve":
      return keywordSignal(
        haystack,
        {
          native: ["no account", "no vendor signup"],
          strong: ["self-serve", "self serve", "signup", "free", "trial", "sandbox"],
        },
        "Onboarding appears self-serve or testable."
      )
    case "webhook-events":
      return keywordSignal(
        haystack,
        {
          native: ["webhook event", "webhook events", "event destination", "event destinations", "events api"],
          strong: ["webhook", "webhooks", "events", "event", "notifications"],
        },
        "Tool documents webhooks, events, or notification flows."
      )
    case "logs-audit":
      return keywordSignal(
        haystack,
        {
          native: ["request log", "request logs", "audit log", "audit logs", "request id", "request ids"],
          strong: ["log", "logs", "audit", "trace", "traces"],
        },
        "Tool exposes logs, traces, or audit-friendly records."
      )
    case "versioned-api":
      return keywordSignal(
        haystack,
        {
          native: ["versioned api", "api version", "api versioning", "/v1", "/v2", "graphql"],
          strong: ["v1", "v2", "version", "versioned", "rest"],
        },
        "Tool exposes a versioned or stable API surface."
      )
    case "rate-limit-clarity":
      return keywordSignal(
        haystack,
        {
          native: ["rate limit", "rate limits", "rate-limit", "rate limiter", "quota", "quotas"],
          strong: ["usage limit", "usage limits", "limits", "credit", "credits", "usage-based"],
        },
        "Tool documents usage limits, quotas, or credits."
      )
    default:
      return { supportLevel: "unknown", ratio: 0, evidence: "No evidence listed." }
  }
}

function authModelScore(authModel: string) {
  if (authModel.length <= 24) {
    return { supportLevel: "partial", ratio: 0.5, evidence: authModel }
  }

  const nativeSignals = [
    "restricted",
    "fine-grained",
    "oauth",
    "service account",
    "webhook secret",
    "scoped",
  ].filter((keyword) => authModel.toLowerCase().includes(keyword)).length

  return nativeSignals >= 2
    ? { supportLevel: "native", ratio: 1, evidence: authModel }
    : { supportLevel: "strong", ratio: 0.8, evidence: authModel }
}

function keywordSignal(
  haystack: string,
  keywords:
    | string[]
    | {
        native?: string[]
        strong?: string[]
      },
  evidence: string
) {
  if (Array.isArray(keywords)) {
    const matched = keywords.some((keyword) => haystack.includes(keyword))

    return matched
      ? { supportLevel: "strong", ratio: 0.8, evidence }
      : { supportLevel: "unknown", ratio: 0, evidence: "No clear evidence found." }
  }

  const nativeMatched = keywords.native?.some((keyword) =>
    haystack.includes(keyword)
  )
  const strongMatched = keywords.strong?.some((keyword) =>
    haystack.includes(keyword)
  )

  if (nativeMatched) {
    return { supportLevel: "native", ratio: 1, evidence }
  }

  if (strongMatched) {
    return { supportLevel: "strong", ratio: 0.8, evidence }
  }

  return { supportLevel: "unknown", ratio: 0, evidence: "No clear evidence found." }
}

function agentTier(score: number, tool: ScoreInput) {
  const hasMachineInterface = tool.capabilities.some(
    (item) =>
      ["api", "cli", "mcp"].includes(item.slug) &&
      ["native", "strong"].includes(item.supportLevel)
  )

  if (score >= 90 && hasMachineInterface) return "Native agent-ready"
  if (score >= 75) return "Strong"
  if (score >= 55) return "Usable"
  if (score >= 40 && hasMachineInterface) return "Usable with gaps"
  if (score >= 40) return "Browser-assisted"

  return "Not agent-friendly"
}

function scoreSummary(score: number, tier: string, groups: AgentScoreGroup[]) {
  const strongest = [...groups].sort(
    (left, right) => right.score / right.maxScore - left.score / left.maxScore
  )[0]
  const weakest = [...groups].sort(
    (left, right) => left.score / left.maxScore - right.score / right.maxScore
  )[0]

  return `${tier}: ${score}/100. Strongest in ${strongest.label.toLowerCase()}; weakest in ${weakest.label.toLowerCase()}.`
}

function round(value: number) {
  return Math.round(value * 10) / 10
}
