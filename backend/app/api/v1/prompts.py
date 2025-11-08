from fastapi import APIRouter, HTTPException
from typing import List, Optional
from bson import ObjectId
from app.core.database import get_database
from app.models.prompt import Prompt

router = APIRouter()


@router.get("/", response_model=List[Prompt])
async def get_prompts(engineer_id: Optional[str] = None):
    """Get all prompts, optionally filtered by engineer"""
    db = get_database()
    query = {}
    if engineer_id and ObjectId.is_valid(engineer_id):
        query["engineer"] = ObjectId(engineer_id)
    
    prompts = await db.prompts.find(query).sort("date", -1).to_list(length=1000)
    return prompts


@router.get("/{prompt_id}", response_model=Prompt)
async def get_prompt(prompt_id: str):
    """Get a single prompt by ID"""
    db = get_database()
    if not ObjectId.is_valid(prompt_id):
        raise HTTPException(status_code=400, detail="Invalid prompt ID")
    
    prompt = await db.prompts.find_one({"_id": ObjectId(prompt_id)})
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return prompt


@router.post("/", response_model=Prompt, status_code=201)
async def create_prompt(prompt: Prompt):
    """Create a new prompt"""
    db = get_database()
    prompt_dict = prompt.model_dump(exclude={"id"})  # Exclude id, MongoDB will generate it
    
    # Convert engineer ObjectId string to ObjectId if needed
    if isinstance(prompt_dict.get("engineer"), str) and ObjectId.is_valid(prompt_dict["engineer"]):
        prompt_dict["engineer"] = ObjectId(prompt_dict["engineer"])
    elif not isinstance(prompt_dict.get("engineer"), ObjectId):
        raise HTTPException(status_code=400, detail="Invalid engineer ID")
    
    result = await db.prompts.insert_one(prompt_dict)
    created_prompt = await db.prompts.find_one({"_id": result.inserted_id})
    return created_prompt


@router.put("/{prompt_id}", response_model=Prompt)
async def update_prompt(prompt_id: str, prompt: Prompt):
    """Update a prompt - only provided fields will be updated"""
    db = get_database()
    if not ObjectId.is_valid(prompt_id):
        raise HTTPException(status_code=400, detail="Invalid prompt ID")
    
    update_data = prompt.model_dump(exclude_unset=True, exclude={"id"})
    
    # Convert engineer ObjectId string to ObjectId if provided
    if "engineer" in update_data:
        if isinstance(update_data["engineer"], str) and ObjectId.is_valid(update_data["engineer"]):
            update_data["engineer"] = ObjectId(update_data["engineer"])
        elif not isinstance(update_data["engineer"], ObjectId):
            raise HTTPException(status_code=400, detail="Invalid engineer ID")
    
    result = await db.prompts.update_one(
        {"_id": ObjectId(prompt_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    updated_prompt = await db.prompts.find_one({"_id": ObjectId(prompt_id)})
    return updated_prompt


@router.delete("/{prompt_id}", status_code=204)
async def delete_prompt(prompt_id: str):
    """Delete a prompt"""
    db = get_database()
    if not ObjectId.is_valid(prompt_id):
        raise HTTPException(status_code=400, detail="Invalid prompt ID")
    
    result = await db.prompts.delete_one({"_id": ObjectId(prompt_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return None
