from __future__ import annotations

from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from personal_wiki.auth import is_admin, require_admin
from personal_wiki.database import get_session
from personal_wiki.models import Subtheme, Theme
from personal_wiki.templating import templates

router = APIRouter(prefix="/themes/{theme_id}/subthemes", tags=["subthemes"])


@router.get("/new", response_class=HTMLResponse)
async def new_subtheme_form(
    request: Request,
    theme_id: int,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_admin),
) -> HTMLResponse:
    theme = await session.get(Theme, theme_id)
    return templates.TemplateResponse(
        request, "subthemes/form.html", {"theme": theme, "subtheme": None, "is_admin": True}
    )


@router.post("/new")
async def create_subtheme(
    request: Request,
    theme_id: int,
    title: str = Form(...),
    description: str = Form(""),
    icon: str = Form(""),
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_admin),
) -> RedirectResponse:
    subtheme = Subtheme(theme_id=theme_id, title=title, description=description, icon=icon)
    session.add(subtheme)
    await session.commit()
    return RedirectResponse(url=f"/themes/{theme_id}/subthemes/{subtheme.id}", status_code=303)


@router.get("/{subtheme_id}", response_class=HTMLResponse)
async def view_subtheme(
    request: Request,
    theme_id: int,
    subtheme_id: int,
    session: AsyncSession = Depends(get_session),
) -> HTMLResponse:
    result = await session.execute(
        select(Subtheme)
        .where(Subtheme.id == subtheme_id, Subtheme.theme_id == theme_id)
        .options(selectinload(Subtheme.articles), selectinload(Subtheme.theme))
    )
    subtheme = result.scalar_one()
    return templates.TemplateResponse(
        request,
        "subthemes/detail.html",
        {"subtheme": subtheme, "theme": subtheme.theme, "is_admin": is_admin(request)},
    )


@router.get("/{subtheme_id}/edit", response_class=HTMLResponse)
async def edit_subtheme_form(
    request: Request,
    theme_id: int,
    subtheme_id: int,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_admin),
) -> HTMLResponse:
    result = await session.execute(
        select(Subtheme).where(Subtheme.id == subtheme_id).options(selectinload(Subtheme.theme))
    )
    subtheme = result.scalar_one()
    return templates.TemplateResponse(
        request,
        "subthemes/form.html",
        {"theme": subtheme.theme, "subtheme": subtheme, "is_admin": True},
    )


@router.post("/{subtheme_id}/edit")
async def update_subtheme(
    request: Request,
    theme_id: int,
    subtheme_id: int,
    title: str = Form(...),
    description: str = Form(""),
    icon: str = Form(""),
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_admin),
) -> RedirectResponse:
    subtheme = await session.get(Subtheme, subtheme_id)
    subtheme.title = title
    subtheme.description = description
    subtheme.icon = icon
    await session.commit()
    return RedirectResponse(url=f"/themes/{theme_id}/subthemes/{subtheme.id}", status_code=303)


@router.post("/{subtheme_id}/delete")
async def delete_subtheme(
    request: Request,
    theme_id: int,
    subtheme_id: int,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_admin),
) -> RedirectResponse:
    subtheme = await session.get(Subtheme, subtheme_id)
    await session.delete(subtheme)
    await session.commit()
    return RedirectResponse(url=f"/themes/{theme_id}", status_code=303)
