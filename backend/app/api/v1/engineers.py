from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId

from app.core.database import get_database
from app.models.engineer import Engineer, PyObjectId
from app.models.engineer_score import EngineerScore
from app.services import SolanaSBTError, solana_sbt_service

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


@router.post(
    "/{engineer_id}/scores",
    response_model=EngineerScore,
    status_code=201,
    summary="Publish an engineer score and mint the SBT",
)
async def publish_engineer_score(engineer_id: str, score: EngineerScore):
    """Persist an engineer score snapshot, anchor it on Solana, and return it."""
    if not ObjectId.is_valid(engineer_id):
        raise HTTPException(status_code=400, detail="Invalid engineer ID")

    db = get_database()
    engineer = await db.engineers.find_one({"_id": ObjectId(engineer_id)})
    if not engineer:
        raise HTTPException(status_code=404, detail="Engineer not found")

    score.engineer_id = PyObjectId(engineer_id)
    score.last_updated = datetime.utcnow()

    score_payload = score.model_dump(
        mode="python",
        exclude={"score_hash", "solana_signature", "id"},
    )

    sbt_payload = solana_sbt_service.build_soulbound_payload(
        engineer=engineer,
        score=score_payload,
    )

    try:
        chain_result = await solana_sbt_service.mint_soulbound_token(
            score.engineer_wallet, sbt_payload
        )
    except SolanaSBTError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to record score on Solana: {exc}",
        ) from exc

    score.score_hash = chain_result.score_hash
    score.solana_signature = chain_result.signature
    score.last_updated = datetime.utcnow()

    db_doc = score.model_dump(by_alias=True, mode="python")
    if not isinstance(db_doc.get("engineer_id"), ObjectId):
        db_doc["engineer_id"] = ObjectId(db_doc["engineer_id"])
    if db_doc.get("project_id") and not isinstance(db_doc["project_id"], ObjectId):
        db_doc["project_id"] = ObjectId(db_doc["project_id"])

    result = await db.engineer_scores.insert_one(db_doc)
    score.id = PyObjectId(result.inserted_id)
    return score


@router.get(
    "/{engineer_id}/scores",
    response_model=List[EngineerScore],
    summary="List score snapshots for an engineer",
)
async def list_engineer_scores(
    engineer_id: str,
    limit: int = Query(
        default=10,
        ge=1,
        le=100,
        description="Maximum number of score documents to return (sorted newest first)",
    ),
):
    if not ObjectId.is_valid(engineer_id):
        raise HTTPException(status_code=400, detail="Invalid engineer ID")

    db = get_database()
    cursor = (
        db.engineer_scores.find({"engineer_id": ObjectId(engineer_id)})
        .sort("last_updated", -1)
        .limit(limit)
    )
    documents = await cursor.to_list(length=limit)
    return [EngineerScore.model_validate(doc) for doc in documents]


@router.get(
    "/{engineer_id}/scores/latest",
    response_model=Optional[EngineerScore],
    summary="Get the latest SBT snapshot for an engineer",
)
async def get_latest_engineer_score(engineer_id: str):
    if not ObjectId.is_valid(engineer_id):
        raise HTTPException(status_code=400, detail="Invalid engineer ID")

    db = get_database()
    document = await db.engineer_scores.find_one(
        {"engineer_id": ObjectId(engineer_id)},
        sort=[("last_updated", -1)],
    )
    if not document:
        return None
    return EngineerScore.model_validate(document)
