"""
Script to automatically link all ObjectId references in MongoDB collections.
Run this after importing the seed data to establish relationships.

This script will:
1. Link prompts to engineers (based on original engineer field in seed data)
2. Link actions to engineers and projects (based on original references)
3. Link projects to engineers and prospects (based on original references)
4. Update engineers with prompt_history and recent_actions arrays
"""
import asyncio
import sys
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# Add parent directory to path so we can import app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings

# Mapping of names to ObjectIds
engineer_map = {}
prospect_map = {}
project_map = {}
db = None


async def create_mappings():
    """Create mappings of names to ObjectIds for all collections"""
    global db
    print("📋 Creating mappings...\n")
    
    # Map engineers: name -> ObjectId
    engineers = await db.engineers.find({}).to_list(length=1000)
    for eng in engineers:
        engineer_map[eng["name"]] = eng["_id"]
    print(f"✅ Mapped {len(engineer_map)} engineers")
    
    # Map prospects: name -> ObjectId
    prospects = await db.prospects.find({}).to_list(length=1000)
    for prospect in prospects:
        prospect_map[prospect["name"]] = prospect["_id"]
    print(f"✅ Mapped {len(prospect_map)} prospects")
    
    # Map projects: title -> ObjectId
    projects = await db.projects.find({}).to_list(length=1000)
    for project in projects:
        project_map[project["title"]] = project["_id"]
    print(f"✅ Mapped {len(project_map)} projects")
    print()


async def link_prompts_to_engineers():
    """Link prompts to engineers based on original engineer field in seed data"""
    global db
    print("🔗 Linking prompts to engineers...")
    
    # Read the original seed data to get engineer mappings
    seed_file = Path(__file__).parent.parent / "fake_data" / "mongo_seed.json"
    import json
    with open(seed_file, 'r', encoding='utf-8') as f:
        seed_data = json.load(f)
    
    # Create mapping of original engineer _id to name
    original_engineer_id_to_name = {}
    for eng in seed_data.get("engineers", []):
        original_engineer_id_to_name[eng.get("_id")] = eng.get("name")
    
    # Get all prompts from database
    prompts = await db.prompts.find({"engineer": ""}).to_list(length=10000)
    
    # Get original prompt data to find engineer references
    original_prompts = seed_data.get("prompts", [])
    prompt_engineer_map = {}
    for orig_prompt in original_prompts:
        prompt_text = orig_prompt.get("text", "")
        engineer_id = orig_prompt.get("engineer", "")
        if engineer_id and engineer_id in original_engineer_id_to_name:
            engineer_name = original_engineer_id_to_name[engineer_id]
            prompt_engineer_map[prompt_text] = engineer_name
    
    # Update prompts with engineer ObjectIds
    updated_count = 0
    for prompt in prompts:
        prompt_text = prompt.get("text", "")
        engineer_name = prompt_engineer_map.get(prompt_text)
        
        if engineer_name and engineer_name in engineer_map:
            engineer_id = engineer_map[engineer_name]
            await db.prompts.update_one(
                {"_id": prompt["_id"]},
                {"$set": {"engineer": engineer_id}}
            )
            updated_count += 1
    
    print(f"✅ Linked {updated_count} prompts to engineers")
    
    # Update engineers' prompt_history arrays
    for engineer_name, engineer_id in engineer_map.items():
        prompt_ids = await db.prompts.find(
            {"engineer": engineer_id},
            {"_id": 1}
        ).to_list(length=10000)
        
        prompt_object_ids = [p["_id"] for p in prompt_ids]
        if prompt_object_ids:
            await db.engineers.update_one(
                {"_id": engineer_id},
                {"$set": {"prompt_history": prompt_object_ids}}
            )
    
    print(f"✅ Updated engineers' prompt_history arrays")
    print()


async def link_actions_to_engineers_and_projects():
    """Link actions to engineers and projects based on original references"""
    global db
    print("🔗 Linking actions to engineers and projects...")
    
    # Read the original seed data
    seed_file = Path(__file__).parent.parent / "fake_data" / "mongo_seed.json"
    import json
    with open(seed_file, 'r', encoding='utf-8') as f:
        seed_data = json.load(f)
    
    # Create mapping of original engineer _id to name
    original_engineer_id_to_name = {}
    for eng in seed_data.get("engineers", []):
        original_engineer_id_to_name[eng.get("_id")] = eng.get("name")
    
    # Create mapping of original project _id to title
    original_project_id_to_title = {}
    for proj in seed_data.get("projects", []):
        original_project_id_to_title[proj.get("_id")] = proj.get("title")
    
    # Get all actions from database
    actions = await db.actions.find({"engineer": ""}).to_list(length=10000)
    
    # Get original action data
    original_actions = seed_data.get("actions", [])
    action_mapping = {}
    for orig_action in original_actions:
        action_title = orig_action.get("title", "")
        engineer_id = orig_action.get("engineer", "")
        project_id = orig_action.get("project")
        
        engineer_name = None
        if engineer_id and engineer_id in original_engineer_id_to_name:
            engineer_name = original_engineer_id_to_name[engineer_id]
        
        project_title = None
        if project_id and project_id in original_project_id_to_title:
            project_title = original_project_id_to_title[project_id]
        
        action_mapping[action_title] = {
            "engineer": engineer_name,
            "project": project_title
        }
    
    # Update actions with engineer and project ObjectIds
    updated_count = 0
    for action in actions:
        action_title = action.get("title", "")
        mapping = action_mapping.get(action_title, {})
        
        updates = {}
        
        # Link engineer
        engineer_name = mapping.get("engineer")
        if engineer_name and engineer_name in engineer_map:
            updates["engineer"] = engineer_map[engineer_name]
        
        # Link project
        project_title = mapping.get("project")
        if project_title and project_title in project_map:
            updates["project"] = str(project_map[project_title])
        
        if updates:
            await db.actions.update_one(
                {"_id": action["_id"]},
                {"$set": updates}
            )
            updated_count += 1
    
    print(f"✅ Linked {updated_count} actions to engineers and projects")
    
    # Update engineers' recent_actions arrays
    for engineer_name, engineer_id in engineer_map.items():
        # Get recent actions for this engineer (last 50 by date)
        action_ids = await db.actions.find(
            {"engineer": engineer_id}
        ).sort("date", -1).limit(50).to_list(length=50)
        
        action_object_ids = [a["_id"] for a in action_ids]
        if action_object_ids:
            await db.engineers.update_one(
                {"_id": engineer_id},
                {"$set": {"recent_actions": action_object_ids}}
            )
    
    print(f"✅ Updated engineers' recent_actions arrays")
    print()


async def link_projects_to_engineers_and_prospects():
    """Link projects to engineers and prospects based on original references"""
    global db
    print("🔗 Linking projects to engineers and prospects...")
    
    # Read the original seed data
    seed_file = Path(__file__).parent.parent / "fake_data" / "mongo_seed.json"
    import json
    with open(seed_file, 'r', encoding='utf-8') as f:
        seed_data = json.load(f)
    
    # Create mapping of original engineer _id to name
    original_engineer_id_to_name = {}
    for eng in seed_data.get("engineers", []):
        original_engineer_id_to_name[eng.get("_id")] = eng.get("name")
    
    # Create mapping of original prospect _id to name
    original_prospect_id_to_name = {}
    for prospect in seed_data.get("prospects", []):
        original_prospect_id_to_name[prospect.get("_id")] = prospect.get("name")
    
    # Get all projects from database
    projects = await db.projects.find({}).to_list(length=1000)
    
    # Get original project data
    original_projects = seed_data.get("projects", [])
    project_mapping = {}
    for orig_project in original_projects:
        project_title = orig_project.get("title", "")
        engineer_ids = orig_project.get("engineers", [])
        prospect_ids = orig_project.get("prospects", [])
        
        engineer_names = []
        for eng_id in engineer_ids:
            if eng_id in original_engineer_id_to_name:
                engineer_names.append(original_engineer_id_to_name[eng_id])
        
        prospect_names = []
        for prospect_id in prospect_ids:
            if prospect_id in original_prospect_id_to_name:
                prospect_names.append(original_prospect_id_to_name[prospect_id])
        
        project_mapping[project_title] = {
            "engineers": engineer_names,
            "prospects": prospect_names
        }
    
    # Update projects with engineer and prospect ObjectIds
    updated_count = 0
    for project in projects:
        project_title = project.get("title", "")
        mapping = project_mapping.get(project_title, {})
        
        updates = {}
        
        # Link engineers
        engineer_names = mapping.get("engineers", [])
        engineer_object_ids = []
        for eng_name in engineer_names:
            if eng_name in engineer_map:
                engineer_object_ids.append(engineer_map[eng_name])
        
        if engineer_object_ids:
            updates["engineers"] = engineer_object_ids
        
        # Link prospects
        prospect_names = mapping.get("prospects", [])
        prospect_object_ids = []
        for prospect_name in prospect_names:
            if prospect_name in prospect_map:
                prospect_object_ids.append(prospect_map[prospect_name])
        
        if prospect_object_ids:
            updates["prospects"] = prospect_object_ids
        
        if updates:
            await db.projects.update_one(
                {"_id": project["_id"]},
                {"$set": updates}
            )
            updated_count += 1
    
    print(f"✅ Linked {updated_count} projects to engineers and prospects")
    print()


async def main():
    """Main function to link all references"""
    global db
    print("🔗 Starting to link all ObjectId references...\n")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB\n")
        
        # Create mappings
        await create_mappings()
        
        # Link references
        await link_prompts_to_engineers()
        await link_actions_to_engineers_and_projects()
        await link_projects_to_engineers_and_prospects()
        
        print("✅ All references linked successfully!")
        print("\n📊 Summary:")
        print(f"   - Engineers: {len(engineer_map)}")
        print(f"   - Prospects: {len(prospect_map)}")
        print(f"   - Projects: {len(project_map)}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())

