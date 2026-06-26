from fastapi import FastAPI

from app.api.routes import router as api_router

# Initialize FastAPI application
app = FastAPI(
    title="AlphaForge AI API",
    description="AlphaForge AI Engineering for Finance MVP API. Standard plain text output format.",
    version="1.0.0",
)

# Register API routes
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
