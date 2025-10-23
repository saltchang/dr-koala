FROM python:3.13.9-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY pyproject.toml uv.lock* /app/

RUN uv sync --frozen --no-dev

COPY ./app /app/

EXPOSE 7086

CMD ["uv", "run", "uvicorn", "main:http_api_app", "--host", "0.0.0.0", "--port", "7086"]
