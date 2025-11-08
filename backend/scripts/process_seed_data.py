"""
Script to process mongo_seed.json and create separate collection files
without _id fields and foreign key references.
"""
import json
from pathlib import Path

# Read the seed data
seed_file = Path(__file__).parent.parent / "fake_data" / "mongo_seed.json"
output_dir = Path(__file__).parent.parent / "fake_data" / "collections"

# Create output directory
output_dir.mkdir(exist_ok=True)

with open(seed_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Process engineers - remove _id, prompt_history, recent_actions
# Keep only fields in schema: name, title, skills, email, github_user, date_hired, 
# pr_count, estimation_accuracy, bug_count, avg_review_time, token_cost, monthly_performance
engineers = []
for eng in data.get("engineers", []):
    engineer = {
        "name": eng.get("name"),
        "title": eng.get("title"),
        "skills": eng.get("skills", []),
        "email": eng.get("email"),
        "github_user": eng.get("github_user"),
        "date_hired": eng.get("date_hired"),
        "pr_count": eng.get("pr_count", 0),
        "estimation_accuracy": eng.get("estimation_accuracy"),
        "bug_count": eng.get("bug_count", 0),
        "avg_review_time": eng.get("avg_review_time"),
        "token_cost": eng.get("token_cost", 0.0),
        "monthly_performance": eng.get("monthly_performance", [])
    }
    engineers.append(engineer)

# Process prompts - remove _id, engineer (will be added later), purpose (not in schema)
# Keep only: model, date, tokens, text
# Note: engineer field is required but we'll add it later via linking script
prompts = []
for prompt in data.get("prompts", []):
    p = {
        "model": prompt.get("model"),
        "date": prompt.get("date"),
        "tokens": prompt.get("tokens"),
        "text": prompt.get("text"),
        "engineer": ""  # Placeholder - will be updated later via linking script
    }
    prompts.append(p)

# Process prospects - remove _id, summary, performance (if not in schema)
# Keep only: name, title, skills, email, github_user, date_applied, pr_count,
# estimation_accuracy, bug_count, avg_review_time, token_cost
prospects = []
for prospect in data.get("prospects", []):
    p = {
        "name": prospect.get("name"),
        "title": prospect.get("title"),
        "skills": prospect.get("skills", []),
        "email": prospect.get("email"),
        "github_user": prospect.get("github_user"),
        "date_applied": prospect.get("date_applied"),
        "pr_count": prospect.get("pr_count", 0),
        "estimation_accuracy": prospect.get("estimation_accuracy"),
        "bug_count": prospect.get("bug_count", 0),
        "avg_review_time": prospect.get("avg_review_time"),
        "token_cost": prospect.get("token_cost", 0.0)
    }
    prospects.append(p)

# Process projects - remove _id, engineers, prospects, tags (not in schema)
# Keep only: importance, target_date, start_date, description, title
projects = []
for project in data.get("projects", []):
    p = {
        "importance": project.get("importance"),
        "target_date": project.get("target_date"),
        "start_date": project.get("start_date"),
        "description": project.get("description"),
        "title": project.get("title")
    }
    projects.append(p)

# Process actions - remove _id, engineer (will be added later), project
# Keep only: title, description, project, date, event
# Note: engineer field is required but we'll add it later via linking script
actions = []
for action in data.get("actions", []):
    a = {
        "title": action.get("title"),
        "description": action.get("description"),
        "project": action.get("project"),  # Keep original project reference (string or null)
        "date": action.get("date"),
        "event": action.get("event"),
        "engineer": ""  # Placeholder - will be updated later via linking script
    }
    actions.append(a)

# Write separate files
with open(output_dir / "engineers.json", 'w', encoding='utf-8') as f:
    json.dump(engineers, f, indent=2, ensure_ascii=False)

with open(output_dir / "prompts.json", 'w', encoding='utf-8') as f:
    json.dump(prompts, f, indent=2, ensure_ascii=False)

with open(output_dir / "prospects.json", 'w', encoding='utf-8') as f:
    json.dump(prospects, f, indent=2, ensure_ascii=False)

with open(output_dir / "projects.json", 'w', encoding='utf-8') as f:
    json.dump(projects, f, indent=2, ensure_ascii=False)

with open(output_dir / "actions.json", 'w', encoding='utf-8') as f:
    json.dump(actions, f, indent=2, ensure_ascii=False)

print(f"✅ Created {len(engineers)} engineers")
print(f"✅ Created {len(prompts)} prompts")
print(f"✅ Created {len(prospects)} prospects")
print(f"✅ Created {len(projects)} projects")
print(f"✅ Created {len(actions)} actions")
print(f"\n📁 Files saved to: {output_dir}")

