import type { MetadataRoute } from "next"

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Can Agents Use",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#00b86b",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "32x32",
        type: "image/x-icon",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/brand/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  }
}
