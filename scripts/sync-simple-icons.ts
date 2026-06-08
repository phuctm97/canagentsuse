import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import {
  getKnownSimpleIconSlugs,
  getSimpleIconSourceUrl,
} from "../src/lib/tool-logos"

const iconFetchTimeoutMs = 15_000
const iconFetchRetries = 1
const outputDir = path.join(process.cwd(), "public", "logos", "simple-icons")

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

async function main() {
  await mkdir(outputDir, { recursive: true })

  const slugs = getKnownSimpleIconSlugs()
  const failures: string[] = []

  for (const slug of slugs) {
    const icon = await fetchIcon(slug)

    if (!icon) {
      failures.push(slug)
      continue
    }

    await writeFile(path.join(outputDir, `${slug}.svg`), icon)
  }

  console.log(
    JSON.stringify(
      {
        simpleIcons: slugs.length,
        written: slugs.length - failures.length,
        failures,
      },
      null,
      2
    )
  )

  if (failures.length > 0) {
    process.exit(1)
  }
}

async function fetchIcon(slug: string) {
  for (let attempt = 0; attempt <= iconFetchRetries; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), iconFetchTimeoutMs)

    try {
      const response = await fetch(getSimpleIconSourceUrl(slug), {
        signal: controller.signal,
      })
      const contentType = response.headers.get("content-type") ?? ""

      if (response.ok && contentType.startsWith("image/")) {
        return Buffer.from(await response.arrayBuffer())
      }
    } catch {
      if (attempt >= iconFetchRetries) {
        return null
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  return null
}
