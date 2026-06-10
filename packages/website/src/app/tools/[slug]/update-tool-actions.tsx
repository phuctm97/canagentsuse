"use client"

import * as React from "react"
import {
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  GitPullRequestIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type UpdateToolActionsProps = {
  updateToolAgentPrompt: string
  updateToolPrUrl: string
}

export function UpdateToolActions({
  updateToolAgentPrompt,
  updateToolPrUrl,
}: UpdateToolActionsProps) {
  const [copied, setCopied] = React.useState(false)

  async function copyUpdatePrompt() {
    try {
      await navigator.clipboard.writeText(updateToolAgentPrompt)
      setCopied(true)
      toast.success("Copied", {
        description: "Update prompt copied to clipboard.",
      })
    } catch {
      setCopied(false)
      toast.error("Clipboard blocked", {
        description: "Open the update PR template instead.",
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          Update
          <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              window.open(updateToolPrUrl, "_blank", "noopener,noreferrer")
            }}
          >
            <GitPullRequestIcon />
            Open update PR template
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              void copyUpdatePrompt()
            }}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? "Copied update prompt" : "Copy update prompt for agent"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
