import { cache } from "react"

import {
  type CatalogTool,
  capabilities as catalogCapabilities,
  categories as catalogCategories,
  tools as catalogTools,
  useCases as catalogUseCases,
} from "@/lib/catalog-data"
import {
  scoreAgentFriendliness,
  type AgentScoreBreakdown,
} from "@/lib/agent-scoring"
import {
  scoreLaunchPresence,
  type LaunchScoreBreakdown,
  type LaunchSignals,
} from "@/lib/launch-scoring"

export type DirectoryCapability = {
  slug: string
  name: string
  group: string
  description: string
  sortOrder: number
}

export type DirectoryCategory = {
  slug: string
  name: string
  description: string
  sortOrder: number
}

export type DirectoryUseCase = {
  slug: string
  name: string
  description: string
}

export type DirectoryTool = {
  slug: string
  name: string
  tagline: string
  websiteUrl: string
  docsUrl?: string | null
  githubUrl?: string | null
  logoPath?: string | null
  shortDescription: string
  agentSummary: string
  bestFor: string
  cautionNotes?: string | null
  pricingSummary: string
  authModel: string
  accountCreation: string
  browserSupport: string
  cliPackage?: string | null
  apiBaseUrl?: string | null
  mcpServer?: string | null
  agentScore: number
  agentTier: string
  scoreBreakdown: AgentScoreBreakdown
  launchSignals: LaunchSignals
  launchScore: number
  launchScoreBreakdown: LaunchScoreBreakdown
  isFeatured: boolean
  categories: DirectoryCategory[]
  useCases: DirectoryUseCase[]
  capabilities: {
    slug: string
    name: string
    group: string
    supportLevel: string
    detail: string
    evidenceUrl?: string | null
  }[]
}

export type DirectoryData = {
  tools: DirectoryTool[]
  categories: DirectoryCategory[]
  capabilities: DirectoryCapability[]
  useCases: DirectoryUseCase[]
  isFallback: boolean
}

export type DirectoryListTool = {
  slug: string
  name: string
  tagline: string
  websiteUrl: string
  docsUrl?: string | null
  githubUrl?: string | null
  logoPath?: string | null
  shortDescription: string
  pricingSummary: string
  authModel: string
  accountCreation: string
  agentScore: number
  agentTier: string
  scoreSummary: string
  categories: Pick<DirectoryCategory, "slug" | "name">[]
  capabilities: {
    slug: string
    name: string
    supportLevel: string
  }[]
}

export type DirectoryListData = {
  tools: DirectoryListTool[]
  categories: DirectoryCategory[]
  capabilities: DirectoryCapability[]
  isFallback: boolean
}

const categoryBySlug = new Map(
  catalogCategories.map((category) => [category.slug, category])
)
const capabilityBySlug = new Map(
  catalogCapabilities.map((capability) => [capability.slug, capability])
)
const useCaseBySlug = new Map(
  catalogUseCases.map((useCase) => [useCase.slug, useCase])
)
const toolBySlug = new Map(catalogTools.map((tool) => [tool.slug, tool]))
const sortedCategories = [...catalogCategories].sort(
  (left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)
)
const sortedCapabilities = [...catalogCapabilities].sort(
  (left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)
)
const sortedUseCases = [...catalogUseCases].sort((left, right) =>
  left.name.localeCompare(right.name)
)

export const getDirectoryData = cache(async (): Promise<DirectoryData> => {
  const tools = catalogTools.map(toDirectoryTool)

  return {
    tools: sortTools(tools),
    categories: sortedCategories,
    capabilities: sortedCapabilities,
    useCases: sortedUseCases,
    isFallback: false,
  }
})

export async function getDirectoryListData(): Promise<DirectoryListData> {
  const data = await getDirectoryData()

  return {
    tools: data.tools.map(toDirectoryListTool),
    categories: data.categories,
    capabilities: data.capabilities,
    isFallback: data.isFallback,
  }
}

export const getToolBySlug = cache(async (slug: string) => {
  const tool = toolBySlug.get(slug)

  return tool ? toDirectoryTool(tool) : null
})

function toDirectoryTool(tool: CatalogTool): DirectoryTool {
  return withAgentScore({
    ...tool,
    docsUrl: tool.docsUrl ?? null,
    githubUrl: tool.githubUrl ?? null,
    logoPath: tool.logoPath ?? null,
    cautionNotes: tool.cautionNotes ?? null,
    cliPackage: tool.cliPackage ?? null,
    apiBaseUrl: tool.apiBaseUrl ?? null,
    mcpServer: tool.mcpServer ?? null,
    isFeatured: Boolean(tool.isFeatured),
    categories: tool.categorySlugs
      .map((slug) => categoryBySlug.get(slug))
      .filter((category): category is DirectoryCategory => Boolean(category)),
    useCases: tool.useCaseSlugs
      .map((slug) => useCaseBySlug.get(slug))
      .filter((useCase): useCase is DirectoryUseCase => Boolean(useCase)),
    capabilities: tool.capabilities
      .map((capability) => {
        const capabilityMeta = capabilityBySlug.get(capability.slug)

        return {
          slug: capability.slug,
          name: capabilityMeta?.name ?? capability.slug,
          group: capabilityMeta?.group ?? "Agent access",
          supportLevel: capability.supportLevel,
          detail: capability.detail,
          evidenceUrl: capability.evidenceUrl ?? null,
        }
      })
      .sort((left, right) => {
        const leftOrder = capabilityBySlug.get(left.slug)?.sortOrder ?? 0
        const rightOrder = capabilityBySlug.get(right.slug)?.sortOrder ?? 0

        return leftOrder - rightOrder
      }),
  })
}

function toDirectoryListTool(tool: DirectoryTool): DirectoryListTool {
  return {
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    websiteUrl: tool.websiteUrl,
    docsUrl: tool.docsUrl,
    githubUrl: tool.githubUrl,
    logoPath: tool.logoPath,
    shortDescription: tool.shortDescription,
    pricingSummary: tool.pricingSummary,
    authModel: tool.authModel,
    accountCreation: tool.accountCreation,
    agentScore: tool.agentScore,
    agentTier: tool.agentTier,
    scoreSummary: tool.scoreBreakdown.summary,
    categories: tool.categories.map((category) => ({
      slug: category.slug,
      name: category.name,
    })),
    capabilities: tool.capabilities.map((capability) => ({
      slug: capability.slug,
      name: capability.name,
      supportLevel: capability.supportLevel,
    })),
  }
}

function withAgentScore(
  tool: Omit<
    DirectoryTool,
    "agentScore" | "agentTier" | "scoreBreakdown" | "launchScore" | "launchScoreBreakdown"
  >
) {
  const scoreBreakdown = scoreAgentFriendliness(tool)
  const launchScoreBreakdown = scoreLaunchPresence(tool)

  return {
    ...tool,
    agentScore: scoreBreakdown.score,
    agentTier: scoreBreakdown.tier,
    scoreBreakdown,
    launchScore: launchScoreBreakdown.score,
    launchScoreBreakdown,
  }
}

function sortTools(tools: DirectoryTool[]) {
  return [...tools].sort(
    (left, right) =>
      right.agentScore - left.agentScore ||
      Number(right.isFeatured) - Number(left.isFeatured) ||
      right.launchScore - left.launchScore ||
      left.name.localeCompare(right.name)
  )
}
