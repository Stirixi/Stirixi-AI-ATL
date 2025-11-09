#!/usr/bin/env python3
import argparse
import json
import re
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd

PR_RE = re.compile(r"/pull/(\d+)")

COMPANY_ORG = "heliosdrift"
COMPANY_REPO = "commerce-platform"


def parse_args():
    ap = argparse.ArgumentParser(description="Convert Kaggle PR comment dataset to Stirixi CSVs")
    ap.add_argument("input", help="Path to mined-comments*.json")
    ap.add_argument("outdir", help="Output directory for CSVs")
    ap.add_argument("--limit", type=int, default=None, help="Limit number of repos for sampling")
    ap.add_argument("--repo", help="Specific org/repo to include (e.g., medusajs/medusa)")
    return ap.parse_args()


def main():
    args = parse_args()
    data = json.load(open(args.input, "r"))
    rows = []
    pr_meta = {}

    for idx, (repo_name, comments) in enumerate(data.items()):
        if args.limit and idx >= args.limit:
            break
        if args.repo and repo_name != args.repo:
            continue
        if not isinstance(comments, list):
            continue

        org, repo = COMPANY_ORG, COMPANY_REPO

        for c in comments:
            html_url = c.get("html_url", "")
            m = PR_RE.search(html_url)
            pr_number = int(m.group(1)) if m else None
            if pr_number is None:
                continue
            key = (org, repo, pr_number)
            meta = pr_meta.setdefault(key, {
                "org": org,
                "repo": repo,
                "pr_number": pr_number,
                "comment_count": 0,
                "commenters": set(),
                "first_author": c.get("user"),
            })
            meta["comment_count"] += 1
            if c.get("user"):
                meta["commenters"].add(c.get("user"))

            rows.append({
                "org": org,
                "repo": repo,
                "pr_number": pr_number,
                "comment_id": c.get("id"),
                "author": c.get("user"),
                "author_association": c.get("author_association"),
                "body": c.get("body"),
                "path": c.get("path"),
                "line": c.get("line"),
                "diffHunk": c.get("diff_hunk"),
                "commit_oid": c.get("commit_id"),
                "html_url": html_url,
            })

    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    pr_comments_df = pd.DataFrame(rows)
    pr_comments_df.to_csv(outdir / "pr_review_comments.csv", index=False)

    base_date = datetime(2024, 6, 1)
    prs_rows = []
    for idx, meta in enumerate(pr_meta.values()):
        created = base_date + timedelta(days=idx)
        merged = created + timedelta(days=2)
        comments = meta["comment_count"]
        prs_rows.append({
            "org": meta["org"],
            "repo": meta["repo"],
            "pr_number": meta["pr_number"],
            "title": f"Synthetic PR #{meta['pr_number']}",
            "state": "MERGED",
            "createdAt": created.isoformat() + "Z",
            "mergedAt": merged.isoformat() + "Z",
            "closedAt": merged.isoformat() + "Z",
            "isDraft": False,
            "isCrossRepository": False,
            "author": meta["first_author"],
            "additions": comments * 30,
            "deletions": comments * 10,
            "changedFiles": max(1, comments // 3),
            "commits_totalCount": max(1, comments // 4),
            "participants_totalCount": len(meta["commenters"]),
            "closingIssues_count": 0,
            "closingIssues_bug_count": 0,
        })

    pd.DataFrame(prs_rows).to_csv(outdir / "prs.csv", index=False)
    print(f"Wrote {len(pr_comments_df)} review comments and {len(prs_rows)} PR rows -> {outdir}")


if __name__ == "__main__":
    main()
