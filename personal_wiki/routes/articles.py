from __future__ import annotations

from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from personal_wiki.auth import is_editor, require_editor
from personal_wiki.database import get_session
from personal_wiki.models import Article, Subtheme
from personal_wiki.templating import templates

router = APIRouter(
    prefix="/themes/{theme_id}/subthemes/{subtheme_id}/articles",
    tags=["articles"],
)


@router.get("/new", response_class=HTMLResponse)
async def new_article_form(
    request: Request,
    theme_id: int,
    subtheme_id: int,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_editor),
) -> HTMLResponse:
    result = await session.execute(
        select(Subtheme).where(Subtheme.id == subtheme_id).options(selectinload(Subtheme.theme))
    )
    subtheme = result.scalar_one()
    return templates.TemplateResponse(
        request,
        "articles/form.html",
        {"theme": subtheme.theme, "subtheme": subtheme, "article": None, "is_editor": True},
    )


@router.post("/new")
async def create_article(
    request: Request,
    theme_id: int,
    subtheme_id: int,
    title: str = Form(...),
    content: str = Form(""),
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_editor),
) -> RedirectResponse:
    article = Article(subtheme_id=subtheme_id, title=title, content=content)
    session.add(article)
    await session.commit()
    return RedirectResponse(
        url=f"/themes/{theme_id}/subthemes/{subtheme_id}/articles/{article.id}",
        status_code=303,
    )


@router.get("/{article_id}", response_class=HTMLResponse)
async def view_article(
    request: Request,
    theme_id: int,
    subtheme_id: int,
    article_id: int,
    session: AsyncSession = Depends(get_session),
) -> HTMLResponse:
    result = await session.execute(
        select(Article)
        .where(Article.id == article_id)
        .options(selectinload(Article.subtheme).selectinload(Subtheme.theme))
    )
    article = result.scalar_one()
    return templates.TemplateResponse(
        request,
        "articles/detail.html",
        {
            "article": article,
            "subtheme": article.subtheme,
            "theme": article.subtheme.theme,
            "is_editor": is_editor(request),
        },
    )


@router.get("/{article_id}/edit", response_class=HTMLResponse)
async def edit_article_form(
    request: Request,
    theme_id: int,
    subtheme_id: int,
    article_id: int,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_editor),
) -> HTMLResponse:
    result = await session.execute(
        select(Article)
        .where(Article.id == article_id)
        .options(selectinload(Article.subtheme).selectinload(Subtheme.theme))
    )
    article = result.scalar_one()
    return templates.TemplateResponse(
        request,
        "articles/form.html",
        {
            "article": article,
            "subtheme": article.subtheme,
            "theme": article.subtheme.theme,
            "is_editor": True,
        },
    )


@router.post("/{article_id}/edit")
async def update_article(
    request: Request,
    theme_id: int,
    subtheme_id: int,
    article_id: int,
    title: str = Form(...),
    content: str = Form(""),
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_editor),
) -> RedirectResponse:
    article = await session.get(Article, article_id)
    article.title = title
    article.content = content
    await session.commit()
    return RedirectResponse(
        url=f"/themes/{theme_id}/subthemes/{subtheme_id}/articles/{article.id}",
        status_code=303,
    )


@router.post("/{article_id}/delete")
async def delete_article(
    request: Request,
    theme_id: int,
    subtheme_id: int,
    article_id: int,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_editor),
) -> RedirectResponse:
    article = await session.get(Article, article_id)
    await session.delete(article)
    await session.commit()
    return RedirectResponse(url=f"/themes/{theme_id}/subthemes/{subtheme_id}", status_code=303)
