import {
  capabilities,
  categories,
  tools,
  useCases,
  type CatalogTool,
} from "../src/lib/catalog-data"

const supportLevels = new Set(["native", "strong", "partial", "manual", "unknown"])
const generatedBy = "Generated from Awesome Selfhosted data"

const errors: string[] = []
const warnings: string[] = []

const categorySlugs = new Set(categories.map((category) => category.slug))
const capabilitySlugs = new Set(capabilities.map((capability) => capability.slug))
const useCaseSlugs = new Set(useCases.map((useCase) => useCase.slug))

checkUnique("category", categories)
checkUnique("capability", capabilities)
checkUnique("use case", useCases)
checkUnique("tool", tools)

for (const tool of tools) {
  checkUrl(tool, "websiteUrl", tool.websiteUrl, { required: true })
  checkUrl(tool, "docsUrl", tool.docsUrl)
  checkUrl(tool, "githubUrl", tool.githubUrl)
  checkUrl(tool, "apiBaseUrl", tool.apiBaseUrl, { allowTemplate: true })

  for (const slug of tool.categorySlugs) {
    if (!categorySlugs.has(slug)) {
      errors.push(`${tool.slug}: unknown category slug "${slug}"`)
    }
  }

  for (const slug of tool.useCaseSlugs) {
    if (!useCaseSlugs.has(slug)) {
      errors.push(`${tool.slug}: unknown use case slug "${slug}"`)
    }
  }

  const seenCapabilitySlugs = new Set<string>()

  for (const capability of tool.capabilities) {
    if (!capabilitySlugs.has(capability.slug)) {
      errors.push(`${tool.slug}: unknown capability slug "${capability.slug}"`)
    }

    if (seenCapabilitySlugs.has(capability.slug)) {
      errors.push(`${tool.slug}: duplicate capability "${capability.slug}"`)
    }

    seenCapabilitySlugs.add(capability.slug)

    if (!supportLevels.has(capability.supportLevel)) {
      errors.push(
        `${tool.slug}: invalid support level "${capability.supportLevel}" for ${capability.slug}`
      )
    }

    checkUrl(tool, `${capability.slug}.evidenceUrl`, capability.evidenceUrl)

    if (
      tool.submittedBy !== generatedBy &&
      ["native", "strong"].includes(capability.supportLevel) &&
      !capability.evidenceUrl
    ) {
      warnings.push(
        `${tool.slug}: ${capability.slug} is ${capability.supportLevel} but has no evidence URL`
      )
    }
  }

  const hasMcpCapability = tool.capabilities.some(
    (capability) => capability.slug === "mcp"
  )

  if (tool.mcpServer && !hasMcpCapability) {
    errors.push(`${tool.slug}: mcpServer is set but mcp capability is missing`)
  }

  if (hasMcpCapability && !tool.mcpServer) {
    errors.push(`${tool.slug}: mcp capability is set but mcpServer is missing`)
  }

  if (hasMcpCapability) {
    const mcpCapability = tool.capabilities.find(
      (capability) => capability.slug === "mcp"
    )

    if (!mcpCapability?.evidenceUrl) {
      errors.push(`${tool.slug}: mcp capability needs an evidence URL`)
    }
  }

  if (!tool.cautionNotes?.trim()) {
    errors.push(`${tool.slug}: limitation notes are required`)
  }
}

const curatedTools = tools.filter((tool) => tool.submittedBy !== generatedBy)
const generatedTools = tools.filter((tool) => tool.submittedBy === generatedBy)
const mcpTools = tools.filter((tool) =>
  tool.capabilities.some((capability) => capability.slug === "mcp")
)
const nativeMcpTools = mcpTools.filter((tool) =>
  tool.capabilities.some(
    (capability) => capability.slug === "mcp" && capability.supportLevel === "native"
  )
)
const limitationsCoverage = tools.filter((tool) => tool.cautionNotes?.trim()).length
const capabilityCoverage = Object.fromEntries(
  capabilities.map((capability) => [
    capability.slug,
    tools.filter((tool) =>
      tool.capabilities.some((item) => item.slug === capability.slug)
    ).length,
  ])
)

console.log(
  JSON.stringify(
    {
      tools: tools.length,
      curatedTools: curatedTools.length,
      generatedTools: generatedTools.length,
      categories: categories.length,
      useCases: useCases.length,
      capabilities: capabilities.length,
      mcpTools: mcpTools.length,
      nativeMcpTools: nativeMcpTools.length,
      limitationsCoverage,
      capabilityCoverage,
      warnings: warnings.length,
      errors: errors.length,
    },
    null,
    2
  )
)

if (warnings.length > 0) {
  console.warn("\nWarnings:")
  for (const warning of warnings.slice(0, 40)) {
    console.warn(`- ${warning}`)
  }

  if (warnings.length > 40) {
    console.warn(`- ... ${warnings.length - 40} more warnings`)
  }
}

if (errors.length > 0) {
  console.error("\nErrors:")
  for (const error of errors) {
    console.error(`- ${error}`)
  }

  process.exit(1)
}

console.log("\nCatalog metadata audit passed.")

function checkUnique(label: string, items: { slug: string }[]) {
  const seen = new Set<string>()

  for (const item of items) {
    if (seen.has(item.slug)) {
      errors.push(`duplicate ${label} slug "${item.slug}"`)
    }

    seen.add(item.slug)
  }
}

function checkUrl(
  tool: CatalogTool,
  field: string,
  value: string | null | undefined,
  options: { required?: boolean; allowTemplate?: boolean } = {}
) {
  if (!value) {
    if (options.required) {
      errors.push(`${tool.slug}: ${field} is required`)
    }

    return
  }

  if (options.allowTemplate && value.includes("{")) {
    return
  }

  if (value.startsWith("npx ") || value.startsWith("uvx ")) {
    return
  }

  try {
    const url = new URL(value)

    if (!["http:", "https:"].includes(url.protocol)) {
      errors.push(`${tool.slug}: ${field} must use http(s), got "${value}"`)
    }
  } catch {
    errors.push(`${tool.slug}: ${field} is not a valid URL or supported command`)
  }
}
