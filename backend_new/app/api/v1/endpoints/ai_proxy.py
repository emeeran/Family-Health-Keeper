"""
AI Proxy Endpoints
Proxy API calls to AI services to keep API keys secure on the backend
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from app.core.deps import get_current_user
from app.schemas.user import User
import httpx
import os
from typing import Dict, Any

router = APIRouter()


@router.post("/generate-insights")
async def generate_health_insights(
    patient_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Generate health insights using backend AI services
    """
    try:
        # Call Gemini API from backend
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
                headers={"Authorization": f"Bearer {os.getenv('GEMINI_API_KEY')}"},
                json={
                    "contents": [{
                        "parts": [{
                            "text": f"Generate health insights for patient: {patient_data}"
                        }]
                    }]
                }
            )

            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to generate insights"
                )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize-history")
async def summarize_medical_history(
    medical_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Summarize medical history using AI
    """
    try:
        # Implementation for medical history summarization
        pass
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))