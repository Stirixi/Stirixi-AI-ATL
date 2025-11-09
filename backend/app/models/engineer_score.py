from __future__ import annotations

from datetime import datetime
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, Field, field_validator

from app.models.engineer import PyObjectId


class EngineerScore(BaseModel):
    """Aggregated ML score snapshot per engineer/project pair."""

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    engineer_id: Optional[PyObjectId] = None
    project_id: Optional[PyObjectId] = None
    engineer_wallet: str
    overall_score: float
    reliability_score: float
    ai_efficiency_score: float
    bug_rate: float
    confidence: float
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    score_hash: Optional[str] = None
    solana_signature: Optional[str] = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str, datetime: lambda v: v.isoformat()},
    }

    @field_validator("engineer_wallet")
    @classmethod
    def validate_wallet(cls, value: str) -> str:
        if not value:
            raise ValueError("engineer_wallet is required")
        if len(value) < 32:
            raise ValueError("engineer_wallet must be a valid base58 address")
        return value
