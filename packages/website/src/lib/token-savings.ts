export const tokenSavingsBenchmark = {
  query: "billing API sandbox pricing caution notes",
  task: "Find billing tools with API support, sandbox or test mode, pricing clarity, and caution notes.",
  measuredAt: "2026-06-10",
  method:
    "Estimated tokens with ceil(characters / 4). Normal search counts stripped visible text from official pages for the top three candidates returned by the same task. Can Agents Use counts /api/agent/search plus /api/agent/tools records for those candidates.",
  normalSearch: {
    label: "Normal search",
    output: "Official pages, pricing pages, and API docs",
    tokens: 23243,
    sources: [
      "https://fossbilling.org/",
      "https://github.com/FOSSBilling/FOSSBilling",
      "https://stripe.com/pricing",
      "https://docs.stripe.com/api",
      "https://docs.stripe.com/test-mode",
      "https://www.paddle.com/pricing",
      "https://developer.paddle.com/api-reference/overview",
      "https://developer.paddle.com/sdks/sandbox/",
    ],
  },
  canAgentsUse: {
    label: "Can Agents Use",
    output: "Search JSON plus 3 tool records",
    results: ["FOSSBilling", "Stripe", "Paddle"],
    tokens: 13477,
    sources: [
      "/api/agent/search?q=billing&capability=api&limit=3",
      "/api/agent/tools/fossbilling",
      "/api/agent/tools/stripe",
      "/api/agent/tools/paddle",
    ],
  },
} as const

export const tokenSavings = {
  tokens:
    tokenSavingsBenchmark.normalSearch.tokens -
    tokenSavingsBenchmark.canAgentsUse.tokens,
  percent: Math.round(
    (1 -
      tokenSavingsBenchmark.canAgentsUse.tokens /
        tokenSavingsBenchmark.normalSearch.tokens) *
      100
  ),
}

export function formatTokenCount(tokens: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(tokens)
}

export function formatExactTokenCount(tokens: number) {
  return new Intl.NumberFormat("en-US").format(tokens)
}
