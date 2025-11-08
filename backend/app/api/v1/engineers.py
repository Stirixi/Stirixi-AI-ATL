from fastapi import APIRouter, HTTPException
from typing import List
from bson import ObjectId
from app.core.database import get_database
from app.models.engineer import Engineer

router = APIRouter()


@router.get("/", response_model=List[Engineer])
async def get_engineers():
    """Get all engineers"""
    db = get_database()
    engineers = await db.engineers.find().to_list(length=1000)
    return engineers


@router.get("/{engineer_id}", response_model=Engineer)
async def get_engineer(engineer_id: str):
    """Get a single engineer by ID"""
    db = get_database()
    if not ObjectId.is_valid(engineer_id):
        raise HTTPException(status_code=400, detail="Invalid engineer ID")
    
    engineer = await db.engineers.find_one({"_id": ObjectId(engineer_id)})
    if not engineer:
        raise HTTPException(status_code=404, detail="Engineer not found")
    return engineer


@router.post("/", response_model=Engineer, status_code=201)
async def create_engineer(engineer: Engineer):
    """Create a new engineer"""
    db = get_database()
    engineer_dict = engineer.model_dump(exclude={"id"})  # Exclude id, MongoDB will generate it
    
    # Convert ObjectId strings to ObjectIds for arrays
    if engineer_dict.get("prompt_history"):
        engineer_dict["prompt_history"] = [ObjectId(pid) if isinstance(pid, str) and ObjectId.is_valid(pid) else pid for pid in engineer_dict["prompt_history"]]
    if engineer_dict.get("recent_actions"):
        engineer_dict["recent_actions"] = [ObjectId(aid) if isinstance(aid, str) and ObjectId.is_valid(aid) else aid for aid in engineer_dict["recent_actions"]]
    
    result = await db.engineers.insert_one(engineer_dict)
    created_engineer = await db.engineers.find_one({"_id": result.inserted_id})
    return created_engineer


@router.put("/{engineer_id}", response_model=Engineer)
async def update_engineer(engineer_id: str, engineer: Engineer):
    """Update an engineer - only provided fields will be updated"""
    db = get_database()
    if not ObjectId.is_valid(engineer_id):
        raise HTTPException(status_code=400, detail="Invalid engineer ID")
    
    update_data = engineer.model_dump(exclude_unset=True, exclude={"id"})
    
    # Convert ObjectId strings to ObjectIds for arrays
    if "prompt_history" in update_data and update_data["prompt_history"]:
        update_data["prompt_history"] = [ObjectId(pid) if isinstance(pid, str) and ObjectId.is_valid(pid) else pid for pid in update_data["prompt_history"]]
    if "recent_actions" in update_data and update_data["recent_actions"]:
        update_data["recent_actions"] = [ObjectId(aid) if isinstance(aid, str) and ObjectId.is_valid(aid) else aid for aid in update_data["recent_actions"]]
    
    result = await db.engineers.update_one(
        {"_id": ObjectId(engineer_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Engineer not found")
    
    updated_engineer = await db.engineers.find_one({"_id": ObjectId(engineer_id)})
    return updated_engineer


@router.delete("/{engineer_id}", status_code=204)
async def delete_engineer(engineer_id: str):
    """Delete an engineer"""
    db = get_database()
    if not ObjectId.is_valid(engineer_id):
        raise HTTPException(status_code=400, detail="Invalid engineer ID")
    
    result = await db.engineers.delete_one({"_id": ObjectId(engineer_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Engineer not found")
    return None
