#!/usr/bin/env python3
import argparse
import json
import os
import random
import re
from pathlib import Path

import pandas as pd
from faker import Faker

COMPANY_DOMAIN = "heliosdrift.dev"
DATA_DIR = Path("medusa_out")
ALIAS_MAP_PATH = DATA_DIR / "alias_map.json"

faker = Faker()
random.seed(42)


def build_handle(name: str, used_handles: set) -> str:
    tokens = re.split(r"\s+", name.strip())
    if len(tokens) >= 2:
        base = (tokens[0][0] + tokens[-1]).lower()
    else:
        base = name.lower().replace(" ", "")[:5]
    base = re.sub(r"[^a-z0-9]", "", base) or "eng"
    handle = f"{base}{random.randint(10,99)}"
    while handle in used_handles:
        handle = f"{base}{random.randint(10,99)}"
    used_handles.add(handle)
    return handle


def main():
    parser = argparse.ArgumentParser(description="Apply alias handles/names to CSV authors")
    parser.add_argument("--data-dir", default=DATA_DIR, help="Directory containing prs.csv and pr_review_comments.csv")
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    prs_path = data_dir / "prs.csv"
    comments_path = data_dir / "pr_review_comments.csv"

    prs = pd.read_csv(prs_path)
    comments = pd.read_csv(comments_path)

    authors = set(prs["author"].dropna().unique()) | set(comments["author"].dropna().unique())
    authors = {a for a in authors if isinstance(a, str) and a.strip()}

    alias_map = {}
    original_to_alias = {}
    used_handles = set()
    used_names = set()

    for orig in sorted(authors):
        name = faker.name()
        while name in used_names:
            name = faker.name()
        used_names.add(name)
        handle = build_handle(name, used_handles)
        alias_entry = {
            "display_name": name,
            "github": handle,
            "email": f"{handle}@{COMPANY_DOMAIN}",
        }
        alias_map[handle] = alias_entry
        original_to_alias[orig] = handle

    def map_author(val):
        if isinstance(val, str) and val in original_to_alias:
            return original_to_alias[val]
        return val

    prs["author"] = prs["author"].apply(map_author)
    comments["author"] = comments["author"].apply(map_author)

    prs.to_csv(prs_path, index=False)
    comments.to_csv(comments_path, index=False)

    payload = {
        "company": "Helios Drift",
        "domain": COMPANY_DOMAIN,
        "aliases": alias_map,
        "original_map": original_to_alias,
    }
    ALIAS_MAP_PATH.write_text(json.dumps(payload, indent=2))
    print(f"Applied aliases to CSVs. Alias map saved to {ALIAS_MAP_PATH}")


if __name__ == "__main__":
    main()
