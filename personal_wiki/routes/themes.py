from __future__ import annotations

from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from personal_wiki.auth import is_admin, require_admin
from personal_wiki.database import get_session
from personal_wiki.models import Theme
from personal_wiki.templating import templates

router = APIRouter(prefix="/themes", tags=["themes"])


@router.get("/", response_class=HTMLResponse)
async def list_themes(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> HTMLResponse:
    result = await session.execute(
        select(Theme).options(selectinload(Theme.subthemes)).order_by(Theme.position, Theme.id)
    )
    themes = result.scalars().all()
    return templates.TemplateResponse(
        request, "themes/list.html", {"themes": themes, "is_admin": is_admin(request)}
    )


@router.get("/new", response_class=HTMLResponse)
async def new_theme_form(
    request: Request,
    _: None = Depends(require_admin),
) -> HTMLResponse:
    return templates.TemplateResponse(
        request, "themes/form.html", {"theme": None, "is_admin": True}
    )


@router.post("/new")
async def create_theme(
    request: Request,
    title: str = Form(...),
    description: str = Form(""),
    icon: str = Form(""),
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_admin),
) -> RedirectResponse:
    theme = Theme(title=title, description=description, icon=icon)
    session.add(theme)
    await session.commit()
    return RedirectResponse(url=f"/themes/{theme.id}", status_code=303)


@router.get("/{theme_id}", response_class=HTMLResponse)
async def view_theme(
    request: Request,
    theme_id: int,
    session: AsyncSession = Depends(get_session),
) -> HTMLResponse:
    result = await session.execute(
        select(Theme).where(Theme.id == theme_id).options(selectinload(Theme.subthemes))
    )
    theme = result.scalar_one()
    return templates.TemplateResponse(
        request, "themes/detail.html", {"theme": theme, "is_admin": is_admin(request)}
    )


@router.get("/{theme_id}/edit", response_class=HTMLResponse)
async def edit_theme_form(
    request: Request,
    theme_id: int,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_admin),
) -> HTMLResponse:
    theme = await session.get(Theme, theme_id)
    return templates.TemplateResponse(
        request, "themes/form.html", {"theme": theme, "is_admin": True}
    )


@router.post("/{theme_id}/edit")
async def update_theme(
    request: Request,
    theme_id: int,
    title: str = Form(...),
    description: str = Form(""),
    icon: str = Form(""),
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_admin),
) -> RedirectResponse:
    theme = await session.get(Theme, theme_id)
    theme.title = title
    theme.description = description
    theme.icon = icon
    await session.commit()
    return RedirectResponse(url=f"/themes/{theme.id}", status_code=303)


@router.post("/{theme_id}/delete")
async def delete_theme(
    request: Request,
    theme_id: int,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_admin),
) -> RedirectResponse:
    theme = await session.get(Theme, theme_id)
    await session.delete(theme)
    await session.commit()
    return RedirectResponse(url="/themes/", status_code=303)
