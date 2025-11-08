from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId
from app.models.engineer import PyObjectId


class Prompt(BaseModel):
    """Prompt model - used for both creating and updating"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    model: str
    date: datetime
    tokens: int
    text: str
    engineer: PyObjectId  # ObjectId referencing Engineer

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }
