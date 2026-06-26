import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import router as api_router

# Initialize FastAPI application
app = FastAPI(
    title="AlphaForge AI API",
    description="AlphaForge AI Engineering for Finance MVP API. Standard plain text output format.",
    version="1.0.0",
)

# Configure CORS middleware
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(api_router)

# Serve compiled frontend static files if available
frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount(
        "/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets"
    )

    @app.get("/{fallback_path:path}")
    async def fallback(fallback_path: str):
        if fallback_path.startswith("api") or any(
            fallback_path.startswith(prefix)
            for prefix in ["data", "alpha", "backtest", "risk", "report", "experiments"]
        ):
            from fastapi import HTTPException

            raise HTTPException(status_code=404, detail="Not Found")
        return FileResponse(os.path.join(frontend_dist, "index.html"))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
