# Backend image for the Flask API (Render / any Docker host).
#
# Build from the repository root so the `backend` package is importable:
#   docker build -f backend/Dockerfile -t mk-pdf-backend .
#   docker run --rm -p 8000:8000 --env-file .env mk-pdf-backend
FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    LIBREOFFICE_PATH=/usr/bin/soffice

# LibreOffice (headless Office <-> PDF rendering, PDF import for PDF -> Word),
# Tesseract for pytesseract, and fonts so rendered documents keep their layout.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libreoffice-writer \
        libreoffice-calc \
        libreoffice-impress \
        libreoffice-draw \
        tesseract-ocr \
        fonts-dejavu \
        fonts-liberation \
        fonts-noto-core \
        fontconfig \
        curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install -r backend/requirements.txt gunicorn==23.0.0

COPY backend ./backend

# Runtime folders used by the app (mount a persistent disk at
# /app/backend/output on Render to keep admin settings/users across deploys).
RUN mkdir -p backend/uploads backend/output \
    && useradd --create-home --uid 10001 appuser \
    && chown -R appuser:appuser /app
USER appuser
ENV HOME=/home/appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:${PORT:-8000}/api/health" || exit 1

# Render injects PORT. One worker keeps in-memory admin sessions consistent;
# threads handle concurrent requests. Long timeout covers LibreOffice jobs.
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-8000} --workers 1 --threads ${GUNICORN_THREADS:-4} --timeout ${GUNICORN_TIMEOUT:-300} --access-logfile - --error-logfile - 'backend.app:create_app()'"]
