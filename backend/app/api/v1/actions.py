from fastapi import APIRouter, HTTPException
from typing import List, Optional
from bson import ObjectId
from app.core.database import get_database
from app.models.action import Action

router = APIRouter()


@router.get("/", response_model=List[Action])
async def get_actions(
    engineer_id: Optional[str] = None,
    project_id: Optional[str] = None,
    event: Optional[str] = None
):
    """Get all actions, optionally filtered by engineer, project, or event"""
    db = get_database()
    query = {}
    
    if engineer_id and ObjectId.is_valid(engineer_id):
        query["engineer"] = ObjectId(engineer_id)
    if project_id:
        query["project"] = project_id
    if event:
        query["event"] = event
    
    actions = await db.actions.find(query).sort("date", -1).to_list(length=1000)
    return actions


@router.get("/{action_id}", response_model=Action)
async def get_action(action_id: str):
    """Get a single action by ID"""
    db = get_database()
    if not ObjectId.is_valid(action_id):
        raise HTTPException(status_code=400, detail="Invalid action ID")
    
    action = await db.actions.find_one({"_id": ObjectId(action_id)})
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    return action


@router.post("/", response_model=Action, status_code=201)
async def create_action(action: Action):
    """Create a new action"""
    db = get_database()
    action_dict = action.model_dump(exclude={"id"})  # Exclude id, MongoDB will generate it
    
    # Convert engineer ObjectId string to ObjectId if needed
    if isinstance(action_dict.get("engineer"), str) and ObjectId.is_valid(action_dict["engineer"]):
        action_dict["engineer"] = ObjectId(action_dict["engineer"])
    elif not isinstance(action_dict.get("engineer"), ObjectId):
        raise HTTPException(status_code=400, detail="Invalid engineer ID")
    
    result = await db.actions.insert_one(action_dict)
    created_action = await db.actions.find_one({"_id": result.inserted_id})
    return created_action


@router.put("/{action_id}", response_model=Action)
async def update_action(action_id: str, action: Action):
    """Update an action - only provided fields will be updated"""
    db = get_database()
    if not ObjectId.is_valid(action_id):
        raise HTTPException(status_code=400, detail="Invalid action ID")
    
    update_data = action.model_dump(exclude_unset=True, exclude={"id"})
    
    # Convert engineer ObjectId string to ObjectId if provided
    if "engineer" in update_data:
        if isinstance(update_data["engineer"], str) and ObjectId.is_valid(update_data["engineer"]):
            update_data["engineer"] = ObjectId(update_data["engineer"])
        elif not isinstance(update_data["engineer"], ObjectId):
            raise HTTPException(status_code=400, detail="Invalid engineer ID")
    
    result = await db.actions.update_one(
        {"_id": ObjectId(action_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Action not found")
    
    updated_action = await db.actions.find_one({"_id": ObjectId(action_id)})
    return updated_action


@router.delete("/{action_id}", status_code=204)
async def delete_action(action_id: str):
    """Delete an action"""
    db = get_database()
    if not ObjectId.is_valid(action_id):
        raise HTTPException(status_code=400, detail="Invalid action ID")
    
    result = await db.actions.delete_one({"_id": ObjectId(action_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Action not found")
    return None
