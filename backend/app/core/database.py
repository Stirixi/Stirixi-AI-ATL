from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from typing import Optional

class MongoDB:
    client: Optional[AsyncIOMotorClient] = None

db = MongoDB()

async def connect_to_mongo():
    """Create database connection"""
    print(f"🔌 Attempting to connect to MongoDB: {settings.MONGODB_URL}")
    try:
        db.client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
        # Test connection
        await db.client.admin.command('ping')
        print(f"✅ Connected to MongoDB: {settings.MONGODB_URL}")
        
        # Create indexes for better query performance
        await create_indexes()
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        print(f"   Using connection string: {settings.MONGODB_URL}")
        print(f"   Make sure your .env file has the correct MONGODB_URL")
        raise

async def create_indexes():
    """Create database indexes for common queries"""
    database = db.client[settings.MONGODB_DB_NAME]
    
    # Engineer indexes
    await database.engineers.create_index("github_user")
    await database.engineers.create_index("email")
    await database.engineers.create_index("date_hired")
    
    # Prompt indexes
    await database.prompts.create_index("engineer")
    await database.prompts.create_index("date")
    await database.prompts.create_index([("engineer", 1), ("date", -1)])
    
    # Prospect indexes
    await database.prospects.create_index("github_user")
    await database.prospects.create_index("email")
    await database.prospects.create_index("date_applied")
    
    # Project indexes
    await database.projects.create_index("engineers")
    await database.projects.create_index("start_date")
    await database.projects.create_index("target_date")
    
    # Action indexes
    await database.actions.create_index("engineer")
    await database.actions.create_index("project")
    await database.actions.create_index("date")
    await database.actions.create_index([("engineer", 1), ("date", -1)])
    await database.actions.create_index([("project", 1), ("date", -1)])
    
    print("✅ Database indexes created")

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        print("✅ MongoDB connection closed")

def get_database():
    """Get database instance"""
    return db.client[settings.MONGODB_DB_NAME]

