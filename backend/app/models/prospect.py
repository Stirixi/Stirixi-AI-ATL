from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from bson import ObjectId
from app.models.engineer import PyObjectId


class Prospect(BaseModel):
    """Prospect model - used for both creating and updating"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str
    title: str
    skills: List[Optional[str]] = []
    email: str
    github_user: str
    date_applied: date
    pr_count: int = 0
    estimation_accuracy: Optional[float] = None
    bug_count: int = 0
    avg_review_time: Optional[float] = None  # in hours
    token_cost: float = 0.0

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str, date: str},
    }
