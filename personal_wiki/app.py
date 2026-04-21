from __future__ import annotations

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from personal_wiki.database import DATA_DIR, UPLOAD_DIR, engine
from personal_wiki.models import Base
from personal_wiki.routes import admin as admin_routes
from personal_wiki.routes import articles, subthemes, themes, uploads

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


# Ensure directories exist before mounting (StaticFiles checks at import time)
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
STATIC_DIR = DATA_DIR.parent / "personal_wiki" / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Personal Wiki", lifespan=lifespan)

app.add_middleware(
    SessionMiddleware,
    secret_key=os.environ.get("SECRET_KEY", "dev-secret-change-me"),
    https_only=False,  # set True in production behind HTTPS
)

# Mount static files and uploads
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include routers
app.include_router(admin_routes.router)
app.include_router(themes.router)
app.include_router(subthemes.router)
app.include_router(articles.router)
app.include_router(uploads.router)


@app.get("/")
async def root():
    from fastapi.responses import RedirectResponse

    return RedirectResponse(url="/themes/")
