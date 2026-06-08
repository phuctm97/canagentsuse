import { agentJsonHeaders, getAgentToolBySlug } from "@/lib/agent-catalog"

type ToolRouteContext = {
  params: Promise<{ slug: string }>
}

export async function GET(_request: Request, { params }: ToolRouteContext) {
  const { slug } = await params
  const tool = await getAgentToolBySlug(slug)

  if (!tool) {
    return Response.json(
      {
        error: "Tool not found",
      },
      {
        status: 404,
        headers: agentJsonHeaders(),
      }
    )
  }

  return Response.json(
    {
      tool,
    },
    {
      headers: agentJsonHeaders(),
    }
  )
}
