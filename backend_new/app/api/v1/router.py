from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    health_records,
    medical_history,
    medications,
    appointments,
    documents,
    reports,
    ai
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(health_records.router, prefix="/health-records", tags=["health-records"])
api_router.include_router(medical_history.router, prefix="/medical-history", tags=["medical-history"])
api_router.include_router(medications.router, prefix="/medications", tags=["medications"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])