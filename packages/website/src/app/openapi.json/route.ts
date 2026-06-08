import {
  agentJsonHeaders,
  getAgentCatalog,
  openApiDocument,
} from "@/lib/agent-catalog"

export async function GET() {
  const catalog = await getAgentCatalog()

  return Response.json(openApiDocument(catalog), {
    headers: agentJsonHeaders(),
  })
}
