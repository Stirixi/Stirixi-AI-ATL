#!/usr/bin/env python3
import json
import os
import random
import re
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Dict, List

import numpy as np
import pandas as pd
import requests
from dotenv import load_dotenv
from faker import Faker

random.seed(42)
np.random.seed(42)
faker = Faker()

DATA_DIR = Path("medusa_out")

PRS_PATH = DATA_DIR / "prs.csv"
COMMENTS_PATH = DATA_DIR / "pr_review_comments.csv"
COSTS_ENGINEER_PATH = DATA_DIR / "heuristic_costs_by_engineer.csv"
COSTS_STEPS_PATH = DATA_DIR / "heuristic_costs.csv"
COSTS_PR_PATH = DATA_DIR / "heuristic_costs_by_pr.csv"
ALIAS_MAP_PATH = DATA_DIR / "alias_map.json"

OUTPUT_PATH = DATA_DIR / "mongo_seed.json"

PROMPTS_PER_ENGINEER = 3  # kept for reference; prompts now generated per PR
ACTIONS_PER_ENGINEER = 4

START_DATE = datetime(2024, 6, 1)

COMPANY_NAME = "Helios Drift"
COMPANY_DOMAIN = "heliosdrift.dev"
DISPLAY_REPO = "heliosdrift/commerce-platform"

TITLE_POOL = [
    "Senior Platform Engineer",
    "Lead Commerce Engineer",
    "Staff TypeScript Developer",
    "Senior Fullstack Engineer",
    "Payments Specialist",
    "Developer Experience Engineer",
]

SKILL_BANK = [
    "TypeScript",
    "Node.js",
    "React",
    "NestJS",
    "Event Sourcing",
    "PostgreSQL",
    "Redis",
    "Kafka",
    "GraphQL",
    "WebSockets",
]

IMPORTANCE_LEVELS = ["critical", "high", "medium", "exploratory"]

ACTION_EVENTS = ["pr_opened", "review", "bug_fix", "deployment", "incident"]

CONCERNS = [
    "race conditions around inventory locking",
    "performance regressions for large catalogs",
    "breaking API shape changes for plugins",
    "missing regression tests for returns",
    "leaking PII via verbose logging",
    "migration rollout safety for cart schema",
    "retry logic around payment providers",
]

DELIVERABLES = [
    "merge checklist",
    "risk assessment",
    "test plan",
    "deployment notes",
    "rollback strategy",
    "code review summary",
    "QA handoff doc",
]


def load_data():
    prs = pd.read_csv(PRS_PATH, parse_dates=["createdAt", "mergedAt", "closedAt"], infer_datetime_format=True)
    comments = pd.read_csv(COMMENTS_PATH)
    costs_eng = pd.read_csv(COSTS_ENGINEER_PATH)
    costs_steps = pd.read_csv(COSTS_STEPS_PATH)
    costs_pr = pd.read_csv(COSTS_PR_PATH)
    return prs, comments, costs_eng, costs_steps, costs_pr


def scrub_company(text: str) -> str:
    if not isinstance(text, str):
        return text
    return text.replace("Medusa", COMPANY_NAME).replace("medusa", COMPANY_NAME.lower())


def load_alias_map() -> Dict[str, Dict[str, str]]:
    if ALIAS_MAP_PATH.exists():
        payload = json.loads(ALIAS_MAP_PATH.read_text())
        aliases = payload.get("aliases") or {}
        return aliases
    raise RuntimeError("alias_map.json not found. Run apply_aliases.py before generate_medusa_dataset.py.")


def normalize_values(values: List[float], invert: bool = False) -> List[float]:
    arr = np.array(values, dtype=float)
    mask = np.isfinite(arr)
    if mask.sum() <= 1:
        norm = np.full_like(arr, 0.5, dtype=float)
    else:
        minv = arr[mask].min()
        maxv = arr[mask].max()
        denom = max(maxv - minv, 1e-6)
        norm = np.zeros_like(arr, dtype=float)
        norm[mask] = (arr[mask] - minv) / denom
        norm[~mask] = 0.5
    if invert:
        norm = 1.0 - norm
    return norm.tolist()


def slug_to_name(slug: str) -> str:
    if not isinstance(slug, str):
        return "Unknown Engineer"
    parts = slug.replace("_", "-").split("-")
    return " ".join(p.capitalize() for p in parts if p)


def random_date(start_year=2019, end_year=2023) -> str:
    start = date(start_year, 1, 1)
    end = date(end_year, 12, 31)
    delta = end - start
    chosen = start + timedelta(days=random.randint(0, delta.days))
    return chosen.isoformat()


def gen_object_id() -> str:
    return os.urandom(12).hex()


def compute_pr_comment_stats(comments: pd.DataFrame):
    comment_counts = comments.groupby("pr_number").size().to_dict()
    bug_flags = {}
    for pr_number, group in comments.groupby("pr_number"):
        text = " ".join(group["body"].dropna().astype(str)).lower()
        bug_flags[pr_number] = int(any(word in text for word in ["bug", "regression", "crash", "fix"]))
    return comment_counts, bug_flags


def compute_pr_modules(prs: pd.DataFrame, comments: pd.DataFrame) -> Dict[int, str]:
    modules = {}
    comment_groups = comments.groupby("pr_number")
    for _, pr_row in prs.iterrows():
        pr_number = pr_row["pr_number"]
        if pr_number in comment_groups.groups:
            paths = comment_groups.get_group(pr_number)["path"].dropna().tolist()
        else:
            paths = []
        module_counts = Counter()
        for path in paths:
            parts = str(path).split("/")
            if len(parts) >= 2:
                module_counts["/".join(parts[:2])] += 1
            elif parts:
                module_counts[parts[0]] += 1
        module = module_counts.most_common(1)[0][0] if module_counts else "packages/core"
        modules[pr_number] = module
    return modules


def summarise_modules(comments: pd.DataFrame) -> str:
    paths = comments["path"].dropna()
    counter = Counter()
    for p in paths:
        parts = p.split("/")
        if len(parts) >= 2:
            counter['/'.join(parts[:2])] += 1
    lines = []
    for module, count in counter.most_common(12):
        lines.append(f"{module}: {count} review comments")
    return "\n".join(lines)


def compute_engineer_metrics(prs: pd.DataFrame, pr_comment_counts: Dict[int, int],
                             pr_bug_flags: Dict[int, int], costs_pr_map: Dict[int, Dict[str, float]]):
    metrics = {}
    authors = [a for a in prs["author"].dropna().unique() if isinstance(a, str)]
    pr_counts, avg_comments_list, bug_rates, avg_tokens = [], [], [], []

    for author in authors:
        pr_numbers = prs.loc[prs["author"] == author, "pr_number"].tolist()
        if not pr_numbers:
            continue
        pr_count = len(pr_numbers)
        avg_comments = float(np.mean([pr_comment_counts.get(p, 0) for p in pr_numbers]))
        bug_rate = float(np.mean([pr_bug_flags.get(p, 0) for p in pr_numbers]))
        token_values = []
        for p in pr_numbers:
            token_entry = costs_pr_map.get(p)
            if token_entry:
                token_values.append(token_entry["input_tokens"] + token_entry["output_tokens"])
        avg_token = float(np.mean(token_values)) if token_values else random.uniform(6000, 11000)

        pr_counts.append(pr_count)
        avg_comments_list.append(avg_comments)
        bug_rates.append(bug_rate)
        avg_tokens.append(avg_token)

        metrics[author] = {
            "pr_numbers": pr_numbers,
            "avg_comments": avg_comments,
            "bug_rate": bug_rate,
            "avg_tokens": avg_token,
        }

    if not metrics:
        return metrics

    pr_norm = normalize_values(pr_counts)
    review_norm = normalize_values(avg_comments_list, invert=True)
    bug_norm = normalize_values(bug_rates, invert=True)
    token_norm = normalize_values(avg_tokens, invert=True)

    for idx, author in enumerate(metrics.keys()):
        performance = (0.35 * pr_norm[idx] +
                       0.25 * review_norm[idx] +
                       0.20 * bug_norm[idx] +
                       0.20 * token_norm[idx])
        performance_score = round(performance * 10.0, 2)
        monthly = [round(np.clip(random.gauss(performance_score, 0.6), 3.0, 10.0), 2) for _ in range(6)]
        metrics[author]["performance_score"] = performance_score
        metrics[author]["monthly"] = monthly
        metrics[author]["avg_review_time"] = round(10 + metrics[author]["avg_comments"] * 1.8, 2)
        metrics[author]["bug_count"] = int(metrics[author]["bug_rate"] * len(metrics[author]["pr_numbers"]))
    return metrics


def compute_prospect_performance(prospects: List[dict]):
    if not prospects:
        return
    pr_counts = [p["pr_count"] for p in prospects]
    est_acc = [p["estimation_accuracy"] for p in prospects]
    bug_counts = [p["bug_count"] for p in prospects]
    review_times = [p["avg_review_time"] for p in prospects]
    token_costs = [p["token_cost"] for p in prospects]

    pr_norm = normalize_values(pr_counts)
    est_norm = normalize_values(est_acc)
    bug_norm = normalize_values(bug_counts, invert=True)
    review_norm = normalize_values(review_times, invert=True)
    token_norm = normalize_values(token_costs, invert=True)

    for idx, prospect in enumerate(prospects):
        performance = (
            0.30 * pr_norm[idx] +
            0.25 * est_norm[idx] +
            0.20 * bug_norm[idx] +
            0.15 * review_norm[idx] +
            0.10 * token_norm[idx]
        )
        prospect["performance"] = round(performance * 10.0, 2)


def call_openrouter(summary_text: str) -> dict:
    load_dotenv(dotenv_path=".env")
    api_key = os.getenv("OPENROUTER_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_KEY missing in environment")

    system_prompt = (
        "You are a data synthesizer helping populate a developer analytics dataset. "
        "Return thoughtful JSON snippets tailored to the provided repository summary."
    )
    user_prompt = f"""
Repository: {DISPLAY_REPO}
Stats:
- PR count: 495
- Review comments: 6239
Top modules:
{summary_text}

Return JSON with keys exactly:
{{
  "projects": [
    {{"title": str, "description": str, "importance": "critical|high|medium|exploratory", "tags": [str] }} (4 items)
  ],
  "prompt_templates": [
    {{
      "name": str,
      "purpose": str,
      "model": "openrouter/polaris-alpha",
      "examples": [
        "can you draft {{style}} for pr {{pr_number}} touching {{files}}? i'm worried about {{concern}}. latest review note: {{comment_summary}}. deliverable: {{deliverable}}.",
        "need {{style}} for pr {{pr_number}} across {{files}}; focus on {{concern}}. note: {{comment_summary}}. deliverable: {{deliverable}}."
      ]
    }} (4 items)
  ],
  "action_templates": [
    {{"event": "pr_opened|review|bug_fix|deployment|incident", "title": str, "description": str }} (5 items)
  ],
  "prospect_profiles": [
    {{"name": str, "title": str, "skills": [str], "summary": str }} (5 items)
  ]
}}

Rules:
- Prompt examples must read like real engineer-to-agent asks. Include placeholders {{pr_number}}, {{files}}, {{concern}}, {{deliverable}}, {{comment_summary}}, and optionally {{style}} exactly as written for later substitution.
- Keep each string under 220 characters.
- Stay in Medusa commerce/platform context.
- Return valid JSON only.
"""
    payload = {
        "model": "openrouter/polaris-alpha",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=120)
    response.raise_for_status()
    data = response.json()
    content = data["choices"][0]["message"]["content"]
    return json.loads(content)


def build_engineers(prs: pd.DataFrame, comments: pd.DataFrame, costs_eng: pd.DataFrame,
                    alias_map: Dict[str, Dict[str, str]], engineer_metrics: Dict[str, dict]):
    prs_authors = prs.dropna(subset=["author"])
    authors = prs_authors['author'].unique().tolist()

    cost_map = {}
    if not costs_eng.empty:
        cost_map = {
            row["engineer"]: float(row["dollars"])
            for _, row in costs_eng.iterrows()
        }

    engineers = []
    engineer_id_map = {}

    for author in authors:
        metrics = engineer_metrics.get(author)
        if not metrics:
            continue
        pr_numbers = metrics["pr_numbers"]
        bug_count = metrics["bug_count"]
        avg_review_time = metrics["avg_review_time"]
        performance_score = metrics["performance_score"]
        monthly_perf = metrics["monthly"]
        estimation_accuracy = round(np.clip(0.6 + performance_score / 20.0, 0.65, 0.99), 2)
        avg_tokens = metrics["avg_tokens"]
        token_cost = round(cost_map.get(author, avg_tokens / 1000.0), 3)

        eng_id = gen_object_id()
        engineer_id_map[author] = eng_id

        alias_entry = alias_map.get(author) or {}
        display_name = alias_entry.get("display_name") or alias_entry.get("name") or slug_to_name(author)
        github_handle = alias_entry.get("github") or (author if isinstance(author, str) else f"engineer{len(engineers)}")
        email = alias_entry.get("email") or f"{github_handle}@{COMPANY_DOMAIN}"

        engineers.append({
            "_id": eng_id,
            "name": display_name,
            "title": random.choice(TITLE_POOL),
            "skills": random.sample(SKILL_BANK, k=3),
            "email": email,
            "github_user": github_handle,
            "date_hired": random_date(),
            "pr_count": int(len(pr_numbers)),
            "estimation_accuracy": estimation_accuracy,
            "bug_count": int(bug_count),
            "avg_review_time": avg_review_time,
            "token_cost": token_cost,
            "performance_score": performance_score,
            "prompt_history": [],
            "monthly_performance": monthly_perf,
            "recent_actions": [],
        })

    return engineers, engineer_id_map


def derive_pr_context(pr_number: int, comments_df: pd.DataFrame) -> Dict[str, str]:
    pr_comments = comments_df[comments_df["pr_number"] == pr_number]
    paths = pr_comments["path"].dropna().tolist()
    top_paths = Counter()
    for p in paths:
        parts = p.split("/")
        if len(parts) >= 2:
            top_paths["/".join(parts[:2])] += 1
        elif parts:
            top_paths[parts[0]] += 1
    files_text = ", ".join(k for k, _ in top_paths.most_common(2)) if top_paths else "packages/medusa-core"
    comment_snippet = pr_comments["body"].dropna().head(1).str.slice(0, 120).tolist()
    comment_summary = comment_snippet[0] if comment_snippet else "no major review comments yet"
    concern = random.choice(CONCERNS)
    deliverable = random.choice(DELIVERABLES)
    return {
        "files": files_text,
        "comment_summary": comment_summary,
        "concern": concern,
        "deliverable": deliverable,
    }


def build_prompts(prs: pd.DataFrame, comments: pd.DataFrame, costs_pr_map: Dict[int, Dict[str, float]],
                  engineer_id_map: Dict[str, str], prompt_templates: List[dict]):
    prompt_rows = []

    template_cycle = prompt_templates if prompt_templates else [
        {
            "name": "plan",
            "purpose": "planning",
            "model": "openrouter/polaris-alpha",
            "examples": [
                "can you outline code review for pr {pr_number} touching {files}? i'm worried about {concern}. latest note: {comment_summary}. deliverable: {deliverable}."
            ],
        }
    ]

    for _, pr_row in prs.iterrows():
        author = pr_row.get("author")
        if not author or author not in engineer_id_map:
            continue
        template = random.choice(template_cycle)
        examples = template.get("examples") or [template.get("text", "")]
        base = random.choice(examples)
        pr_number = pr_row["pr_number"]
        context = derive_pr_context(pr_number, comments)
        text = (
            base
            .replace("{pr_number}", str(pr_number))
            .replace("{files}", context["files"])
            .replace("{concern}", context["concern"])
            .replace("{deliverable}", context["deliverable"])
            .replace("{comment_summary}", context["comment_summary"])
            .replace("{style}", template.get("purpose", "code review summary"))
        )
        text = text.replace("Polaris,", "").replace("polaris,", "").strip()
        text = text.lower()
        tokens_entry = costs_pr_map.get(pr_number)
        if tokens_entry:
            in_tokens = int(tokens_entry["input_tokens"])
            out_tokens = int(tokens_entry["output_tokens"])
        else:
            in_tokens = random.randint(6000, 12000)
            out_tokens = random.randint(3000, 8000)
        prompt_id = gen_object_id()
        prompt_rows.append({
            "_id": prompt_id,
            "model": template.get("model", "openrouter/polaris-alpha"),
            "date": datetime.utcnow().isoformat() + "Z",
            "tokens": int(in_tokens + out_tokens),
            "text": text,
            "engineer": engineer_id_map[author],
            "purpose": template.get("purpose"),
        })
    return prompt_rows


def build_actions(prs: pd.DataFrame, comments: pd.DataFrame, engineer_id_map: Dict[str, str],
                  action_templates: List[dict], pr_project_map: Dict[int, str]):
    actions = []

    tmpl_cycle = action_templates if action_templates else [
        {"event": "pr_opened", "title": "Opened PR {pr_number}", "description": "authored new PR"},
        {"event": "review", "title": "Left review on PR {pr_number}", "description": "added review comment"},
    ]

    for author, eng_id in engineer_id_map.items():
        eng_prs = prs[prs['author'] == author].sort_values('createdAt').head(ACTIONS_PER_ENGINEER)
        for _, pr_row in eng_prs.iterrows():
            tmpl = random.choice(tmpl_cycle)
            pr_number = pr_row["pr_number"]
            actions.append({
                "_id": gen_object_id(),
                "title": tmpl['title'].replace('{pr_number}', str(pr_row['pr_number'])),
                "description": tmpl['description'].replace('{pr_number}', str(pr_row['pr_number'])),
                "project": pr_project_map.get(pr_number),
                "date": (pr_row['createdAt'] + timedelta(hours=random.randint(1, 12))).isoformat(),
                "engineer": eng_id,
                "event": tmpl['event'],
            })
        # add review comment action if reviewer also commenting
        reviewer_rows = comments[comments['author'] == author].head(1)
        for _, rv in reviewer_rows.iterrows():
            actions.append({
                "_id": gen_object_id(),
                "title": f"Reviewed PR {int(rv['pr_number'])}",
                "description": "Posted critical review comment",
                "project": pr_project_map.get(int(rv["pr_number"])),
                "date": datetime.utcnow().isoformat() + "Z",
                "engineer": eng_id,
                "event": "review",
            })
    return actions


def build_projects(project_templates: List[dict], engineer_id_map: Dict[str, str],
                   pr_modules: Dict[int, str]) -> (List[dict], Dict[int, str]):
    engineer_ids = list(engineer_id_map.values())
    projects = []
    for tmpl in project_templates[:4]:
        proj_id = gen_object_id()
        assigned = random.sample(engineer_ids, k=min(5, len(engineer_ids))) if engineer_ids else []
        projects.append({
            "_id": proj_id,
            "engineers": assigned,
            "importance": tmpl.get("importance", random.choice(IMPORTANCE_LEVELS)),
            "prospects": [],
            "target_date": (date.today() + timedelta(days=random.randint(45, 160))).isoformat(),
            "start_date": (date.today() - timedelta(days=random.randint(5, 40))).isoformat(),
            "description": tmpl.get("description"),
            "title": tmpl.get("title"),
            "tags": tmpl.get("tags", []),
        })

    project_ids = [p["_id"] for p in projects] or [gen_object_id()]
    module_counts = Counter(pr_modules.values())
    ordered_modules = [m for m, _ in module_counts.most_common()] or ["packages/core"]
    module_to_project = {}
    for idx, module in enumerate(ordered_modules):
        module_to_project[module] = project_ids[idx % len(project_ids)]

    pr_project_map = {}
    for pr_number, module in pr_modules.items():
        pr_project_map[pr_number] = module_to_project.get(module, project_ids[0])

    return projects, pr_project_map


def build_prospects(prospect_profiles: List[dict]) -> List[dict]:
    prospects = []
    for profile in prospect_profiles[:5]:
        prospects.append({
            "_id": gen_object_id(),
            "name": profile.get("name"),
            "title": profile.get("title"),
            "skills": profile.get("skills", [])[:5],
            "email": profile.get("name", "candidate").lower().replace(" ", ".") + "@talentpool.dev",
            "github_user": profile.get("name", "candidate").lower().replace(" ", ""),
            "date_applied": (date.today() - timedelta(days=random.randint(10, 120))).isoformat(),
            "pr_count": random.randint(5, 40),
            "estimation_accuracy": round(random.uniform(0.55, 0.9), 2),
            "bug_count": random.randint(0, 5),
            "avg_review_time": round(random.uniform(12, 58), 1),
            "token_cost": round(random.uniform(20, 120), 2),
            "summary": profile.get("summary"),
        })
    return prospects


def assign_prospects_to_projects(prospects: List[dict], projects: List[dict]):
    if not projects or not prospects:
        return
    project_lookup = {p["_id"]: p for p in projects}
    for project in projects:
        project["prospects"] = []
    project_ids = list(project_lookup.keys())
    for prospect in prospects:
        k = min(len(project_ids), random.randint(1, 2))
        chosen = random.sample(project_ids, k=k) if project_ids else []
        prospect["projects"] = chosen
        for pid in chosen:
            project_lookup[pid]["prospects"].append(prospect["_id"])


def attach_ids(engineers: List[dict], prompts: List[dict], actions: List[dict]):
    # map prompt ids to engineers
    prompts_by_eng = defaultdict(list)
    for prompt in prompts:
        prompts_by_eng[prompt['engineer']].append(prompt['_id'])
    actions_by_eng = defaultdict(list)
    for action in actions:
        actions_by_eng[action['engineer']].append(action['_id'])
    for eng in engineers:
        eng_id = eng['_id']
        eng['prompt_history'] = prompts_by_eng.get(eng_id, [])
        eng['recent_actions'] = actions_by_eng.get(eng_id, [])[:5]


def main():
    prs, comments, costs_eng, costs_steps, costs_pr = load_data()
    alias_map = load_alias_map()

    costs_pr_map = {
        int(row["pr_number"]): {
            "input_tokens": float(row["input_tokens"]),
            "output_tokens": float(row["output_tokens"]),
            "dollars": float(row["dollars"]),
        }
        for _, row in costs_pr.iterrows()
    }

    pr_comment_counts, pr_bug_flags = compute_pr_comment_stats(comments)
    pr_modules = compute_pr_modules(prs, comments)
    engineer_metrics = compute_engineer_metrics(prs, pr_comment_counts, pr_bug_flags, costs_pr_map)

    summary_text = summarise_modules(comments)
    template_payload = call_openrouter(summary_text)
    for project in template_payload.get("projects", []):
        project["title"] = scrub_company(project.get("title", ""))
        project["description"] = scrub_company(project.get("description", ""))
        project["tags"] = [scrub_company(tag) for tag in project.get("tags", [])]
        project["importance"] = project.get("importance", "high")
    for tmpl in template_payload.get("prompt_templates", []):
        tmpl["name"] = scrub_company(tmpl.get("name", ""))
        tmpl["purpose"] = scrub_company(tmpl.get("purpose", ""))
        tmpl["examples"] = [scrub_company(ex) for ex in tmpl.get("examples", [])]
    for tmpl in template_payload.get("action_templates", []):
        tmpl["title"] = scrub_company(tmpl.get("title", ""))
        tmpl["description"] = scrub_company(tmpl.get("description", ""))
    for profile in template_payload.get("prospect_profiles", []):
        profile["name"] = scrub_company(profile.get("name", ""))
        profile["title"] = scrub_company(profile.get("title", ""))
        profile["skills"] = [scrub_company(skill) for skill in profile.get("skills", [])]
        profile["summary"] = scrub_company(profile.get("summary", ""))

    engineers, engineer_id_map = build_engineers(prs, comments, costs_eng, alias_map, engineer_metrics)
    prompts = build_prompts(prs, comments, costs_pr_map, engineer_id_map, template_payload.get('prompt_templates', []))

    projects, pr_project_map = build_projects(template_payload.get('projects', []), engineer_id_map, pr_modules)
    actions = build_actions(prs, comments, engineer_id_map, template_payload.get('action_templates', []), pr_project_map)
    prospects = build_prospects(template_payload.get('prospect_profiles', []))
    compute_prospect_performance(prospects)
    assign_prospects_to_projects(prospects, projects)

    attach_ids(engineers, prompts, actions)

    dataset = {
        "engineers": engineers,
        "prompts": prompts,
        "projects": projects,
        "prospects": prospects,
        "actions": actions,
    }

    OUTPUT_PATH.write_text(json.dumps(dataset, indent=2))
    print(f"Dataset written to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
faker = Faker()
