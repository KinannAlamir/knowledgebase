# Personal Wiki

A personal knowledge base website built with FastAPI and SQLite.

## Setup

```bash
# Install uv if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies
uv sync

# Run the app
uv run python -m personal_wiki

# Run ruff checks
uv run ruff check .
uv run ruff format --check .
```

## Features

- **Themes** – Top-level categories for organizing knowledge
- **Subthemes** – Nested sections within themes
- **Rich Content** – Write articles with a rich text editor
- **Image Uploads** – Attach images to your content
- **Full CRUD** – Create, read, update, and delete everything from the web UI

Project structure:

app.py — FastAPI app with lifespan, static file mounts, router includes
models.py — SQLAlchemy models: Theme → Subtheme → Article (hierarchical)
database.py — Async SQLite via aiosqlite, session management
routes — CRUD routes for themes, subthemes, articles, and image uploads
templates — Jinja2 templates (base layout, list/detail/form for each entity)
static — CSS (dark/light theme, responsive) + JS (rich text editor, image paste/upload)
Features:

📁 Themes → 📄 Subthemes → 📝 Articles hierarchy
✍️ Rich text editor with bold, italic, headings, lists, quotes, code blocks
🖼️ Image upload (click or paste) stored in uploads
🌓 Dark/light mode toggle (persisted in localStorage)
📱 Responsive sidebar layout
🗑️ Full CRUD with delete confirmations
Commands:

uv run python -m personal_wiki — start the server
uv run ruff check . — lint
uv run ruff format . — format
