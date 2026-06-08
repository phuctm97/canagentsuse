import { canAgentsUseSkillMarkdown } from "@/lib/agent-install"
import { agentJsonHeaders } from "@/lib/agent-catalog"

export async function GET() {
  return new Response(canAgentsUseSkillMarkdown(), {
    headers: agentJsonHeaders({
      "Content-Type": "text/markdown; charset=utf-8",
    }),
  })
}
