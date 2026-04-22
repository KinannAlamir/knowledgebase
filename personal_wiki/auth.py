from __future__ import annotations

import os
import secrets

from fastapi import HTTPException, Request


def check_credentials(username: str, password: str) -> bool:
    """Compare submitted credentials against env-configured values."""
    expected_user = os.environ.get("WIKI_USERNAME", "admin")
    expected_pass = os.environ.get("WIKI_PASSWORD", "changeme")
    return secrets.compare_digest(username, expected_user) and secrets.compare_digest(
        password, expected_pass
    )


def is_editor(request: Request) -> bool:
    """Return True if the current session belongs to the admin."""
    return bool(request.session.get("editor"))


def require_editor(request: Request) -> None:
    """FastAPI dependency - redirects to login when not authenticated."""
    if not is_editor(request):
        next_url = request.url.path
        raise HTTPException(
            status_code=307,
            headers={"Location": f"/login?next={next_url}"},
        )
