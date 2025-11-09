"""
Script to update engineers' recent_actions arrays after removing duplicates.
This ensures the arrays only contain actions that still exist.
"""
import asyncio
import sys
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient

# Add parent directory to path so we can import app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings


async def update_engineer_recent_actions():
    """Update engineers' recent_actions arrays to only include existing actions"""
    print("🔄 Updating engineers' recent_actions arrays...\n")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB\n")
        
        # Get all engineers
        engineers = await db.engineers.find({}).to_list(length=1000)
        print(f"📋 Found {len(engineers)} engineers\n")
        
        # Get all existing action IDs
        existing_actions = await db.actions.find({}, {"_id": 1}).to_list(length=10000)
        existing_action_ids = {action["_id"] for action in existing_actions}
        print(f"📋 Found {len(existing_action_ids)} existing actions\n")
        
        # Update each engineer's recent_actions array
        updated_count = 0
        for engineer in engineers:
            engineer_id = engineer["_id"]
            recent_actions = engineer.get("recent_actions", [])
            
            # Filter to only include existing actions
            valid_actions = [action_id for action_id in recent_actions if action_id in existing_action_ids]
            
            if len(valid_actions) != len(recent_actions):
                # Update if there were invalid references
                await db.engineers.update_one(
                    {"_id": engineer_id},
                    {"$set": {"recent_actions": valid_actions}}
                )
                removed = len(recent_actions) - len(valid_actions)
                print(f"✅ Updated {engineer.get('name', 'Unknown')}: Removed {removed} invalid action references")
                updated_count += 1
            else:
                # Also update to get the most recent actions
                # Get recent actions for this engineer (last 50 by date)
                action_ids = await db.actions.find(
                    {"engineer": engineer_id}
                ).sort("date", -1).limit(50).to_list(length=50)
                
                action_object_ids = [a["_id"] for a in action_ids]
                if action_object_ids != recent_actions:
                    await db.engineers.update_one(
                        {"_id": engineer_id},
                        {"$set": {"recent_actions": action_object_ids}}
                    )
                    updated_count += 1
        
        print(f"\n✅ Updated {updated_count} engineers' recent_actions arrays")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        client.close()


async def main():
    """Main function"""
    await update_engineer_recent_actions()


if __name__ == "__main__":
    asyncio.run(main())

