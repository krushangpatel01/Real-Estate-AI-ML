from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes.auth_routes import router as auth_router


app = FastAPI(
    title="Real Estate AI/ML API",
    description="AI-powered real estate platform backend",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)


@app.get("/")
def root():

    return {
        "success": True,
        "message": "Real Estate AI/ML API is running",
    }


@app.get("/health")
def health_check():

    return {
        "success": True,
        "status": "healthy",
    }