"""
Script to check current state of projects and prospects linking
"""
import asyncio
import sys
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient

# Add parent directory to path so we can import app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings


async def check_projects_prospects():
    """Check current state of projects and prospects"""
    print("📊 Checking projects and prospects...\n")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB\n")
        
        # Get all projects
        projects = await db.projects.find({}).to_list(length=1000)
        print(f"📋 Found {len(projects)} projects\n")
        
        for project in projects:
            prospects_count = len(project.get("prospects", []))
            engineers_count = len(project.get("engineers", []))
            print(f"   - {project.get('title', 'Unknown')}: {prospects_count} prospects, {engineers_count} engineers")
        
        # Get all prospects
        prospects = await db.prospects.find({}).to_list(length=1000)
        print(f"\n📋 Found {len(prospects)} prospects")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        client.close()


async def main():
    """Main function"""
    await check_projects_prospects()


if __name__ == "__main__":
    asyncio.run(main())

