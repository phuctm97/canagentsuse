import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

function run(command, args) {
  console.log(`$ ${[command, ...args].join(" ")}`);
  execFileSync(command, args, { stdio: "inherit" });
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

const before = eventBeforeSha();

if (before) {
  run("git", ["diff", "--check", before, "HEAD"]);
} else if (canResolveCommit("HEAD^")) {
  run("git", ["diff", "--check", "HEAD^", "HEAD"]);
} else {
  run("git", ["diff-tree", "--check", "--root", "-r", "HEAD"]);
}
