import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.routers import auth, ai, transcribe, notify
from app.modules.screening.router import router as screening_router
from app.modules.doctor.router import router as doctor_router
from app.modules.patient.router import router as patient_router

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="NeuroVia API",
    description="AI-Driven Dementia Screening & Patient Support Platform",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:5173", "http://127.0.0.1:3001", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(screening_router)
app.include_router(ai.router, prefix="/ai", tags=["AI Analysis"])
app.include_router(patient_router)
app.include_router(transcribe.router, prefix="/audio", tags=["Audio Transcription"])
app.include_router(doctor_router, prefix="/doctors", tags=["Healthcare"])
app.include_router(notify.router, tags=["Notifications"])

# Mount uploads directory for serving profile images
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/")
async def root():
    return {
        "name": "NeuroVia API",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
