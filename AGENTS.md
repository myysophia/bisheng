# Repository Guidelines

Use this guide to get productive quickly in this repo. It reflects how this project is structured and how we build, test, and contribute changes.

## Project Structure & Module Organization
- `src/backend/`: FastAPI backend (Python 3.10), Poetry project at `src/backend/pyproject.toml`. Key entrypoints: `bisheng/main.py`, CLI `bisheng/__main__.py`.
- `src/backend/test/`: Backend tests and utility scripts (pytest).
- `src/frontend/client/`: Vite + React app for Bisheng Chat (`package.json` scripts).
- `src/frontend/platform/`: Vite + React “platform” UI.
- `docker/`: Compose files and deployment assets.

## Build, Test, and Development Commands
- Backend setup: `cd src/backend && poetry install` (Python 3.10 required).
- Run backend (dev): `poetry run bisheng serve --dev` or `poetry run uvicorn bisheng.main:app --reload --port 7860`.
- Backend tests: `poetry run pytest -q` (add `--cov` if desired).
- Frontend (client): `cd src/frontend/client && npm install && npm run start` (build: `npm run build`, tests: `npm test`).
- Frontend (platform): `cd src/frontend/platform && npm install && npm run start` (build: `npm run build`).

## Coding Style & Naming Conventions
- Python: prefer Black formatting and Ruff linting (line length 120). Pre-commit runs flake8, isort, and yapf; install with `poetry run pre-commit install`.
- Tests: name files `test_*.py` (backend) and `*.test.tsx?/*.spec.tsx?` (frontend).
- Use clear snake_case for Python, camelCase/PascalCase for TS/React components.

## Testing Guidelines
- Backend: pytest; focus on services, APIs, and workflow nodes. Run `poetry run pytest -q`. Optional coverage: `pytest --cov bisheng`.
- Frontend: jest + testing-library in `src/frontend/client` (`npm test` or `npm run test:ci`).

## Commit & Pull Request Guidelines
- Commit style follows Conventional Commits seen in history: `feat:`, `fix:`, `chore:`, etc. Keep subjects concise; English or Chinese is acceptable.
- PRs should include: clear description, linked issue(s), test plan, and screenshots/GIFs for UI changes. Note any config/env impacts.
- Keep changes focused; update docs when behavior or commands change.

## Security & Configuration Tips
- Secrets via env vars; backend CLI loads `.env` (see `bisheng/__main__.py`). Avoid committing secrets.
- Default dev port: `7860`. Frontend dev servers proxy to backend as configured.

