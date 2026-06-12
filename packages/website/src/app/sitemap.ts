import type { MetadataRoute } from "next"

import { tools } from "@/lib/catalog-data"
import { SITE_URL } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/agents`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...tools.map((tool) => ({
      url: `${SITE_URL}/tools/${tool.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]
}
