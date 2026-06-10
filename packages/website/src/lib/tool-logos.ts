type ToolLogoInput = {
  categories?: { slug: string }[]
  categorySlugs?: string[]
  docsUrl?: string | null
  githubUrl?: string | null
  logoPath?: string | null
  slug: string
  websiteUrl: string
}

const simpleIconSlugs: Record<string, string> = {
  "apache-airflow": "apacheairflow",
  airtable: "airtable",
  algolia: "algolia",
  anthropic: "anthropic",
  appsmith: "appsmith",
  appwrite: "appwrite",
  asana: "asana",
  buffer: "buffer",
  caddy: "caddy",
  "code-server": "coder",
  cloudflare: "cloudflare",
  cloudinary: "cloudinary",
  clerk: "clerk",
  datadog: "datadog",
  "dify-ai": "dify",
  discord: "discord",
  docker: "docker",
  discourse: "discourse",
  elasticsearch: "elastic",
  figma: "figma",
  "fly-io": "flydotio",
  ghost: "ghost",
  gitea: "gitea",
  github: "github",
  gitlab: "gitlab",
  "google-cloud": "googlecloud",
  "google-gemini": "googlegemini",
  "google-sheets": "googlesheets",
  "grafana-cloud": "grafana",
  "hugging-face": "huggingface",
  hubspot: "hubspot",
  immich: "immich",
  intercom: "intercom",
  jellyfin: "jellyfin",
  jira: "jira",
  joplin: "joplin",
  kong: "kong",
  kubernetes: "kubernetes",
  "lemon-squeezy": "lemonsqueezy",
  linear: "linear",
  mailgun: "mailgun",
  mastodon: "mastodon",
  meilisearch: "meilisearch",
  metabase: "metabase",
  "mistral-ai": "mistralai",
  "mongodb-atlas": "mongodb",
  n8n: "n8n",
  neon: "neon",
  netlify: "netlify",
  notion: "notion",
  novu: "novu",
  odoo: "odoo",
  ollama: "ollama",
  openrouter: "openrouter",
  paddle: "paddle",
  "payload-cms": "payloadcms",
  planetscale: "planetscale",
  posthog: "posthog",
  pulumi: "pulumi",
  qdrant: "qdrant",
  railway: "railway",
  render: "render",
  replicate: "replicate",
  resend: "resend",
  sentry: "sentry",
  shopify: "shopify",
  stripe: "stripe",
  strapi: "strapi",
  supabase: "supabase",
  syncthing: "syncthing",
  "telegram-bot-api": "telegram",
  terraform: "terraform",
  trello: "trello",
  turso: "turso",
  typeform: "typeform",
  upstash: "upstash",
  vercel: "vercel",
  "x-api": "x",
  zapier: "zapier",
  zendesk: "zendesk",
}

const discoveredSimpleIconSlugs: Record<string, string> = {
  "adguard-home": "adguard",
  adminer: "adminer",
  "affine-community-edition": "affine",
  akaunting: "akaunting",
  answer: "answer",
  "apache-solr": "apachesolr",
  apostrophe: "apostrophe",
  asciinema: "asciinema",
  asterisk: "asterisk",
  audiobookshelf: "audiobookshelf",
  baserow: "baserow",
  bigbluebutton: "bigbluebutton",
  bitwarden: "bitwarden",
  budibase: "budibase",
  "calibre-web": "calibreweb",
  "calibre-web-automated": "calibreweb",
  chatwoot: "chatwoot",
  cockpit: "cockpit",
  coder: "coder",
  contao: "contao",
  craftcms: "craftcms",
  cryptpad: "cryptpad",
  diaspora: "diaspora",
  directus: "directus",
  dolibarr: "dolibarr",
  dovecot: "dovecot",
  "eclipse-che": "eclipseche",
  element: "element",
  ente: "ente",
  erpnext: "erpnext",
  "f-droid": "fdroid",
  "firefly-iii": "fireflyiii",
  formbricks: "formbricks",
  freshrss: "freshrss",
  frigate: "frigate",
  gerrit: "gerrit",
  ghostfolio: "ghostfolio",
  glance: "glance",
  grocy: "grocy",
  harbor: "harbor",
  hasura: "hasura",
  hedgedoc: "hedgedoc",
  homarr: "homarr",
  "hoppscotch-community-edition": "hoppscotch",
  humhub: "humhub",
  invidious: "invidious",
  "invoice-ninja": "invoiceninja",
  iobroker: "iobroker",
  "jitsi-meet": "jitsi",
  "jitsi-video-bridge": "jitsi",
  joomla: "joomla",
  kamailio: "kamailio",
  karakeep: "karakeep",
  kirby: "kirby",
  known: "known",
  kodi: "kodi",
  languagetool: "languagetool",
  lemmy: "lemmy",
  "libre-translate": "libretranslate",
  limesurvey: "limesurvey",
  listmonk: "listmonk",
  luanti: "luanti",
  matomo: "matomo",
  mattermost: "mattermost",
  mautic: "mautic",
  mealie: "mealie",
  medusa: "medusa",
  misskey: "misskey",
  modx: "modx",
  monica: "monica",
  mumble: "mumble",
  nextcloud: "nextcloud",
  "nextcloud-memories": "nextcloud",
  nextcloudpi: "nextcloud",
  nginx: "nginx",
  "nginx-proxy-manager": "nginxproxymanager",
  "node-red": "nodered",
  nodebb: "nodebb",
  ntfy: "ntfy",
  octoprint: "octoprint",
  onlyoffice: "onlyoffice",
  openhab: "openhab",
  openmediavault: "openmediavault",
  openproject: "openproject",
  opensearch: "opensearch",
  openstreetmap: "openstreetmap",
  outline: "outline",
  overleaf: "overleaf",
  owncloud: "owncloud",
  pangolin: "pangolin",
  "paperless-ngx": "paperlessngx",
  passbolt: "passbolt",
  peertube: "peertube",
  penpot: "penpot",
  phpbb: "phpbb",
  "pi-hole": "pihole",
  pimcore: "pimcore",
  piwigo: "piwigo",
  pixelfed: "pixelfed",
  plane: "plane",
  "plausible-analytics": "plausibleanalytics",
  pocketbase: "pocketbase",
  pomerium: "pomerium",
  postiz: "postiz",
  prestashop: "prestashop",
  pterodactyl: "pterodactyl",
  qbittorrent: "qbittorrent",
  radarr: "radarr",
  "reactive-resume": "reactiveresume",
  redash: "redash",
  "rocket-chat": "rocketdotchat",
  roundcube: "roundcube",
  seafile: "seafile",
  searxng: "searxng",
  "shopware-community-edition": "shopware",
  simplelogin: "simplelogin",
  siyuan: "siyuan",
  sonarr: "sonarr",
  task: "task",
  tasmota: "tasmota",
  textpattern: "textpattern",
  tiddlywiki: "tiddlywiki",
  transmission: "transmission",
  twenty: "twenty",
  typo3: "typo3",
  umami: "umami",
  umbraco: "umbraco",
  umbrel: "umbrel",
  vaultwarden: "vaultwarden",
  vikunja: "vikunja",
  wagtail: "wagtail",
  wallabag: "wallabag",
  weblate: "weblate",
  webtrees: "webtrees",
  "wiki-js": "wikidotjs",
  woocommerce: "woocommerce",
  wordpress: "wordpress",
  zincsearch: "zincsearch",
  zulip: "zulip",
}

const logoDomainOverrides: Record<string, string> = {
  aws: "aws.amazon.com",
  browserbase: "browserbase.com",
  canva: "canva.com",
  cohere: "cohere.com",
  exa: "exa.ai",
  firecrawl: "firecrawl.dev",
  groq: "groq.com",
  "microsoft-azure": "azure.microsoft.com",
  openai: "openai.com",
  paddle: "paddle.com",
  pipedream: "pipedream.com",
  postmark: "postmarkapp.com",
  salesforce: "salesforce.com",
  sendgrid: "sendgrid.com",
  slack: "slack.com",
  twilio: "twilio.com",
  uploadthing: "uploadthing.com",
}

const noFaviconFallbackSlugs = new Set([
  "aimeos",
  "ampache",
  "anubis",
  "apaxy",
  "artalk",
  "atomic-server",
  "backdrop-cms",
  "blocky",
  "bluecherry",
  "bracket",
  "bugzilla",
  "cal-diy",
  "changedetection-io",
  "chiefonboarding",
  "collective-access-providence",
  "cypht",
  "cyrus-imap",
  "daily-stars-explorer",
  "dagu",
  "discount-bandit",
  "django-crm",
  "downtify",
  "dpaste",
  "ech0",
  "egroupware",
  "enigma-1-2-bbs",
  "ezbookkeeping",
  "fittrackee",
  "foodsoft",
  "fredy",
  "galene",
  "gathio",
  "genealogy",
  "goploader",
  "hamsterbase-tasks",
  "haraka",
  "hatsu",
  "homelabos",
  "homegallery",
  "hortusfox",
  "invoiceshelf",
  "isso",
  "jelu",
  "kapowarr",
  "kibitzr",
  "koillection",
  "kresus",
  "librebooking",
  "linuxgsm",
  "maddy-mail-server",
  "mafl",
  "mailu",
  "mataroa",
  "middleware",
  "moode-audio",
  "mox",
  "mpd",
  "multi-scrobbler",
  "nefarious",
  "nominatim",
  "note-mark",
  "ocular",
  "ombi",
  "one-time-secret",
  "openmeetings",
  "openreader",
  "osem",
  "ots",
  "personal-management-system",
  "photoview",
  "pigallery-2",
  "piler",
  "podfetch",
  "publify",
  "pyload",
  "quickshare",
  "recipya",
  "relate",
  "restreamer",
  "rsshub",
  "safebucket",
  "sip-irrigation-control",
  "slink",
  "specifically-clementines",
  "spectrum-2",
  "swingmusic",
  "synapse",
  "tandoor-recipes",
  "thumbor",
  "tiny-file-manager",
  "tiny-tiny-rss",
  "tinyfeed",
  "tinyproxy",
  "trip",
  "unison",
  "wger",
  "wikidocs",
  "writing",
  "zenko-cloudserver",
])

const simpleIconStaticPrefix = "/logos/simple-icons/"
const simpleIconSlugSet = new Set([
  ...Object.values(simpleIconSlugs),
  ...Object.values(discoveredSimpleIconSlugs),
])

export function getToolLogoUrl(tool: ToolLogoInput) {
  if (isToolLogoPath(tool.logoPath)) {
    return tool.logoPath
  }

  const simpleIconSlug = getSimpleIconSlug(tool)

  if (simpleIconSlug) {
    return `${simpleIconStaticPrefix}${encodeURIComponent(simpleIconSlug)}.svg`
  }

  return getFaviconLogoUrl(tool)
}

export function getToolLogoAuditUrl(tool: ToolLogoInput) {
  if (isToolLogoPath(tool.logoPath)) {
    return tool.logoPath
  }

  const simpleIconSlug = getSimpleIconSlug(tool)

  if (simpleIconSlug) {
    return getSimpleIconSourceUrl(simpleIconSlug)
  }

  return getFaviconLogoUrl(tool)
}

export function getSimpleIconSourceUrl(slug: string) {
  return `https://cdn.simpleicons.org/${encodeURIComponent(slug)}`
}

export function getKnownSimpleIconSlugs() {
  return [...simpleIconSlugSet].sort()
}

function getSimpleIconSlug(tool: ToolLogoInput) {
  const simpleIconSlug = simpleIconSlugs[tool.slug] ?? discoveredSimpleIconSlugs[tool.slug]

  return simpleIconSlug ?? null
}

function isToolLogoPath(value: string | null | undefined) {
  return /^\/logos\/tools\/[a-z0-9]+(?:-[a-z0-9]+)*\.svg$/.test(value ?? "")
}

function getFaviconLogoUrl(tool: ToolLogoInput) {
  if (
    usesSourceHost(tool.websiteUrl) ||
    (isSelfHostedTool(tool) && (usesSourceHost(tool.docsUrl) || usesSourceHost(tool.githubUrl))) ||
    noFaviconFallbackSlugs.has(tool.slug)
  ) {
    return null
  }

  const domain = logoDomainOverrides[tool.slug] ?? getToolLogoDomain(tool.websiteUrl)

  if (!domain) return null

  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
}

function isSelfHostedTool(tool: ToolLogoInput) {
  const categorySlugs = [
    ...(tool.categorySlugs ?? []),
    ...(tool.categories?.map((category) => category.slug) ?? []),
  ]

  return categorySlugs.some((slug) => slug === "self-hosted" || slug.startsWith("selfhosted-"))
}

function usesSourceHost(websiteUrl: string | null | undefined) {
  if (!websiteUrl) {
    return false
  }

  try {
    const hostname = new URL(websiteUrl).hostname

    return hostname === "github.com" || hostname === "gitlab.com"
  } catch {
    return false
  }
}

function getToolLogoDomain(websiteUrl: string) {
  try {
    return new URL(websiteUrl).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}
