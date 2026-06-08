#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import tarfile
import tempfile
import textwrap
import urllib.request
from pathlib import Path

import yaml


REPO_TARBALL_URL = (
    "https://codeload.github.com/awesome-selfhosted/awesome-selfhosted-data/tar.gz/refs/heads/master"
)
OUTPUT_PATH = Path("data/generated-selfhosted-catalog.json")
SOURCE_LABEL = "Awesome Selfhosted data"
MAX_TOOLS = 1000


def main() -> None:
    with tempfile.TemporaryDirectory() as tmpdir:
        archive_path = Path(tmpdir) / "awesome-selfhosted-data.tar.gz"
        urllib.request.urlretrieve(REPO_TARBALL_URL, archive_path)

        with tarfile.open(archive_path, "r:gz") as archive:
            archive.extractall(tmpdir)

        root = next(Path(tmpdir).glob("awesome-selfhosted-data-*"))
        tag_records = load_yaml_files(root / "tags")
        software_records = load_yaml_files(root / "software")

    use_cases = build_use_cases()
    tools = build_tools(software_records)
    categories = filter_categories(build_categories(tag_records), tools)
    payload = {
        "source": {
            "name": SOURCE_LABEL,
            "url": "https://github.com/awesome-selfhosted/awesome-selfhosted-data",
            "generatedFrom": REPO_TARBALL_URL,
        },
        "categories": categories,
        "useCases": use_cases,
        "tools": tools,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n"
    )
    print(
        f"Generated {len(tools)} tools, {len(categories)} categories, "
        f"{len(use_cases)} use cases in {OUTPUT_PATH}"
    )


def load_yaml_files(folder: Path) -> list[dict]:
    records = []

    for path in sorted(folder.glob("*.yml")):
        with path.open() as file:
            data = yaml.safe_load(file) or {}

        if isinstance(data, dict):
            data["_source_file"] = path.name
            records.append(data)

    return records


def build_categories(tag_records: list[dict]) -> list[dict]:
    categories = [
        {
            "slug": "self-hosted",
            "name": "Self-hosted",
            "description": "Software that can run on user-controlled infrastructure.",
            "sortOrder": 200,
        }
    ]

    for index, tag in enumerate(tag_records, start=1):
        name = clean_text(tag.get("name") or filename_to_name(tag["_source_file"]))
        slug = f"selfhosted-{slugify(name)}"
        description = strip_markdown(
            tag.get("description")
            or f"Self-hosted software for {name.lower()} workflows."
        )
        categories.append(
            {
                "slug": slug,
                "name": name,
                "description": truncate(description, 220),
                "sortOrder": 200 + index,
            }
        )

    return unique_by_slug(categories)


def build_use_cases() -> list[dict]:
    return [
        {
            "slug": "self-host-tool",
            "name": "Self-host a tool",
            "description": "Deploy and operate a tool on user-controlled infrastructure.",
        },
        {
            "slug": "deploy-internal-tool",
            "name": "Deploy internal tools",
            "description": "Run internal apps, dashboards, workflows, and operational systems.",
        },
        {
            "slug": "inspect-open-source",
            "name": "Inspect open source",
            "description": "Review source code, releases, licenses, and deployment paths before agent use.",
        },
    ]


def build_tools(software_records: list[dict]) -> list[dict]:
    tools = []
    seen_slugs: set[str] = set()

    for record in software_records:
        if record.get("archived") is True:
            continue

        name = clean_text(record.get("name") or filename_to_name(record["_source_file"]))
        if not name:
            continue

        base_slug = slugify(name)
        slug = base_slug
        if slug in seen_slugs:
            slug = f"{base_slug}-{slugify(record['_source_file'].removesuffix('.yml'))}"
        seen_slugs.add(slug)

        description = clean_text(record.get("description") or f"Self-hosted {name} software.")
        tags = [clean_text(tag) for tag in record.get("tags", []) if clean_text(tag)]
        platforms = [clean_text(platform) for platform in record.get("platforms", []) if clean_text(platform)]
        licenses = [clean_text(license_) for license_ in record.get("licenses", []) if clean_text(license_)]
        source_url = clean_text(record.get("source_code_url") or "")
        website_url = clean_text(record.get("website_url") or source_url)
        if not website_url:
            continue

        primary_tag = tags[0] if tags else "Self-hosted"
        category_slugs = ["self-hosted", *[f"selfhosted-{slugify(tag)}" for tag in tags[:3]]]
        capabilities = build_capabilities(record, description, source_url, website_url)
        github_url = source_url if "github.com/" in source_url else None
        docs_url = source_url or website_url
        stars = int(record.get("stargazers_count") or 0)
        updated_at = clean_text(str(record.get("updated_at") or ""))
        release = record.get("current_release") or {}
        release_tag = clean_text(str(release.get("tag") or ""))

        tools.append(
            {
                "slug": slug,
                "name": name,
                "tagline": truncate(f"Self-hosted {primary_tag.lower()} software.", 96),
                "websiteUrl": website_url,
                "docsUrl": docs_url,
                "githubUrl": github_url,
                "shortDescription": truncate(description, 220),
                "agentSummary": truncate(
                    f"{name} is self-hostable software from the {SOURCE_LABEL} index. "
                    "Agents can inspect the source, deploy it in a controlled environment, "
                    "and operate the browser UI; API or CLI support should be verified in project docs.",
                    320,
                ),
                "bestFor": truncate(
                    f"Self-hosted {primary_tag.lower()} workflows, internal tools, and controlled deployment experiments.",
                    180,
                ),
                "cautionNotes": truncate(
                    "Key limitations: generated from community metadata, not a full security review. "
                    "Verify maintenance activity, license, deployment docs, auth model, backup and restore path, "
                    "update process, API or CLI support, and data exposure before production agent automation.",
                    360,
                ),
                "pricingSummary": license_summary(licenses),
                "authModel": auth_summary(platforms, source_url),
                "accountCreation": "No vendor signup is required for self-hosted use, but deployment and admin setup are required.",
                "browserSupport": "Browser UI can be operated after deployment; exact flows depend on the app configuration.",
                "agentScore": baseline_score(record, capabilities),
                "launchScore": min(950, 120 + stars // 150),
                "submittedBy": f"Generated from {SOURCE_LABEL}",
                "categorySlugs": unique(category_slugs),
                "useCaseSlugs": use_case_slugs(tags, description),
                "capabilities": capabilities,
                "cautionSource": {
                    "stars": stars,
                    "updatedAt": updated_at,
                    "release": release_tag,
                },
            }
        )

    return sorted(
        tools,
        key=lambda tool: (
            -(tool.get("cautionSource", {}).get("stars") or 0),
            str(tool.get("cautionSource", {}).get("updatedAt") or ""),
            tool["name"].lower(),
        ),
    )[:MAX_TOOLS]


def filter_categories(categories: list[dict], tools: list[dict]) -> list[dict]:
    used_slugs = {
        slug
        for tool in tools
        for slug in tool.get("categorySlugs", [])
    }

    return [
        category
        for category in categories
        if category["slug"] in used_slugs or category["slug"] == "self-hosted"
    ]


def build_capabilities(record: dict, description: str, source_url: str, website_url: str) -> list[dict]:
    text = " ".join(
        [
            description,
            " ".join(record.get("tags", [])),
            " ".join(record.get("platforms", [])),
            source_url,
            website_url,
        ]
    ).lower()
    evidence_url = source_url or website_url
    capabilities = [
        {
            "slug": "browser",
            "supportLevel": "strong",
            "detail": "Self-hosted web app can be operated through a browser once deployed.",
            "evidenceUrl": website_url,
        },
        {
            "slug": "pricing-clarity",
            "supportLevel": "strong",
            "detail": "Self-hosted/open-source licensing makes software cost inspectable; infrastructure cost depends on deployment.",
            "evidenceUrl": evidence_url,
        },
        {
            "slug": "account-creation",
            "supportLevel": "partial",
            "detail": "No vendor signup is required for self-hosted use, but deployment, admin setup, and local auth configuration are usually required.",
            "evidenceUrl": evidence_url,
        },
        {
            "slug": "docs-quality",
            "supportLevel": "partial",
            "detail": "Project website or source repository is listed for documentation and deployment review.",
            "evidenceUrl": evidence_url,
        },
        {
            "slug": "sandbox",
            "supportLevel": "strong",
            "detail": "Self-hosted deployment supports local, staging, or disposable test environments before production use.",
            "evidenceUrl": evidence_url,
        },
    ]

    if any(keyword in text for keyword in ["api", "rest", "graphql", "webhook", "integration", "automation", "database", "server"]):
        capabilities.insert(
            0,
            {
                "slug": "api",
                "supportLevel": "partial",
                "detail": "Metadata suggests an API, server, integration, or automation surface; verify exact endpoints in project docs.",
                "evidenceUrl": evidence_url,
            },
        )

    if any(keyword in text for keyword in ["cli", "command line", "terminal"]):
        capabilities.insert(
            0,
            {
                "slug": "cli",
                "supportLevel": "partial",
                "detail": "Metadata suggests command-line operation; verify install and command coverage in project docs.",
                "evidenceUrl": evidence_url,
            },
        )

    return capabilities


def use_case_slugs(tags: list[str], description: str) -> list[str]:
    text = " ".join(tags + [description]).lower()
    slugs = ["self-host-tool", "inspect-open-source"]

    if any(keyword in text for keyword in ["admin", "automation", "crm", "dashboard", "project", "workflow", "management"]):
        slugs.append("deploy-internal-tool")

    if any(keyword in text for keyword in ["analytics", "metrics", "monitor", "log"]):
        slugs.append("analyze-product")

    if any(keyword in text for keyword in ["content", "cms", "blog", "wiki", "document"]):
        slugs.append("publish-content")

    if any(keyword in text for keyword in ["database", "search", "archive", "data"]):
        slugs.append("triage-work")

    return unique(slugs)


def baseline_score(record: dict, capabilities: list[dict]) -> int:
    stars = int(record.get("stargazers_count") or 0)
    score = 42 + min(18, stars // 1500)
    if any(item["slug"] == "api" for item in capabilities):
        score += 8
    if any(item["slug"] == "cli" for item in capabilities):
        score += 5
    if record.get("current_release"):
        score += 4
    if record.get("updated_at"):
        score += 3
    return min(78, score)


def license_summary(licenses: list[str]) -> str:
    if licenses:
        return f"Self-hosted/open-source licensing listed as {', '.join(licenses[:3])}; infrastructure costs vary by deployment."

    return "Self-hosted project; software and infrastructure costs should be checked before deployment."


def auth_summary(platforms: list[str], source_url: str) -> str:
    platform_text = ", ".join(platforms[:4]) if platforms else "self-hosted deployment"
    source_text = f" Source code: {source_url}" if source_url else ""
    return f"Auth and permissions depend on the deployed app configuration; platform metadata: {platform_text}.{source_text}"


def filename_to_name(filename: str) -> str:
    return filename.removesuffix(".yml").replace("-", " ").title()


def slugify(value: str) -> str:
    value = clean_text(value).lower()
    value = value.replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "tool"


def strip_markdown(value: str) -> str:
    value = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", value)
    value = re.sub(r"`([^`]+)`", r"\1", value)
    return clean_text(value)


def clean_text(value: object) -> str:
    return " ".join(str(value or "").replace("\n", " ").split())


def truncate(value: str, limit: int) -> str:
    value = clean_text(value)
    if len(value) <= limit:
        return value
    return textwrap.shorten(value, width=limit, placeholder="...")


def unique(values: list[str]) -> list[str]:
    seen = set()
    output = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            output.append(value)
    return output


def unique_by_slug(items: list[dict]) -> list[dict]:
    seen = set()
    output = []
    for item in items:
        slug = item["slug"]
        if slug in seen:
            continue
        seen.add(slug)
        output.append(item)
    return output


if __name__ == "__main__":
    main()
