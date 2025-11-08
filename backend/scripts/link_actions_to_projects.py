"""
Script to link actions to projects.
Since the original seed data has all actions with null projects,
this script will intelligently assign actions to projects based on:
1. The engineer's associated projects
2. If an engineer has multiple projects, assign actions randomly to one of them
"""
import asyncio
import sys
import random
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# Add parent directory to path so we can import app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings


async def link_actions_to_projects():
    """Link actions to projects based on engineer's projects"""
    print("🔗 Linking actions to projects...\n")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB\n")
        
        # Get all projects and create a mapping
        projects = await db.projects.find({}).to_list(length=1000)
        project_map = {str(p["_id"]): p for p in projects}
        print(f"📋 Found {len(projects)} projects\n")
        
        # Get all engineers and their projects
        engineers = await db.engineers.find({}).to_list(length=1000)
        engineer_projects_map = {}
        
        for engineer in engineers:
            engineer_id = engineer["_id"]
            # Find projects that include this engineer
            engineer_projects = await db.projects.find(
                {"engineers": engineer_id}
            ).to_list(length=100)
            
            engineer_projects_map[str(engineer_id)] = [p["_id"] for p in engineer_projects]
        
        print(f"📋 Mapped engineers to their projects\n")
        
        # Get all actions that don't have a project or have null/empty project
        actions = await db.actions.find({
            "$or": [
                {"project": {"$exists": False}},
                {"project": None},
                {"project": ""},
                {"project": {"$type": "string"}}  # Also update string project IDs to ObjectIds
            ]
        }).to_list(length=10000)
        
        print(f"📋 Found {len(actions)} actions to link\n")
        
        # Link actions to projects
        updated_count = 0
        no_project_count = 0
        
        for action in actions:
            engineer_id = action.get("engineer")
            
            if not engineer_id:
                no_project_count += 1
                continue
            
            # Get projects for this engineer
            engineer_projects = engineer_projects_map.get(str(engineer_id), [])
            
            if engineer_projects:
                # Randomly assign to one of the engineer's projects
                project_id = random.choice(engineer_projects)
                
                await db.actions.update_one(
                    {"_id": action["_id"]},
                    {"$set": {"project": project_id}}
                )
                updated_count += 1
            else:
                # Engineer has no projects, leave as null
                no_project_count += 1
        
        print(f"✅ Linked {updated_count} actions to projects")
        if no_project_count > 0:
            print(f"⚠️  {no_project_count} actions could not be linked (engineer has no projects)")
        print()
        
        # Show distribution
        print("📊 Project assignment distribution:")
        for project_id, project in project_map.items():
            action_count = await db.actions.count_documents({"project": ObjectId(project_id)})
            print(f"   - {project.get('title', 'Unknown')}: {action_count} actions")
        print()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        client.close()


async def main():
    """Main function"""
    await link_actions_to_projects()


if __name__ == "__main__":
    asyncio.run(main())

