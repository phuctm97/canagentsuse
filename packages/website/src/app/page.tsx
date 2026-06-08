import type { Metadata } from "next"

import { ToolDirectory } from "@/components/tool-directory"
import { getDirectoryListData } from "@/lib/directory"
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/site"

export const metadata: Metadata = {
  title: `${SITE_NAME} - ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
  },
}

export default async function Home() {
  const data = await getDirectoryListData()
  const topTools = data.tools.slice(0, 12)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/brand/icon-512.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        inLanguage: "en",
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/api/agent/search?q={search_term_string}&page=1&limit=10`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "DataCatalog",
        "@id": `${SITE_URL}/#agent-tool-catalog`,
        name: `${SITE_NAME} Agent Tool Catalog`,
        url: `${SITE_URL}/api/agent/catalog`,
        description:
          "Read-only catalog of agent-friendly tools with API, CLI, MCP, browser, pricing, documentation, sandbox, account setup, and safety signals.",
        keywords: SITE_KEYWORDS,
        measurementTechnique:
          "100-point agent-friendliness scoring across machine operability, safety, readability, setup, and production reliability.",
        mainEntityOfPage: SITE_URL,
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/#top-agent-tools`,
        name: "Top agent-friendly tools",
        numberOfItems: topTools.length,
        itemListElement: topTools.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE_URL}/tools/${tool.slug}`,
          name: tool.name,
          description: tool.shortDescription,
        })),
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ToolDirectory {...data} />
    </>
  )
}
