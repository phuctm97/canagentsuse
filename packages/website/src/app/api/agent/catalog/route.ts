import { agentJsonHeaders, getAgentCatalog } from "@/lib/agent-catalog"

export async function GET() {
  const catalog = await getAgentCatalog()

  return Response.json(catalog, {
    headers: agentJsonHeaders(),
  })
}
