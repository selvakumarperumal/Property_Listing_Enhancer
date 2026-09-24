import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field

from .llm_pipeline import EnhancementError, PropertyListingEnhancer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.enhancer = PropertyListingEnhancer()
    yield


app = FastAPI(
    title="Property Listing Enhancer",
    description="Transforms plain property details into engaging real estate listings.",
    version="0.1.0",
    lifespan=lifespan,
)


class EnhanceRequest(BaseModel):
    description: str = Field(
        ...,
        min_length=3,
        max_length=2000,
        examples=["Cozy 2-bedroom house with small garden"],
    )


class EnhanceResponse(BaseModel):
    original: str
    enhanced: str


class HealthResponse(BaseModel):
    status: str
    model: str
    provider: str
    ai_available: bool


def get_enhancer(request: Request) -> PropertyListingEnhancer:
    return request.app.state.enhancer


@app.get("/health", response_model=HealthResponse)
async def health(request: Request):
    enhancer = get_enhancer(request)
    return HealthResponse(
        status="ok",
        model=enhancer.model_repo,
        provider=enhancer.provider,
        ai_available=enhancer.is_ai_available,
    )


@app.post("/enhance", response_model=EnhanceResponse)
async def enhance(payload: EnhanceRequest, request: Request):
    description = payload.description.strip()
    try:
        result = await get_enhancer(request).enhance_property_description(description)
    except EnhancementError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return EnhanceResponse(**result)
