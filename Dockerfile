FROM python:3.13.9-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY pyproject.toml uv.lock* /app/

RUN uv sync --frozen --no-dev

COPY ./app /app/

RUN addgroup --system --gid 1001 appuser && \
    adduser --system --uid 1001 --home /home/appuser appuser && \
    mkdir -p /home/appuser/.cache && \
    chown -R appuser:appuser /app /home/appuser

USER appuser

ENV HOME=/home/appuser

EXPOSE 7086

CMD ["uv", "run", "uvicorn", "main:http_api_app", "--host", "0.0.0.0", "--port", "7086"]
