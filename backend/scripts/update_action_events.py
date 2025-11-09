"""
Script to update action event types to be one of:
- pr-merged
- pr
- review
- bug_fix
- commit

And distribute them reasonably across all actions.
"""
import asyncio
import sys
import random
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from collections import Counter

# Add parent directory to path so we can import app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings

# Valid event types
VALID_EVENTS = ["pr-merged", "pr", "review", "bug_fix", "commit"]


async def update_action_events():
    """Update all actions to have valid event types with reasonable distribution"""
    print("🔄 Updating action event types...\n")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB\n")
        
        # Get all actions
        actions = await db.actions.find({}).to_list(length=10000)
        print(f"📋 Found {len(actions)} actions\n")
        
        if not actions:
            print("⚠️  No actions found.")
            return
        
        # Create a distribution that's reasonably balanced
        # We'll use a weighted distribution to make it more realistic:
        # - commit: 30% (most common)
        # - pr: 20%
        # - review: 20%
        # - pr-merged: 15%
        # - bug_fix: 15%
        
        event_weights = {
            "commit": 0.30,
            "pr": 0.20,
            "review": 0.20,
            "pr-merged": 0.15,
            "bug_fix": 0.15
        }
        
        # Create weighted list for random selection
        weighted_events = []
        for event, weight in event_weights.items():
            weighted_events.extend([event] * int(weight * 100))
        
        # Shuffle to randomize
        random.shuffle(weighted_events)
        
        # Update each action
        updated_count = 0
        event_distribution = Counter()
        
        for i, action in enumerate(actions):
            # Select event type based on weighted distribution
            # Use modulo to cycle through the weighted list
            event_type = weighted_events[i % len(weighted_events)]
            
            # Update the action
            await db.actions.update_one(
                {"_id": action["_id"]},
                {"$set": {"event": event_type}}
            )
            
            event_distribution[event_type] += 1
            updated_count += 1
        
        print(f"✅ Updated {updated_count} actions\n")
        
        # Show distribution
        print("📊 Event type distribution:")
        total = sum(event_distribution.values())
        for event in VALID_EVENTS:
            count = event_distribution.get(event, 0)
            percentage = (count / total * 100) if total > 0 else 0
            print(f"   - {event}: {count} ({percentage:.1f}%)")
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
    await update_action_events()


if __name__ == "__main__":
    asyncio.run(main())

