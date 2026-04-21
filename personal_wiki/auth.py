from __future__ import annotations

import os
import secrets

from fastapi import HTTPException, Request


def check_credentials(username: str, password: str) -> bool:
    """Compare submitted credentials against env-configured values."""
    expected_user = os.environ.get("ADMIN_USERNAME", "admin")
    expected_pass = os.environ.get("ADMIN_PASSWORD", "changeme")
    return secrets.compare_digest(username, expected_user) and secrets.compare_digest(
        password, expected_pass
    )


def is_admin(request: Request) -> bool:
    """Return True if the current session belongs to the admin."""
    return bool(request.session.get("admin"))


def require_admin(request: Request) -> None:
    """FastAPI dependency - redirects to login when not authenticated."""
    if not is_admin(request):
        next_url = request.url.path
        raise HTTPException(
            status_code=307,
            headers={"Location": f"/admin/login?next={next_url}"},
        )
