import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function canResolveCommit(ref) {
  try {
    execFileSync("git", ["cat-file", "-e", `${ref}^{commit}`], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function eventBeforeSha() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !existsSync(eventPath)) {
    return null;
  }

  try {
    const event = JSON.parse(readFileSync(eventPath, "utf8"));
    const before = typeof event.before === "string" ? event.before : null;
    if (before && !/^0+$/.test(before) && canResolveCommit(before)) {
      return before;
    }
  } catch {
    return null;
  }

  return null;
}

function changedFiles(base) {
  const output = git(["diff", "--name-only", base, "HEAD"]);
  return output ? output.split("\n").filter(Boolean) : [];
}

function packageVersion(path) {
  return JSON.parse(readFileSync(path, "utf8")).version;
}

async function appendOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }

  const { appendFile } = await import("node:fs/promises");
  await appendFile(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

const base = eventBeforeSha() || (canResolveCommit("HEAD^") ? "HEAD^" : null);
const files = base ? changedFiles(base) : [];
const cliVersion = packageVersion("packages/cli/package.json");
const websiteVersion = packageVersion("packages/website/package.json");
const cliTagExists = canResolveCommit(`canagentsuse@${cliVersion}`);
const hasUntaggedCliVersion = !cliTagExists;
const cli = files.includes("packages/cli/package.json") || hasUntaggedCliVersion;
const website = files.includes("packages/website/package.json");
const hasRelease = cli || website;
const plan = {
  base,
  hasRelease,
  cli,
  website,
  cliVersion,
  websiteVersion,
  cliTagExists,
  changedFiles: files,
};

console.log(JSON.stringify(plan, null, 2));

await appendOutput("base", plan.base ?? "");
await appendOutput("has_release", String(plan.hasRelease));
await appendOutput("cli", String(plan.cli));
await appendOutput("website", String(plan.website));
await appendOutput("cli_version", plan.cliVersion);
await appendOutput("website_version", plan.websiteVersion);
