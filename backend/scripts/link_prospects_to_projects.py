"""
Script to link prospects to projects.
This will intelligently assign prospects to projects based on:
1. Random assignment to distribute prospects across projects
2. Each project can have multiple prospects
"""
import asyncio
import sys
import random
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient

# Add parent directory to path so we can import app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings


async def link_prospects_to_projects():
    """Link prospects to projects"""
    print("🔗 Linking prospects to projects...\n")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB\n")
        
        # Get all projects
        projects = await db.projects.find({}).to_list(length=1000)
        print(f"📋 Found {len(projects)} projects")
        
        # Get all prospects
        prospects = await db.prospects.find({}).to_list(length=1000)
        print(f"📋 Found {len(prospects)} prospects\n")
        
        if not prospects:
            print("⚠️  No prospects found. Nothing to link.")
            return
        
        if not projects:
            print("⚠️  No projects found. Nothing to link.")
            return
        
        # Assign prospects to projects
        # Strategy: Distribute prospects across projects, with some projects getting multiple prospects
        updated_count = 0
        
        # Shuffle prospects for random distribution
        random.shuffle(prospects)
        
        # Assign each prospect to 1-2 random projects
        for prospect in prospects:
            prospect_id = prospect["_id"]
            # Each prospect can be assigned to 1-2 projects
            num_projects = random.randint(1, min(2, len(projects)))
            selected_projects = random.sample(projects, num_projects)
            
            for project in selected_projects:
                project_id = project["_id"]
                current_prospects = project.get("prospects", [])
                
                # Check if prospect is already in this project
                if prospect_id not in current_prospects:
                    current_prospects.append(prospect_id)
                    await db.projects.update_one(
                        {"_id": project_id},
                        {"$set": {"prospects": current_prospects}}
                    )
                    updated_count += 1
        
        print(f"✅ Linked prospects to projects ({updated_count} assignments)\n")
        
        # Show distribution
        print("📊 Project-prospect distribution:")
        for project in projects:
            project_prospects = await db.projects.find_one(
                {"_id": project["_id"]},
                {"prospects": 1}
            )
            prospects_count = len(project_prospects.get("prospects", [])) if project_prospects else 0
            
            # Get prospect names for display
            if prospects_count > 0:
                prospect_ids = project_prospects.get("prospects", [])
                prospect_docs = await db.prospects.find(
                    {"_id": {"$in": prospect_ids}},
                    {"name": 1}
                ).to_list(length=100)
                prospect_names = [p.get("name", "Unknown") for p in prospect_docs]
                print(f"   - {project.get('title', 'Unknown')}: {prospects_count} prospects")
                for name in prospect_names:
                    print(f"      • {name}")
            else:
                print(f"   - {project.get('title', 'Unknown')}: {prospects_count} prospects")
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
    await link_prospects_to_projects()


if __name__ == "__main__":
    asyncio.run(main())

