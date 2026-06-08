import catalog from "../../data/catalog.json"

export type CatalogCategory = {
  slug: string
  name: string
  description: string
  sortOrder: number
}

export type CatalogCapability = {
  slug: string
  name: string
  group: string
  description: string
  sortOrder: number
}

export type CatalogUseCase = {
  slug: string
  name: string
  description: string
}

export type CatalogTool = {
  slug: string
  name: string
  tagline: string
  websiteUrl: string
  docsUrl?: string | null
  githubUrl?: string | null
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
  launchScore: number
  isFeatured?: boolean
  submittedBy?: string
  categorySlugs: string[]
  useCaseSlugs: string[]
  capabilities: {
    slug: string
    supportLevel: "native" | "strong" | "partial" | "manual" | "unknown"
    detail: string
    evidenceUrl?: string | null
  }[]
}

type CatalogFile = {
  generatedAt: string
  source: string
  categories: CatalogCategory[]
  capabilities: CatalogCapability[]
  useCases: CatalogUseCase[]
  tools: CatalogTool[]
}

const catalogData = catalog as CatalogFile

export const catalogGeneratedAt = catalogData.generatedAt
export const catalogSource = catalogData.source
export const categories = catalogData.categories
export const capabilities = catalogData.capabilities
export const useCases = catalogData.useCases
export const tools = catalogData.tools

export function getCatalogStats() {
  return {
    tools: tools.length,
    categories: categories.length,
    capabilities: capabilities.length,
    featured: tools.filter((tool) => tool.isFeatured).length,
  }
}
