from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic v2"""
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ])
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str) and ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")


class Engineer(BaseModel):
    """Engineer model - used for both creating and updating"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str
    title: str
    skills: List[Optional[str]] = []
    email: str
    github_user: str
    date_hired: date
    pr_count: int = 0
    estimation_accuracy: Optional[float] = None
    bug_count: int = 0
    avg_review_time: Optional[float] = None  # in hours
    token_cost: float = 0.0
    prompt_history: List[PyObjectId] = []  # Array of ObjectIds referencing Prompt
    monthly_performance: List[int] = []  # Array of performance scores
    recent_actions: List[PyObjectId] = []  # Array of ObjectIds referencing Action

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str, date: str},
    }
