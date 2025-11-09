"""
Script to ensure every engineer has at least 3 recent actions.
All actions will be unique with different titles and descriptions.
"""
import asyncio
import sys
import random
from pathlib import Path
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# Add parent directory to path so we can import app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings


# Predefined unique action templates to ensure variety
ACTION_TEMPLATES = [
    {
        "title": "Code Review Completed",
        "description": "Completed thorough code review with detailed feedback on implementation patterns and best practices.",
        "event": "review"
    },
    {
        "title": "Feature Implementation",
        "description": "Successfully implemented new feature with comprehensive testing and documentation.",
        "event": "commit"
    },
    {
        "title": "Bug Fix Deployed",
        "description": "Identified and resolved critical bug affecting production system stability.",
        "event": "bug_fix"
    },
    {
        "title": "Pull Request Merged",
        "description": "Merged pull request after addressing all review comments and passing CI checks.",
        "event": "merged_pr"
    },
    {
        "title": "Performance Optimization",
        "description": "Optimized code performance, reducing execution time by significant margin.",
        "event": "commit"
    },
    {
        "title": "Documentation Updated",
        "description": "Updated technical documentation to reflect latest API changes and usage patterns.",
        "event": "commit"
    },
    {
        "title": "Security Audit Completed",
        "description": "Conducted security audit and implemented necessary patches for vulnerabilities.",
        "event": "review"
    },
    {
        "title": "Integration Test Suite",
        "description": "Created comprehensive integration test suite covering critical user workflows.",
        "event": "commit"
    },
    {
        "title": "Database Migration",
        "description": "Executed database migration with zero downtime and proper rollback procedures.",
        "event": "deployment"
    },
    {
        "title": "API Endpoint Refactored",
        "description": "Refactored API endpoint to improve maintainability and follow RESTful principles.",
        "event": "pr_opened"
    },
    {
        "title": "Monitoring Dashboard Created",
        "description": "Built real-time monitoring dashboard for tracking system metrics and alerts.",
        "event": "commit"
    },
    {
        "title": "Code Quality Improvements",
        "description": "Improved code quality by refactoring legacy code and adding type hints.",
        "event": "commit"
    },
    {
        "title": "Client Meeting Attended",
        "description": "Participated in client meeting to discuss requirements and technical feasibility.",
        "event": "meeting"
    },
    {
        "title": "Technical Design Document",
        "description": "Created detailed technical design document for upcoming system architecture changes.",
        "event": "commit"
    },
    {
        "title": "Load Testing Completed",
        "description": "Performed load testing to ensure system can handle expected traffic volumes.",
        "event": "review"
    },
    {
        "title": "Dependency Update",
        "description": "Updated project dependencies to latest stable versions with security patches.",
        "event": "pr_opened"
    },
    {
        "title": "Error Handling Improved",
        "description": "Enhanced error handling across application with proper logging and user feedback.",
        "event": "commit"
    },
    {
        "title": "Code Refactoring",
        "description": "Refactored complex code sections to improve readability and maintainability.",
        "event": "commit"
    },
    {
        "title": "Unit Tests Added",
        "description": "Added comprehensive unit tests to increase code coverage and reliability.",
        "event": "commit"
    },
    {
        "title": "Deployment Pipeline Fixed",
        "description": "Fixed issues in CI/CD pipeline to ensure smooth deployments.",
        "event": "deployment"
    }
]


async def ensure_engineers_have_recent_actions():
    """Ensure every engineer has at least 3 recent actions"""
    print("🔗 Ensuring every engineer has at least 3 recent actions...\n")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB\n")
        
        # Get all engineers
        engineers = await db.engineers.find({}).to_list(length=1000)
        print(f"📋 Found {len(engineers)} engineers")
        
        # Get all projects for assignment
        projects = await db.projects.find({}).to_list(length=1000)
        project_ids = [p["_id"] for p in projects]
        print(f"📋 Found {len(projects)} projects\n")
        
        # Track used templates per engineer to ensure uniqueness
        used_templates = {}
        
        # Process each engineer
        actions_created = 0
        engineers_updated = 0
        
        for engineer in engineers:
            engineer_id = engineer["_id"]
            engineer_name = engineer.get("name", "Unknown")
            current_actions = engineer.get("recent_actions", [])
            current_count = len(current_actions)
            
            # Initialize used templates for this engineer
            if engineer_id not in used_templates:
                used_templates[engineer_id] = []
            
            if current_count < 3:
                needed = 3 - current_count
                print(f"📋 {engineer_name}: Has {current_count} actions, needs {needed} more")
                
                # Get engineer's projects
                engineer_projects = await db.projects.find(
                    {"engineers": engineer_id}
                ).to_list(length=100)
                engineer_project_ids = [p["_id"] for p in engineer_projects]
                
                # Create new unique actions
                new_action_ids = []
                available_templates = [t for t in ACTION_TEMPLATES if t not in used_templates[engineer_id]]
                
                # If we've used all templates, shuffle and reuse
                if len(available_templates) < needed:
                    available_templates = ACTION_TEMPLATES.copy()
                    random.shuffle(available_templates)
                
                for i in range(needed):
                    # Select a unique template
                    template = available_templates[i % len(available_templates)]
                    used_templates[engineer_id].append(template)
                    
                    # Make it unique by adding variation
                    title = template["title"]
                    description = template["description"]
                    
                    # Add slight variations to ensure uniqueness
                    variations = [
                        f"{title} - {engineer_name}",
                        f"{title} (Latest)",
                        f"{title} - Recent Work",
                        f"{title} - System Update",
                        f"{title} - Enhancement"
                    ]
                    title = random.choice(variations)
                    
                    # Vary the description slightly
                    desc_variations = [
                        description,
                        f"{description} This work was completed as part of ongoing improvements.",
                        f"{description} The implementation follows industry best practices.",
                        f"{description} All tests passed successfully.",
                        f"{description} This change improves overall system reliability."
                    ]
                    description = random.choice(desc_variations)
                    
                    # Assign to a project if available
                    project_id = None
                    if engineer_project_ids:
                        project_id = random.choice(engineer_project_ids)
                    elif project_ids:
                        # Assign to any project if engineer has no projects
                        project_id = random.choice(project_ids)
                    
                    # Generate a date within the last 30 days
                    days_ago = random.randint(0, 30)
                    action_date = datetime.now() - timedelta(days=days_ago)
                    
                    # Create the action
                    action = {
                        "title": title,
                        "description": description,
                        "project": project_id,
                        "date": action_date,
                        "engineer": engineer_id,
                        "event": template["event"]
                    }
                    
                    # Insert the action
                    result = await db.actions.insert_one(action)
                    new_action_ids.append(result.inserted_id)
                    actions_created += 1
                
                # Update engineer's recent_actions array
                updated_actions = current_actions + new_action_ids
                # Keep only the most recent 50
                updated_actions = updated_actions[-50:]
                
                await db.engineers.update_one(
                    {"_id": engineer_id},
                    {"$set": {"recent_actions": updated_actions}}
                )
                
                print(f"   ✅ Created {needed} new unique actions")
                engineers_updated += 1
            else:
                print(f"✅ {engineer_name}: Already has {current_count} actions (sufficient)")
        
        print(f"\n✅ Created {actions_created} new unique actions")
        print(f"✅ Updated {engineers_updated} engineers\n")
        
        # Show final distribution
        print("📊 Final distribution:")
        for engineer in engineers:
            engineer_data = await db.engineers.find_one(
                {"_id": engineer["_id"]},
                {"recent_actions": 1, "name": 1}
            )
            actions_count = len(engineer_data.get("recent_actions", [])) if engineer_data else 0
            print(f"   - {engineer.get('name', 'Unknown')}: {actions_count} recent actions")
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
    await ensure_engineers_have_recent_actions()


if __name__ == "__main__":
    asyncio.run(main())

