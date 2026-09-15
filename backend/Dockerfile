FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend

CMD gunicorn --bind 0.0.0.0:$PORT "backend.app:create_app()"