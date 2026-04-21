from __future__ import annotations

from pathlib import Path

from jinja2 import pass_context
from starlette.templating import Jinja2Templates

TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"

templates = Jinja2Templates(directory=str(TEMPLATES_DIR))


@pass_context
def truncate_html(context: dict, value: str, length: int = 200) -> str:
    """Strip HTML tags and truncate text for previews."""
    import re

    clean = re.sub(r"<[^>]+>", "", value)
    if len(clean) <= length:
        return clean
    return clean[:length].rsplit(" ", 1)[0] + "…"


templates.env.filters["truncate_html"] = truncate_html
