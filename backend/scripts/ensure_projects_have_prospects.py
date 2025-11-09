"""
Script to ensure every project has at least 2-4 prospective hires.
Projects with fewer than 2 prospects will be assigned more prospects.
Projects with more than 4 prospects will be reduced to 4.
"""
import asyncio
import sys
import random
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient

# Add parent directory to path so we can import app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings


async def ensure_projects_have_prospects():
    """Ensure every project has 2-4 prospective hires"""
    print("🔗 Ensuring every project has 2-4 prospective hires...\n")
    
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
            print("⚠️  No prospects found. Cannot assign prospects to projects.")
            return
        
        if not projects:
            print("⚠️  No projects found.")
            return
        
        # Get current state
        print("📊 Current state:")
        for project in projects:
            current_prospects = project.get("prospects", [])
            print(f"   - {project.get('title', 'Unknown')}: {len(current_prospects)} prospects")
        print()
        
        # Collect all prospect IDs
        all_prospect_ids = [p["_id"] for p in prospects]
        
        # Process each project
        updated_count = 0
        for project in projects:
            project_id = project["_id"]
            current_prospects = project.get("prospects", [])
            current_count = len(current_prospects)
            
            # Determine target count (2-4)
            if current_count < 2:
                # Need to add more prospects
                target_count = random.randint(2, 4)
                needed = target_count - current_count
                
                # Get available prospects (not already in this project)
                available_prospects = [pid for pid in all_prospect_ids if pid not in current_prospects]
                
                if len(available_prospects) >= needed:
                    # Add random prospects
                    new_prospects = random.sample(available_prospects, needed)
                    updated_prospects = current_prospects + new_prospects
                else:
                    # Not enough available, use all available
                    updated_prospects = current_prospects + available_prospects
                
                await db.projects.update_one(
                    {"_id": project_id},
                    {"$set": {"prospects": updated_prospects}}
                )
                print(f"✅ Updated {project.get('title', 'Unknown')}: {current_count} → {len(updated_prospects)} prospects")
                updated_count += 1
                
            elif current_count > 4:
                # Need to reduce to 4
                # Keep the first 4 (or random 4)
                updated_prospects = random.sample(current_prospects, 4)
                
                await db.projects.update_one(
                    {"_id": project_id},
                    {"$set": {"prospects": updated_prospects}}
                )
                print(f"✅ Updated {project.get('title', 'Unknown')}: {current_count} → {len(updated_prospects)} prospects (reduced)")
                updated_count += 1
            else:
                # Already in range (2-4), but ensure we have at least 2
                if current_count < 2:
                    needed = 2 - current_count
                    available_prospects = [pid for pid in all_prospect_ids if pid not in current_prospects]
                    
                    if len(available_prospects) >= needed:
                        new_prospects = random.sample(available_prospects, needed)
                        updated_prospects = current_prospects + new_prospects
                        
                        await db.projects.update_one(
                            {"_id": project_id},
                            {"$set": {"prospects": updated_prospects}}
                        )
                        print(f"✅ Updated {project.get('title', 'Unknown')}: {current_count} → {len(updated_prospects)} prospects")
                        updated_count += 1
        
        print(f"\n✅ Updated {updated_count} projects\n")
        
        # Show final distribution
        print("📊 Final distribution:")
        for project in projects:
            project_data = await db.projects.find_one(
                {"_id": project["_id"]},
                {"prospects": 1, "title": 1}
            )
            prospects_count = len(project_data.get("prospects", [])) if project_data else 0
            
            # Get prospect names for display
            if prospects_count > 0:
                prospect_ids = project_data.get("prospects", [])
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
    await ensure_projects_have_prospects()


if __name__ == "__main__":
    asyncio.run(main())

