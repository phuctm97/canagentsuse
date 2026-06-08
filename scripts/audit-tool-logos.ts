import { existsSync } from "node:fs"
import path from "node:path"

import { tools } from "../src/lib/catalog-data"
import {
  getKnownSimpleIconSlugs,
  getToolLogoAuditUrl,
  getToolLogoUrl,
} from "../src/lib/tool-logos"

const imageFetchTimeoutMs = 15_000
const batchSize = 25

const failures: string[] = []
const samples: Record<string, string | null> = {}

let simpleIcons = 0
let googleFavicons = 0
let localFallbacks = 0
let githubAvatarUrls = 0
let missingStaticSimpleIcons = 0

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

async function main() {
  for (const slug of [
    "aws",
    "github",
    "microsoft-azure",
    "nextcloud",
    "openai",
    "pictshare",
    "salesforce",
    "stirling-pdf",
    "stripe",
    "twilio",
  ]) {
    const tool = tools.find((item) => item.slug === slug)
    samples[slug] = tool
      ? `${getToolLogoUrl(tool) ?? "fallback"} -> ${getToolLogoAuditUrl(tool) ?? "fallback"}`
      : null
  }

  for (let index = 0; index < tools.length; index += batchSize) {
    await Promise.all(tools.slice(index, index + batchSize).map(checkToolLogo))
  }

  for (const slug of getKnownSimpleIconSlugs()) {
    const filePath = path.join(process.cwd(), "public", "logos", "simple-icons", `${slug}.svg`)

    if (!existsSync(filePath)) {
      missingStaticSimpleIcons += 1
      failures.push(`missing static Simple Icon asset: ${filePath}`)
    }
  }

  console.log(
    JSON.stringify(
      {
        tools: tools.length,
        sources: {
          simpleIcons,
          googleFavicons,
          localFallbacks,
          githubAvatarUrls,
          missingStaticSimpleIcons,
        },
        remoteLogos: simpleIcons + googleFavicons,
        failures: failures.length,
        samples,
      },
      null,
      2
    )
  )

  if (failures.length > 0) {
    console.error("\nLogo failures:")
    for (const failure of failures.slice(0, 120)) {
      console.error(`- ${failure}`)
    }

    if (failures.length > 120) {
      console.error(`- ... ${failures.length - 120} more failures`)
    }
  }

  if (failures.length > 0 || githubAvatarUrls > 0 || missingStaticSimpleIcons > 0) {
    process.exit(1)
  }

  console.log("\nTool logo audit passed.")
}

async function checkToolLogo(tool: (typeof tools)[number]) {
  const url = getToolLogoAuditUrl(tool)

  if (!url) {
    localFallbacks += 1
    return
  }

  if (url.includes("cdn.simpleicons.org")) {
    simpleIcons += 1
  }

  if (url.includes("google.com/s2/favicons")) {
    googleFavicons += 1
  }

  if (url.includes("avatars.githubusercontent.com") || /github\.com\/.+\.png/.test(url)) {
    githubAvatarUrls += 1
    failures.push(`${tool.slug}: GitHub avatar URLs are not accepted as app logos: ${url}`)
    return
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), imageFetchTimeoutMs)

  try {
    const response = await fetch(url, { signal: controller.signal })
    const contentType = response.headers.get("content-type") ?? ""

    if (!response.ok || !contentType.startsWith("image/")) {
      failures.push(`${tool.slug}: ${response.status} ${contentType} ${url}`)
      return
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    if (buffer.byteLength < 100) {
      failures.push(`${tool.slug}: tiny image ${buffer.byteLength} bytes ${url}`)
    }
  } catch (error) {
    failures.push(
      `${tool.slug}: ${
        error instanceof Error ? error.message : String(error)
      } ${url}`
    )
  } finally {
    clearTimeout(timeoutId)
  }
}
