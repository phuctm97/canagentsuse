export type LaunchAdoptionTier =
  | "category-leader"
  | "major-platform"
  | "established-platform"
  | "established-product"
  | "growing-product"
  | "niche-tool"
  | "early-tool"

export type LaunchEcosystemImportance =
  | "core-platform"
  | "business-critical"
  | "developer-tooling"
  | "specialized"
  | "niche"
  | "unknown"

export type LaunchMaturity = "active" | "maintained" | "unknown"
export type LaunchDistribution = "auto" | "none"

export type LaunchSignals = {
  adoptionTier?: LaunchAdoptionTier
  ecosystemImportance?: LaunchEcosystemImportance
  githubStars?: number | null
  packageDownloadsMonthly?: number | null
  maturity?: LaunchMaturity
  distribution?: LaunchDistribution
  evidenceUrl?: string | null
}

export type LaunchScoreSignal = {
  key: string
  label: string
  score: number
  maxScore: number
  detail: string
}

export type LaunchScoreBreakdown = {
  score: number
  summary: string
  signals: LaunchScoreSignal[]
}

type LaunchScoreInput = {
  name: string
  docsUrl?: string | null
  githubUrl?: string | null
  cliPackage?: string | null
  apiBaseUrl?: string | null
  mcpServer?: string | null
  launchSignals: LaunchSignals
  capabilities: {
    slug: string
    supportLevel: string
  }[]
}

const baseLaunchScore = 120
const maxLaunchScore = 950

const adoptionTierScores: Record<LaunchAdoptionTier, number> = {
  "category-leader": 520,
  "major-platform": 420,
  "established-platform": 300,
  "established-product": 180,
  "growing-product": 90,
  "niche-tool": 20,
  "early-tool": 0,
}

const ecosystemScores: Record<LaunchEcosystemImportance, number> = {
  "core-platform": 150,
  "business-critical": 110,
  "developer-tooling": 80,
  specialized: 40,
  niche: 10,
  unknown: 0,
}

const maturityScores: Record<LaunchMaturity, number> = {
  active: 20,
  maintained: 10,
  unknown: 0,
}

export const launchScoreModel = {
  maxScore: maxLaunchScore,
  baseScore: baseLaunchScore,
  groups: [
    {
      key: "public-adoption",
      label: "Public adoption",
      maxScore: 600,
      signals: [
        "GitHub stars use floor(stars / 150), capped at 600.",
        "Monthly package downloads use a logarithmic scale, capped at 300.",
        "Adoption tier can stand in when public metrics are unavailable.",
      ],
    },
    {
      key: "ecosystem-importance",
      label: "Ecosystem importance",
      maxScore: 150,
      signals: [
        "Core platforms, business-critical systems, developer tooling, specialized products, and niche tools receive decreasing weights.",
      ],
    },
    {
      key: "distribution",
      label: "Distribution maturity",
      maxScore: 70,
      signals: [
        "Official API, CLI, MCP, docs, and browser-operable fallback signals are counted from the catalog record.",
      ],
    },
    {
      key: "maintenance",
      label: "Maintenance signal",
      maxScore: 20,
      signals: ["Active or maintained tools get a small freshness bump."],
    },
  ],
}

export function scoreLaunchPresence(tool: LaunchScoreInput): LaunchScoreBreakdown {
  const signals = [
    scorePublicAdoption(tool.launchSignals),
    scoreEcosystemImportance(tool.launchSignals),
    scoreDistribution(tool),
    scoreMaintenance(tool.launchSignals),
  ]
  const score = Math.min(
    maxLaunchScore,
    baseLaunchScore + signals.reduce((total, signal) => total + signal.score, 0)
  )

  return {
    score,
    summary: `${tool.name} launch presence: ${score}/${maxLaunchScore}. ${signals
      .map((signal) => `${signal.label.toLowerCase()} ${signal.score}/${signal.maxScore}`)
      .join("; ")}.`,
    signals,
  }
}

function scorePublicAdoption(signals: LaunchSignals): LaunchScoreSignal {
  const tier = signals.adoptionTier ?? "early-tool"
  const tierScore = adoptionTierScores[tier]
  const githubScore =
    typeof signals.githubStars === "number"
      ? Math.min(600, Math.floor(Math.max(0, signals.githubStars) / 150))
      : 0
  const packageScore =
    typeof signals.packageDownloadsMonthly === "number"
      ? Math.min(300, Math.floor(Math.log10(Math.max(1, signals.packageDownloadsMonthly)) * 60))
      : 0
  const score = Math.max(tierScore, githubScore, packageScore)

  return {
    key: "public-adoption",
    label: "Public adoption",
    score,
    maxScore: 600,
    detail: [
      `tier=${tier}`,
      typeof signals.githubStars === "number" ? `githubStars=${signals.githubStars}` : null,
      typeof signals.packageDownloadsMonthly === "number"
        ? `packageDownloadsMonthly=${signals.packageDownloadsMonthly}`
        : null,
    ]
      .filter(Boolean)
      .join(", "),
  }
}

function scoreEcosystemImportance(signals: LaunchSignals): LaunchScoreSignal {
  const importance = signals.ecosystemImportance ?? "unknown"

  return {
    key: "ecosystem-importance",
    label: "Ecosystem importance",
    score: ecosystemScores[importance],
    maxScore: 150,
    detail: `importance=${importance}`,
  }
}

function scoreDistribution(tool: LaunchScoreInput): LaunchScoreSignal {
  if (tool.launchSignals.distribution === "none") {
    return {
      key: "distribution",
      label: "Distribution maturity",
      score: 0,
      maxScore: 70,
      detail: "distribution=none",
    }
  }

  const hasCapability = (slug: string, supportLevels = ["native", "strong", "partial"]) =>
    tool.capabilities.some(
      (capability) =>
        capability.slug === slug && supportLevels.includes(capability.supportLevel)
    )
  const parts = [
    tool.apiBaseUrl || hasCapability("api") ? 25 : 0,
    tool.cliPackage || hasCapability("cli") ? 15 : 0,
    tool.mcpServer || hasCapability("mcp") ? 15 : 0,
    tool.docsUrl ? 10 : 0,
    hasCapability("browser", ["native", "strong"]) ? 5 : 0,
  ]
  const score = parts.reduce((total, part) => total + part, 0)

  return {
    key: "distribution",
    label: "Distribution maturity",
    score,
    maxScore: 70,
    detail: "api/cli/mcp/docs/browser signals from catalog evidence",
  }
}

function scoreMaintenance(signals: LaunchSignals): LaunchScoreSignal {
  const maturity = signals.maturity ?? "unknown"

  return {
    key: "maintenance",
    label: "Maintenance signal",
    score: maturityScores[maturity],
    maxScore: 20,
    detail: `maturity=${maturity}`,
  }
}
