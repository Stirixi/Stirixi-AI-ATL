"""
Script to remove duplicate actions.
An action is considered a duplicate if it has the same:
- title
- description
- engineer
- project
- event

We'll keep the most recent one (by date) and remove the rest.
"""
import asyncio
import sys
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from collections import defaultdict

# Add parent directory to path so we can import app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings


async def remove_duplicate_actions():
    """Remove duplicate actions, keeping only the most recent one"""
    print("🔍 Finding and removing duplicate actions...\n")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB\n")
        
        # Get all actions
        actions = await db.actions.find({}).sort("date", -1).to_list(length=10000)
        print(f"📋 Found {len(actions)} total actions\n")
        
        # Group actions by their identifying fields
        action_groups = defaultdict(list)
        
        for action in actions:
            # Create a key from the identifying fields
            key = (
                action.get("title", ""),
                action.get("description", ""),
                str(action.get("engineer", "")),
                str(action.get("project", "")),
                action.get("event", "")
            )
            action_groups[key].append(action)
        
        # Find duplicates
        duplicates_to_remove = []
        kept_count = 0
        
        for key, group in action_groups.items():
            if len(group) > 1:
                # Sort by date (most recent first)
                group.sort(key=lambda x: x.get("date", ""), reverse=True)
                
                # Keep the first (most recent) one
                kept = group[0]
                kept_count += 1
                
                # Mark the rest for deletion
                for duplicate in group[1:]:
                    duplicates_to_remove.append(duplicate["_id"])
        
        print(f"📊 Found {len(duplicates_to_remove)} duplicate actions to remove")
        print(f"📊 Keeping {kept_count} unique actions (plus {len(action_groups) - kept_count} actions that were already unique)\n")
        
        if not duplicates_to_remove:
            print("✅ No duplicates found. All actions are unique.")
            return
        
        # Show some examples of duplicates
        print("🔍 Example duplicates to be removed:")
        example_count = 0
        for key, group in action_groups.items():
            if len(group) > 1 and example_count < 5:
                print(f"\n   Title: {key[0]}")
                print(f"   Engineer: {key[2]}")
                print(f"   Duplicates: {len(group)}")
                print(f"   Keeping: Most recent (date: {group[0].get('date', 'N/A')})")
                print(f"   Removing: {len(group) - 1} older duplicates")
                example_count += 1
        
        print(f"\n🗑️  Removing {len(duplicates_to_remove)} duplicate actions...")
        
        # Remove duplicates
        if duplicates_to_remove:
            result = await db.actions.delete_many({"_id": {"$in": duplicates_to_remove}})
            print(f"✅ Removed {result.deleted_count} duplicate actions\n")
        
        # Show final count
        remaining_actions = await db.actions.count_documents({})
        print(f"📊 Final count: {remaining_actions} actions remaining")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        client.close()


async def main():
    """Main function"""
    await remove_duplicate_actions()


if __name__ == "__main__":
    asyncio.run(main())

