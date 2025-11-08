from fastapi import APIRouter
from app.api.v1 import engineers, prompts, prospects, projects, actions

api_router = APIRouter()

api_router.include_router(engineers.router, prefix="/engineers", tags=["engineers"])
api_router.include_router(prompts.router, prefix="/prompts", tags=["prompts"])
api_router.include_router(prospects.router, prefix="/prospects", tags=["prospects"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(actions.router, prefix="/actions", tags=["actions"])

