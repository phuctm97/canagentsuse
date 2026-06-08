import { tools } from "../src/lib/catalog-data"

const generatedBy = "Generated from Awesome Selfhosted data"
const checkAll = process.argv.includes("--all")
const concurrency = 8
const timeoutMs = 12_000

type EvidenceLink = {
  slug: string
  name: string
  capability: string
  url: string
}

type LinkResult = EvidenceLink & {
  status: number | null
  finalUrl: string | null
  ok: boolean
  error?: string
}

let cursor = 0
const results: LinkResult[] = []

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

async function main() {
  const evidenceLinks = tools.flatMap((tool) => {
    if (!checkAll && tool.submittedBy === generatedBy) {
      return []
    }

    return tool.capabilities.flatMap((capability) => {
      if (!capability.evidenceUrl?.startsWith("http")) {
        return []
      }

      return [
        {
          slug: tool.slug,
          name: tool.name,
          capability: capability.slug,
          url: capability.evidenceUrl,
        },
      ]
    })
  })

  const uniqueEvidenceLinks = [
    ...new Map(evidenceLinks.map((link) => [link.url, link])).values(),
  ]

  await Promise.all(Array.from({ length: concurrency }, () =>
    checkWorker(uniqueEvidenceLinks)
  ))

  const blocked = results
    .filter((result) => [401, 403, 429].includes(result.status ?? 0))
    .sort(sortResults)
  const broken = results
    .filter(
      (result) =>
        !result.ok &&
        ![401, 403, 429].includes(result.status ?? 0)
    )
    .sort(sortResults)

  console.log(
    JSON.stringify(
      {
        scope: checkAll ? "all tools" : "curated tools",
        uniqueEvidenceLinks: uniqueEvidenceLinks.length,
        checkedLinks: results.length,
        brokenLinks: broken.length,
        protectedLinks: blocked.length,
      },
      null,
      2
    )
  )

  if (blocked.length > 0) {
    console.warn("\nProtected or rate-limited official pages:")
    for (const result of blocked) {
      console.warn(
        `- ${result.slug}/${result.capability}: ${result.status} ${result.url}`
      )
    }
  }

  if (broken.length > 0) {
    console.error("\nBroken evidence links:")
    for (const result of broken) {
      console.error(
        `- ${result.slug}/${result.capability}: ${result.status ?? result.error} ${result.url}`
      )
    }

    process.exit(1)
  }

  console.log("\nEvidence link check passed.")
}

async function checkWorker(uniqueEvidenceLinks: EvidenceLink[]) {
  while (cursor < uniqueEvidenceLinks.length) {
    const link = uniqueEvidenceLinks[cursor++]
    results.push(await checkLink(link))
    await sleep(50)
  }
}

async function checkLink(link: EvidenceLink): Promise<LinkResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    let response = await fetch(link.url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 CanAgentsUseBot/1.0",
      },
    })

    if ([403, 405, 406, 429].includes(response.status)) {
      response = await fetch(link.url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": "Mozilla/5.0 CanAgentsUseBot/1.0",
        },
      })
    }

    clearTimeout(timer)

    return {
      ...link,
      status: response.status,
      finalUrl: response.url,
      ok: response.status >= 200 && response.status < 400,
    }
  } catch (error) {
    clearTimeout(timer)

    return {
      ...link,
      status: null,
      finalUrl: null,
      ok: false,
      error: error instanceof Error ? error.name : "UnknownError",
    }
  }
}

function sortResults(left: LinkResult, right: LinkResult) {
  return (
    String(left.status).localeCompare(String(right.status)) ||
    left.slug.localeCompare(right.slug) ||
    left.capability.localeCompare(right.capability)
  )
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
