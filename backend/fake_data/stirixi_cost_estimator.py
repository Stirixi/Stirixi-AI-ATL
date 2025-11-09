
#!/usr/bin/env python3
"""
Stirixi Cost Estimator (no provider usage needed)

Two modes:
1) heuristic  — derive per-PR agentic costs from PR CSVs (prs.csv, pr_commits.csv, pr_review_comments.csv)
2) trace      — estimate per-call costs from a JSONL agent trace (strings only), with output "thinking" multiplier

Default pricing = Claude Sonnet 4.5:
  - Base tier:      $3.00 / 1M input, $15.00 / 1M output
  - Long-context:   $6.00 / 1M input, $22.50 / 1M output (if a single call's input tokens > 200k)
  - Prompt caching: write $3.75 / 1M, read $0.30 / 1M  (only applied in trace mode when you flag cache parts)

JSONL trace format (one object per line; flexible but recommended fields):
{
  "event": "llm_call",
  "model": "openrouter/polaris-alpha",
  "org": "myorg",
  "repo": "myrepo",
  "pr_number": 123,
  "engineer": "alice",
  "timestamp": "2025-11-08T18:55:00Z",
  "prompt_parts": ["system text...", "user text...", "tool schema JSON..."],
  "assistant_parts": ["assistant text...", {"tool_call": {"name":"search","arguments":{...}}}],
  "cache_write_parts": [],            # strings whose tokens should incur cache WRITE
  "cache_read_parts": [],             # strings whose tokens should incur cache READ
  "extended_thinking": true,          # if true, multiplies visible assistant tokens (see --think-mult)
  "notes": "optional free-form"
}

Heuristic mode (maps PR complexity to 6-step agent loop):
- Steps: plan -> select_tools -> synthesize_diff -> review -> apply_fixes -> summarize
- Token sizes are estimated from PR stats (changed files, additions/deletions, commits, review comments, bugs)
- Tunable via CLI flags (see --help)

Usage examples:
  # Heuristic estimate from GitHub CSVs, priced as Claude Sonnet 4.5
  python stirixi_cost_estimator.py heuristic \
    --indir ./out/openmeter \
    --out ./out/openmeter/heuristic_costs.csv \
    --think-mult 2.0

  # Trace estimate from a JSONL of agent steps
  python stirixi_cost_estimator.py trace \
    --trace ./agent_trace.jsonl \
    --out ./out/trace_costs.csv \
    --think-mult 1.8 \
    --apply-cache  # if your trace includes cache_write_parts/cache_read_parts
"""

import argparse
import json
import os
import math
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Optional, Tuple

import pandas as pd
import numpy as np

# ---- Token & pricing helpers -------------------------------------------------

def approx_tokens(text: str, chars_per_token: float) -> int:
    if not text:
        return 0
    return max(0, int(math.ceil(len(str(text)) / max(1e-6, chars_per_token))))

@dataclass
class Pricing:
    base_input_per_mtok: float = 3.0
    base_output_per_mtok: float = 15.0
    long_input_per_mtok: float = 6.0
    long_output_per_mtok: float = 22.5
    cache_write_per_mtok: float = 3.75
    cache_read_per_mtok: float = 0.30
    threshold_tokens: int = 200_000  # if input tokens in a call exceed this, use long tier

def dollars_for_call(input_tokens: int, output_tokens: int,
                     cache_write_tokens: int, cache_read_tokens: int,
                     pricing: Pricing) -> Tuple[float, str]:
    tier = "base"
    if input_tokens > pricing.threshold_tokens:
        in_rate = pricing.long_input_per_mtok
        out_rate = pricing.long_output_per_mtok
        tier = "long"
    else:
        in_rate = pricing.base_input_per_mtok
        out_rate = pricing.base_output_per_mtok

    def mtok(x): return float(x) / 1_000_000.0
    dollars = (
        mtok(input_tokens) * in_rate +
        mtok(output_tokens) * out_rate +
        mtok(cache_write_tokens) * pricing.cache_write_per_mtok +
        mtok(cache_read_tokens) * pricing.cache_read_per_mtok
    )
    return round(dollars, 6), tier

# ---- TRACE MODE --------------------------------------------------------------

def estimate_from_trace(trace_path: str, out_path: str, think_mult: float,
                        chars_per_token: float, pricing: Pricing, apply_cache: bool):
    rows = []
    totals = {"calls": 0, "input_tokens": 0, "output_tokens": 0, "cache_w": 0, "cache_r": 0, "dollars": 0.0}

    with open(trace_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            rec = json.loads(line)
            if rec.get("event") != "llm_call":
                continue

            org = rec.get("org", "")
            repo = rec.get("repo", "")
            prn = rec.get("pr_number", None)
            eng = rec.get("engineer", "")
            ts = rec.get("timestamp", "")
            model = rec.get("model", "claude-sonnet-4-5")

            # Inputs: prompt parts + tool schemas + tool results injected
            prompt_parts = rec.get("prompt_parts", [])
            input_tokens = sum(approx_tokens(p if isinstance(p, str) else json.dumps(p), chars_per_token) for p in prompt_parts)

            # Outputs (visible): assistant text + tool call JSON
            assistant_parts = rec.get("assistant_parts", [])
            visible_out = sum(approx_tokens(p if isinstance(p, str) else json.dumps(p), chars_per_token) for p in assistant_parts)

            # Extended thinking multiplier (rough)
            output_tokens = int(visible_out * float(think_mult)) if rec.get("extended_thinking", False) else visible_out

            cache_w = 0
            cache_r = 0
            if apply_cache:
                cache_write_parts = rec.get("cache_write_parts", [])
                cache_read_parts = rec.get("cache_read_parts", [])
                cache_w = sum(approx_tokens(p if isinstance(p, str) else json.dumps(p), chars_per_token) for p in cache_write_parts)
                cache_r = sum(approx_tokens(p if isinstance(p, str) else json.dumps(p), chars_per_token) for p in cache_read_parts)

            dollars, tier = dollars_for_call(input_tokens, output_tokens, cache_w, cache_r, pricing)

            rows.append({
                "timestamp": ts, "model": model, "org": org, "repo": repo, "pr_number": prn, "engineer": eng,
                "input_tokens": input_tokens, "output_tokens": output_tokens,
                "cache_write_tokens": cache_w, "cache_read_tokens": cache_r,
                "tier_used": tier, "dollars": dollars
            })
            totals["calls"] += 1
            totals["input_tokens"] += input_tokens
            totals["output_tokens"] += output_tokens
            totals["cache_w"] += cache_w
            totals["cache_r"] += cache_r
            totals["dollars"] += dollars

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    pd.DataFrame(rows).to_csv(out_path, index=False)

    # Rollups
    df = pd.DataFrame(rows)
    if not df.empty:
        by_pr = df.groupby(["org","repo","pr_number"]).agg(
            calls=("model","count"),
            input_tokens=("input_tokens","sum"),
            output_tokens=("output_tokens","sum"),
            dollars=("dollars","sum")
        ).reset_index()
        by_eng = df.groupby(["org","repo","engineer"]).agg(
            calls=("model","count"),
            input_tokens=("input_tokens","sum"),
            output_tokens=("output_tokens","sum"),
            dollars=("dollars","sum")
        ).reset_index()
        base = os.path.splitext(out_path)[0]
        by_pr.to_csv(base + "_by_pr.csv", index=False)
        by_eng.to_csv(base + "_by_engineer.csv", index=False)

    print("TRACE mode done. Calls={}, Est. ${:.6f}".format(totals["calls"], totals["dollars"]))


# ---- HEURISTIC MODE ----------------------------------------------------------

def complexity_score(pr_row, rc_df):
    base = 0.0
    base += 0.5 * float(pr_row.get("commits_totalCount", 0) or 0)
    base += 0.2 * float(pr_row.get("changedFiles", 0) or 0)
    base += 0.001 * ((pr_row.get("additions", 0) or 0) + (pr_row.get("deletions", 0) or 0))
    # review intensity proxy
    rc_count = 0
    if rc_df is not None and not rc_df.empty:
        rc_count = len(rc_df[(rc_df["org"] == pr_row["org"]) & (rc_df["repo"] == pr_row["repo"]) & (rc_df["pr_number"] == pr_row["pr_number"])])
    base += 0.3 * rc_count
    base += 2.0 * float(pr_row.get("closingIssues_bug_count", 0) or 0)
    return max(0.5, min(base, 25.0))

def estimate_steps_tokens(pr_row, rc_df, chars_per_token: float,
                          step_overrides: Dict[str, Tuple[int,int]] = None,
                          think_mult: float = 2.0) -> List[Dict[str, Any]]:
    """
    Returns a list of 6 steps with token estimates:
    Each step dict: {"step": name, "input_tokens": int, "output_tokens": int}
    """
    comp = complexity_score(pr_row, rc_df)
    additions = float(pr_row.get("additions", 0) or 0)
    deletions = float(pr_row.get("deletions", 0) or 0)
    changed = float(pr_row.get("changedFiles", 0) or 0)
    commits = float(pr_row.get("commits_totalCount", 0) or 0)

    # Base sizes scale with complexity and repo stats
    plan_in = int(1800 + 30*changed + 0.02*(additions+deletions) + 100*commits)
    plan_out = int(400 + 20*comp)

    select_in = int(800 + 10*changed)          # tool schemas & brief context
    select_out = 120                            # JSON args

    synth_in = int(3000 + 0.15*(additions+deletions) + 60*changed)
    synth_out = int(1000 + 0.05*(additions+deletions))

    review_in = int(2200 + 0.10*(additions+deletions) + 40*changed)
    review_out = int(700 + 10*comp)

    fixes_in = int(2600 + 0.12*(additions+deletions) + 50*changed)
    fixes_out = int(900 + 0.04*(additions+deletions))

    sum_in = 1200
    sum_out = 500

    steps = [
        ("plan", plan_in, plan_out),
        ("select_tools", select_in, select_out),
        ("synthesize_diff", synth_in, synth_out),
        ("review", review_in, review_out),
        ("apply_fixes", fixes_in, fixes_out),
        ("summarize", sum_in, sum_out),
    ]

    # Apply overrides
    if step_overrides:
        named = {s[0]: [s[1], s[2]] for s in steps}
        for k, (ov_in, ov_out) in step_overrides.items():
            if k in named:
                named[k] = [ov_in, ov_out]
        steps = [(k, named[k][0], named[k][1]) for k in ["plan","select_tools","synthesize_diff","review","apply_fixes","summarize"]]

    # Apply "thinking" multiplier to outputs for realism
    est = []
    for name, IN, OUT in steps:
        est.append({
            "step": name,
            "input_tokens": max(0, int(IN)),
            "output_tokens": max(0, int(OUT * think_mult)),
        })
    return est

def estimate_from_pr_csvs(indir: str, out_path: str, think_mult: float,
                          chars_per_token: float, pricing: Pricing):
    prs = pd.read_csv(os.path.join(indir, "prs.csv"))
    rc_path = os.path.join(indir, "pr_review_comments.csv")
    if os.path.exists(rc_path) and os.path.getsize(rc_path) > 0:
        try:
            rc = pd.read_csv(rc_path)
        except pd.errors.EmptyDataError:
            rc = pd.DataFrame(columns=["org","repo","pr_number","path"])
    else:
        rc = pd.DataFrame(columns=["org","repo","pr_number","path"])

    rows = []
    for _, pr in prs.iterrows():
        steps = estimate_steps_tokens(pr, rc, chars_per_token, think_mult=think_mult)
        for s in steps:
            dollars, tier = dollars_for_call(
                input_tokens=s["input_tokens"],
                output_tokens=s["output_tokens"],
                cache_write_tokens=0,
                cache_read_tokens=0,
                pricing=pricing
            )
            rows.append({
                "org": pr["org"], "repo": pr["repo"], "pr_number": int(pr["pr_number"]), "step": s["step"],
                "input_tokens": s["input_tokens"], "output_tokens": s["output_tokens"],
                "tier_used": tier, "dollars": dollars
            })

    df = pd.DataFrame(rows)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    df.to_csv(out_path, index=False)

    # Rollups
    if not df.empty:
        by_pr = df.groupby(["org","repo","pr_number"]).agg(
            calls=("step","count"),
            input_tokens=("input_tokens","sum"),
            output_tokens=("output_tokens","sum"),
            dollars=("dollars","sum")
        ).reset_index()
        base = os.path.splitext(out_path)[0]
        by_pr.to_csv(base + "_by_pr.csv", index=False)

        # Optional per-engineer join if author exists
        if "author" in prs.columns:
            by_pr = by_pr.merge(prs[["org","repo","pr_number","author"]], on=["org","repo","pr_number"], how="left")
            by_eng = by_pr.groupby(["org","repo","author"]).agg(
                prs=("pr_number","count"),
                dollars=("dollars","sum")
            ).reset_index().rename(columns={"author":"engineer"})
            by_eng.to_csv(base + "_by_engineer.csv", index=False)

    print("HEURISTIC mode done. PRs={}, est. rows={}".format(len(prs), len(rows)))


# ---- CLI ---------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="Stirixi Cost Estimator (heuristic or trace modes).")
    sub = ap.add_subparsers(dest="mode", required=True)

    # shared pricing args
    def add_pricing_args(parser):
        parser.add_argument("--base-in", type=float, default=3.0, help="$/M input tokens (base tier)")
        parser.add_argument("--base-out", type=float, default=15.0, help="$/M output tokens (base tier)")
        parser.add_argument("--long-in", type=float, default=6.0, help="$/M input tokens (long tier)")
        parser.add_argument("--long-out", type=float, default=22.5, help="$/M output tokens (long tier)")
        parser.add_argument("--cache-write", type=float, default=3.75, help="$/M cache write tokens")
        parser.add_argument("--cache-read", type=float, default=0.30, help="$/M cache read tokens")
        parser.add_argument("--long-threshold", type=int, default=200000, help="Input token threshold for long tier")
        parser.add_argument("--chars-per-token", type=float, default=4.0, help="Characters per token approximation")
        parser.add_argument("--think-mult", type=float, default=2.0, help="Multiplier applied to visible assistant tokens for extended thinking")

    # heuristic
    ph = sub.add_parser("heuristic", help="Estimate from GitHub CSVs (prs.csv, pr_review_comments.csv, pr_commits.csv).")
    ph.add_argument("--indir", required=True, help="Directory containing CSVs from stirixi_extract.py")
    ph.add_argument("--out", required=True, help="Output CSV path for per-step estimates")
    add_pricing_args(ph)

    # trace
    pt = sub.add_parser("trace", help="Estimate from a JSONL agent trace (no provider usage).")
    pt.add_argument("--trace", required=True, help="Path to agent_trace.jsonl")
    pt.add_argument("--out", required=True, help="Output CSV path for per-call estimates")
    pt.add_argument("--apply-cache", action="store_true", help="Apply cache pricing to cache_write_parts/read_parts if present in trace")
    add_pricing_args(pt)

    args = ap.parse_args()

    pricing = Pricing(
        base_input_per_mtok=args.base_in,
        base_output_per_mtok=args.base_out,
        long_input_per_mtok=args.long_in,
        long_output_per_mtok=args.long_out,
        cache_write_per_mtok=args.cache_write,
        cache_read_per_mtok=args.cache_read,
        threshold_tokens=args.long_threshold,
    )

    if args.mode == "heuristic":
        estimate_from_pr_csvs(args.indir, args.out, args.think_mult, args.chars_per_token, pricing)
    else:
        estimate_from_trace(args.trace, args.out, args.think_mult, args.chars_per_token, pricing, args.apply_cache)

if __name__ == "__main__":
    main()
