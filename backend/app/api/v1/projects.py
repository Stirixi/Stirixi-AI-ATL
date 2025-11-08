from fastapi import APIRouter, HTTPException
from typing import List
from bson import ObjectId
from app.core.database import get_database
from app.models.project import Project

router = APIRouter()


@router.get("/", response_model=List[Project])
async def get_projects():
    """Get all projects"""
    db = get_database()
    projects = await db.projects.find().to_list(length=1000)
    return projects


@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: str):
    """Get a single project by ID"""
    db = get_database()
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")
    
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/", response_model=Project, status_code=201)
async def create_project(project: Project):
    """Create a new project"""
    db = get_database()
    project_dict = project.model_dump(exclude={"id"})  # Exclude id, MongoDB will generate it
    
    # Convert ObjectId strings to ObjectIds for arrays
    if project_dict.get("engineers"):
        project_dict["engineers"] = [ObjectId(eid) if isinstance(eid, str) and ObjectId.is_valid(eid) else eid for eid in project_dict["engineers"]]
    if project_dict.get("prospects"):
        project_dict["prospects"] = [ObjectId(pid) if isinstance(pid, str) and ObjectId.is_valid(pid) else pid for pid in project_dict["prospects"]]
    
    result = await db.projects.insert_one(project_dict)
    created_project = await db.projects.find_one({"_id": result.inserted_id})
    return created_project


@router.put("/{project_id}", response_model=Project)
async def update_project(project_id: str, project: Project):
    """Update a project - only provided fields will be updated"""
    db = get_database()
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")
    
    update_data = project.model_dump(exclude_unset=True, exclude={"id"})
    
    # Convert ObjectId strings to ObjectIds for arrays
    if "engineers" in update_data and update_data["engineers"]:
        update_data["engineers"] = [ObjectId(eid) if isinstance(eid, str) and ObjectId.is_valid(eid) else eid for eid in update_data["engineers"]]
    if "prospects" in update_data and update_data["prospects"]:
        update_data["prospects"] = [ObjectId(pid) if isinstance(pid, str) and ObjectId.is_valid(pid) else pid for pid in update_data["prospects"]]
    
    result = await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    updated_project = await db.projects.find_one({"_id": ObjectId(project_id)})
    return updated_project


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: str):
    """Delete a project"""
    db = get_database()
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")
    
    result = await db.projects.delete_one({"_id": ObjectId(project_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return None
