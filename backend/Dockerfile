FROM python:3.11-slim
#
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
#
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
#
ENV UV_SYSTEM_PYTHON=1 
#

WORKDIR /app

RUN apt-get update \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock* ./


RUN uv pip install -r pyproject.toml
COPY . .

EXPOSE 8084

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]