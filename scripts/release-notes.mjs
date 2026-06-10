import { execFileSync } from "node:child_process"
import { writeFileSync } from "node:fs"

const repo = process.env.GITHUB_REPOSITORY
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN
const currentTag = process.env.RELEASE_TAG || ""
const outputPath = process.env.RELEASE_NOTES_PATH || "/tmp/release-notes.md"
const cliRelease = process.env.CLI_RELEASE === "true"
const websiteRelease = process.env.WEBSITE_RELEASE === "true"
const cliVersion = process.env.CLI_VERSION || ""
const websiteVersion = process.env.WEBSITE_VERSION || ""

if (!repo) {
  throw new Error("GITHUB_REPOSITORY is required")
}

if (!currentTag) {
  throw new Error("RELEASE_TAG is required")
}

const previousTag = previousReleaseTag(currentTag)
const compareUrl = previousTag
  ? `https://github.com/${repo}/compare/${previousTag}...${currentTag}`
  : `https://github.com/${repo}/releases/tag/${currentTag}`
const changes = await releaseChanges(previousTag, currentTag)
const newContributorLines = await newContributors(changes)
const lines = ["## What's Changed", ""]

if (cliRelease && cliVersion) {
  lines.push(`- Released \`canagentsuse@${cliVersion}\` to npm.`)
}

if (websiteRelease && websiteVersion) {
  lines.push(`- Released \`@canagentsuse/website@${websiteVersion}\` to production.`)
}

for (const change of changes) {
  lines.push(`- ${changeLine(change)}`)
}

if (lines.at(-1) === "") {
  lines.push("- Release completed without user-facing changelog entries.")
}

if (newContributorLines.length > 0) {
  lines.push("", "## New Contributors", "", ...newContributorLines)
}

lines.push("", `**Full Changelog**: ${compareUrl}`, "")

writeFileSync(outputPath, lines.join("\n"))
console.log(`Wrote release notes to ${outputPath}`)

function previousReleaseTag(tag) {
  const currentVersion = versionFromTag(tag)
  const tags = git(["tag", "--list", "canagentsuse@*", "--sort=-v:refname"])
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => entry !== tag)
    .filter((entry) => {
      const version = versionFromTag(entry)
      return currentVersion && version ? compareVersion(version, currentVersion) < 0 : true
    })

  return tags[0] || ""
}

async function releaseChanges(baseTag, tag) {
  const range = baseTag ? `${baseTag}..${tag}` : tag
  const commits = git([
    "log",
    "--reverse",
    "--format=%H%x00%s%x00%an%x00%ae",
    range,
  ])
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [sha, subject, authorName, authorEmail] = line.split("\0")
      return { sha, subject, authorName, authorEmail }
    })
    .filter((commit) => !isVersionPackageCommit(commit))

  const changes = []
  const seenPulls = new Set()

  for (const commit of commits) {
    const pull = await associatedPull(commit.sha)

    if (pull) {
      if (seenPulls.has(pull.number)) {
        continue
      }

      seenPulls.add(pull.number)
      changes.push({
        type: "pull",
        title: pull.title,
        number: pull.number,
        author: pull.user?.login || "",
      })
      continue
    }

    changes.push({
      type: "commit",
      title: commit.subject,
      sha: commit.sha,
      author: await commitAuthorLogin(commit.sha, commit.authorName),
    })
  }

  return changes
}

async function associatedPull(sha) {
  if (!token) return null

  const pulls = await github(`/repos/${repo}/commits/${sha}/pulls`, {
    accept: "application/vnd.github+json",
  })
  return Array.isArray(pulls) ? pulls[0] : null
}

async function commitAuthorLogin(sha, fallback) {
  if (!token) return fallback

  const commit = await github(`/repos/${repo}/commits/${sha}`)
  return commit?.author?.login || fallback
}

async function newContributors(changes) {
  const pullChanges = changes.filter((change) => change.type === "pull" && change.author)
  const lines = []

  for (const change of pullChanges) {
    if (await isFirstMergedPull(change.author, change.number)) {
      lines.push(`- @${change.author} made their first contribution in #${change.number}.`)
    }
  }

  return lines
}

async function isFirstMergedPull(author, number) {
  if (!token) return false

  const query = new URLSearchParams({
    q: `repo:${repo} is:pr is:merged author:${author}`,
    sort: "created",
    order: "asc",
    per_page: "100",
  })
  const result = await github(`/search/issues?${query}`)
  const firstPull = result?.items?.[0]
  return firstPull?.number === number
}

async function github(path, options = {}) {
  const headers = {
    Accept: options.accept || "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  }
  const response = await fetch(`https://api.github.com${path}`, { headers })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`GitHub API ${path} failed: ${response.status} ${body}`)
  }

  return response.json()
}

function changeLine(change) {
  if (change.type === "pull") {
    return `${change.title} by @${change.author} in #${change.number}`
  }

  const shortSha = change.sha.slice(0, 7)
  return `${change.title} by ${formatAuthor(change.author)} in ${shortSha}`
}

function formatAuthor(author) {
  if (!author) return "unknown"
  return author.includes(" ") || author.startsWith("@") ? author : `@${author}`
}

function isVersionPackageCommit(commit) {
  return (
    commit.subject === "Version packages" ||
    commit.authorEmail === "41898282+github-actions[bot]@users.noreply.github.com"
  )
}

function versionFromTag(tag) {
  const match = tag.match(/^canagentsuse@(\d+)\.(\d+)\.(\d+)$/)
  if (!match) return null
  return match.slice(1).map((value) => Number(value))
}

function compareVersion(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] - right[index]
    }
  }

  return 0
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim()
}
