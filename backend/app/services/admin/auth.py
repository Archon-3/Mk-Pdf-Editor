"""Simple admin session tokens (password from env)."""

from __future__ import annotations

import hashlib
import hmac
import os
import secrets
import time
from typing import Any

# token -> expiry unix
_SESSIONS: dict[str, float] = {}
SESSION_TTL_SECONDS = 60 * 60 * 12


def admin_password() -> str:
    return (os.environ.get('ADMIN_PASSWORD') or 'mkpdf-admin').strip()


def verify_password(password: str) -> bool:
    expected = admin_password()
    return hmac.compare_digest((password or '').strip(), expected)


def create_session() -> dict[str, Any]:
    token = secrets.token_urlsafe(32)
    _SESSIONS[token] = time.time() + SESSION_TTL_SECONDS
    return {
        'token': token,
        'expiresIn': SESSION_TTL_SECONDS,
    }


def revoke_session(token: str | None) -> None:
    if token:
        _SESSIONS.pop(token, None)


def session_valid(token: str | None) -> bool:
    if not token:
        return False
    expires = _SESSIONS.get(token)
    if expires is None:
        return False
    if time.time() > expires:
        _SESSIONS.pop(token, None)
        return False
    return True


def password_fingerprint() -> str:
    """Non-secret hint so the UI can show that a custom password is configured."""
    digest = hashlib.sha256(admin_password().encode('utf-8')).hexdigest()
    return digest[:8]
