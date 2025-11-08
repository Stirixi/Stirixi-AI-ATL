from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId
from app.models.engineer import PyObjectId


class Action(BaseModel):
    """Action model - used for both creating and updating"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    title: str
    description: str
    project: Optional[PyObjectId] = None  # ObjectId referencing Project
    date: datetime
    engineer: PyObjectId  # ObjectId referencing Engineer
    event: str  # e.g., "commit", "pr", "merged_pr", "review", "bug_fix"

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }
