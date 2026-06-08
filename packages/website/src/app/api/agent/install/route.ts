import { agentJsonHeaders } from "@/lib/agent-catalog"
import { agentInstallGuide } from "@/lib/agent-install"

export async function GET() {
  return Response.json(agentInstallGuide(), {
    headers: agentJsonHeaders(),
  })
}
