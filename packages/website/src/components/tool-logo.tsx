"use client"

import * as React from "react"

import { getToolLogoUrl } from "@/lib/tool-logos"
import { cn } from "@/lib/utils"

const logoLoadTimeoutMs = 15_000
const logoLoadRetries = 1

type ToolLogoTool = {
  categories?: { slug: string }[]
  docsUrl?: string | null
  githubUrl?: string | null
  name: string
  slug: string
  websiteUrl: string
}

export function ToolLogo({
  className,
  imageClassName,
  tool,
}: {
  className?: string
  imageClassName?: string
  tool: ToolLogoTool
}) {
  const logoUrl = getToolLogoUrl(tool)
  const [logoStatus, setLogoStatus] = React.useState<"loading" | "loaded" | "failed">(
    logoUrl ? "loading" : "failed"
  )

  React.useEffect(() => {
    if (!logoUrl) {
      setLogoStatus("failed")
      return
    }

    let isActive = true
    let timeoutId: number | null = null
    let activeImage: HTMLImageElement | null = null

    setLogoStatus("loading")

    const cleanupAttempt = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId)
        timeoutId = null
      }

      if (activeImage) {
        activeImage.onload = null
        activeImage.onerror = null
        activeImage.src = ""
        activeImage = null
      }
    }

    const load = (attempt: number) => {
      cleanupAttempt()

      const image = new Image()
      activeImage = image
      image.decoding = "async"
      image.referrerPolicy = "no-referrer"

      const retryOrFail = () => {
        if (!isActive) return

        if (attempt < logoLoadRetries) {
          load(attempt + 1)
          return
        }

        cleanupAttempt()
        setLogoStatus("failed")
      }

      timeoutId = window.setTimeout(retryOrFail, logoLoadTimeoutMs)

      image.onload = () => {
        if (!isActive) return

        cleanupAttempt()
        setLogoStatus("loaded")
      }

      image.onerror = retryOrFail
      image.src = logoUrl
    }

    load(0)

    return () => {
      isActive = false
      cleanupAttempt()
    }
  }, [logoUrl])

  return (
    <span
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-card text-xs font-semibold",
        className
      )}
    >
      {logoUrl && logoStatus === "loaded" ? (
        <img
          src={logoUrl}
          alt=""
          className={cn("size-5 object-contain", imageClassName)}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          aria-hidden="true"
          onError={() => setLogoStatus("failed")}
        />
      ) : (
        <ToolAvatarFallback name={tool.name} slug={tool.slug} />
      )}
    </span>
  )
}

const fallbackPalettes = [
  { bg: "#eef6ff", border: "#bae0ff", fg: "#075985", mark: "#38bdf8" },
  { bg: "#f0fdf4", border: "#bbf7d0", fg: "#166534", mark: "#22c55e" },
  { bg: "#fff7ed", border: "#fed7aa", fg: "#9a3412", mark: "#fb923c" },
  { bg: "#f5f3ff", border: "#ddd6fe", fg: "#5b21b6", mark: "#8b5cf6" },
  { bg: "#fdf2f8", border: "#fbcfe8", fg: "#9d174d", mark: "#ec4899" },
  { bg: "#f8fafc", border: "#cbd5e1", fg: "#334155", mark: "#64748b" },
]

function ToolAvatarFallback({ name, slug }: { name: string; slug: string }) {
  const palette = fallbackPalettes[hashString(slug) % fallbackPalettes.length]
  const initials = getToolInitials(name)

  return (
    <span
      className="relative flex size-full items-center justify-center overflow-hidden rounded-[inherit]"
      style={{
        backgroundColor: palette.bg,
        borderColor: palette.border,
        color: palette.fg,
      }}
    >
      <span
        className="absolute -right-2 -top-3 size-6 rotate-45 rounded-sm"
        style={{ backgroundColor: palette.mark, opacity: 0.18 }}
      />
      <span
        className="absolute -bottom-1 left-1 h-1.5 w-5 rounded-full"
        style={{ backgroundColor: palette.mark, opacity: 0.26 }}
      />
      <span className="relative text-[0.68em] font-semibold leading-none tracking-normal">
        {initials}
      </span>
    </span>
  )
}

function getToolInitials(name: string) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function hashString(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}
