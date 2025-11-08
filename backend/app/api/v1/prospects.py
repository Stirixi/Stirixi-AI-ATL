from fastapi import APIRouter, HTTPException
from typing import List
from bson import ObjectId
from app.core.database import get_database
from app.models.prospect import Prospect

router = APIRouter()


@router.get("/", response_model=List[Prospect])
async def get_prospects():
    """Get all prospects"""
    db = get_database()
    prospects = await db.prospects.find().to_list(length=1000)
    return prospects


@router.get("/{prospect_id}", response_model=Prospect)
async def get_prospect(prospect_id: str):
    """Get a single prospect by ID"""
    db = get_database()
    if not ObjectId.is_valid(prospect_id):
        raise HTTPException(status_code=400, detail="Invalid prospect ID")
    
    prospect = await db.prospects.find_one({"_id": ObjectId(prospect_id)})
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect not found")
    return prospect


@router.post("/", response_model=Prospect, status_code=201)
async def create_prospect(prospect: Prospect):
    """Create a new prospect"""
    db = get_database()
    prospect_dict = prospect.model_dump(exclude={"id"})  # Exclude id, MongoDB will generate it
    
    result = await db.prospects.insert_one(prospect_dict)
    created_prospect = await db.prospects.find_one({"_id": result.inserted_id})
    return created_prospect


@router.put("/{prospect_id}", response_model=Prospect)
async def update_prospect(prospect_id: str, prospect: Prospect):
    """Update a prospect - only provided fields will be updated"""
    db = get_database()
    if not ObjectId.is_valid(prospect_id):
        raise HTTPException(status_code=400, detail="Invalid prospect ID")
    
    update_data = prospect.model_dump(exclude_unset=True, exclude={"id"})
    
    result = await db.prospects.update_one(
        {"_id": ObjectId(prospect_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Prospect not found")
    
    updated_prospect = await db.prospects.find_one({"_id": ObjectId(prospect_id)})
    return updated_prospect


@router.delete("/{prospect_id}", status_code=204)
async def delete_prospect(prospect_id: str):
    """Delete a prospect"""
    db = get_database()
    if not ObjectId.is_valid(prospect_id):
        raise HTTPException(status_code=400, detail="Invalid prospect ID")
    
    result = await db.prospects.delete_one({"_id": ObjectId(prospect_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Prospect not found")
    return None
