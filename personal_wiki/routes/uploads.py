from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Request, UploadFile
from fastapi.responses import JSONResponse

from personal_wiki.auth import require_admin
from personal_wiki.database import UPLOAD_DIR

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}


@router.post("/image")
async def upload_image(
    request: Request,
    file: UploadFile,
    _: None = Depends(require_admin),
) -> JSONResponse:
    """Handle image uploads from the rich text editor."""
    if not file.filename:
        return JSONResponse({"error": "No file provided"}, status_code=400)

    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        return JSONResponse(
            {"error": f"File type {ext} not allowed. Use: {', '.join(sorted(ALLOWED_EXTENSIONS))}"},
            status_code=400,
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename

    content = await file.read()
    filepath.write_bytes(content)

    return JSONResponse({"url": f"/uploads/{filename}"})
