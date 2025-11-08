from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from bson import ObjectId
from app.models.engineer import PyObjectId


class Project(BaseModel):
    """Project model - used for both creating and updating"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    engineers: List[PyObjectId] = []  # Array of ObjectIds referencing Engineer
    importance: str  # e.g., "high", "medium", "low"
    prospects: List[PyObjectId] = []  # Array of ObjectIds referencing Prospect
    target_date: Optional[date] = None
    start_date: Optional[date] = None
    description: str
    title: str

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str, date: str},
    }
