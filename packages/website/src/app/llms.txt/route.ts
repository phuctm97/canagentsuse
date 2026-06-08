import { agentJsonHeaders, catalogToMarkdown, getAgentCatalog } from "@/lib/agent-catalog"

export async function GET() {
  const catalog = await getAgentCatalog()

  return new Response(catalogToMarkdown(catalog), {
    headers: agentJsonHeaders({
      "Content-Type": "text/plain; charset=utf-8",
    }),
  })
}
