from __future__ import annotations

from fastapi import APIRouter, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse

from personal_wiki.auth import check_credentials, is_editor
from personal_wiki.templating import templates

router = APIRouter(prefix="", tags=["auth"])


@router.get("/login", response_class=HTMLResponse)
async def login_form(request: Request, next: str = "/themes/") -> HTMLResponse:
    if is_editor(request):
        return RedirectResponse(url=next, status_code=303)
    return templates.TemplateResponse(request, "auth/login.html", {"next": next, "error": None})


@router.post("/login", response_model=None)
async def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    next: str = Form("/themes/"),
) -> HTMLResponse | RedirectResponse:
    if check_credentials(username, password):
        request.session["editor"] = True
        return RedirectResponse(url=next, status_code=303)
    return templates.TemplateResponse(
        request,
        "auth/login.html",
        {"next": next, "error": "Invalid username or password."},
        status_code=401,
    )


@router.get("/logout")
async def logout(request: Request) -> RedirectResponse:
    request.session.clear()
    return RedirectResponse(url="/themes/", status_code=303)
