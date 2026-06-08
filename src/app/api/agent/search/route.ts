import { agentJsonHeaders, searchAgentTools } from "@/lib/agent-catalog"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const result = await searchAgentTools({
    query: url.searchParams.get("q") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    capability: url.searchParams.get("capability") ?? undefined,
    page: Number(url.searchParams.get("page") ?? undefined),
    limit: Number(url.searchParams.get("limit") ?? undefined),
  })

  return Response.json(result, {
    headers: agentJsonHeaders(),
  })
}
