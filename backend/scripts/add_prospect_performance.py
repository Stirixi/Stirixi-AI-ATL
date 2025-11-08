"""
Script to add performance scores to all prospects.
Performance scores are doubles from 0.0 to 10.0.
"""
import asyncio
import sys
import random
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient

# Add parent directory to path so we can import app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings


async def add_performance_scores():
    """Add performance scores to all prospects"""
    print("📊 Adding performance scores to prospects...\n")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB\n")
        
        # Get all prospects
        prospects = await db.prospects.find({}).to_list(length=1000)
        print(f"📋 Found {len(prospects)} prospects\n")
        
        # Update each prospect with a performance score
        updated_count = 0
        for prospect in prospects:
            # Generate a random performance score between 0.0 and 10.0
            # Using a more realistic distribution (slightly weighted towards higher scores)
            performance = round(random.uniform(5.0, 10.0), 2)
            
            await db.prospects.update_one(
                {"_id": prospect["_id"]},
                {"$set": {"performance": performance}}
            )
            
            print(f"✅ Updated {prospect.get('name', 'Unknown')}: {performance:.2f}")
            updated_count += 1
        
        print(f"\n✅ Successfully updated {updated_count} prospects with performance scores!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        client.close()


async def main():
    """Main function"""
    await add_performance_scores()


if __name__ == "__main__":
    asyncio.run(main())

