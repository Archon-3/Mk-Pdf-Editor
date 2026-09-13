"""Managed users and per-user tool limits (admin-controlled)."""

from __future__ import annotations

import json
import threading
import time
from copy import deepcopy
from pathlib import Path
from typing import Any

_lock = threading.Lock()
_CACHE: dict[str, Any] = {'mtime': None, 'data': None}

DEFAULT_USER = {
    'email': '',
    'uid': '',
    'plan': 'free',
    'blocked': False,
    'maxFileMb': None,
    'maxJobsPerDay': None,
    'maxMergeFiles': None,
    'note': '',
    'updatedAt': '',
}


def _users_path() -> Path:
    root = Path(__file__).resolve().parents[3]
    path = root / 'output' / 'admin_users.json'
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _empty() -> dict[str, Any]:
    return {'users': {}}


def _read_disk() -> dict[str, Any]:
    path = _users_path()
    if not path.exists():
        payload = _empty()
        path.write_text(json.dumps(payload, indent=2), encoding='utf-8')
        return payload
    try:
        data = json.loads(path.read_text(encoding='utf-8'))
        if not isinstance(data, dict) or not isinstance(data.get('users'), dict):
            return _empty()
        return data
    except Exception:
        return _empty()


def load_users() -> dict[str, Any]:
    path = _users_path()
    with _lock:
        try:
            mtime = path.stat().st_mtime if path.exists() else None
        except OSError:
            mtime = None
        if _CACHE['data'] is not None and _CACHE['mtime'] == mtime:
            return deepcopy(_CACHE['data'])
        data = _read_disk()
        _CACHE['data'] = data
        _CACHE['mtime'] = mtime
        return deepcopy(data)


def save_users(payload: dict[str, Any]) -> dict[str, Any]:
    path = _users_path()
    clean = {'users': payload.get('users') if isinstance(payload.get('users'), dict) else {}}
    with _lock:
        path.write_text(json.dumps(clean, indent=2), encoding='utf-8')
        try:
            _CACHE['mtime'] = path.stat().st_mtime
        except OSError:
            _CACHE['mtime'] = None
        _CACHE['data'] = clean
    return deepcopy(clean)


def list_users() -> list[dict[str, Any]]:
    users = load_users().get('users') or {}
    rows = []
    seen: set[str] = set()
    for key, value in users.items():
        if not isinstance(value, dict):
            continue
        email = str(value.get('email') or '').lower()
        uid = str(value.get('uid') or '')
        dedupe = email or uid or key
        if dedupe in seen:
            continue
        seen.add(dedupe)
        row = {**DEFAULT_USER, **value, 'id': email or key}
        rows.append(row)
    rows.sort(key=lambda item: (item.get('email') or item.get('id') or '').lower())
    return rows


def upsert_user(body: dict[str, Any]) -> dict[str, Any]:
    email = str(body.get('email') or '').strip().lower()
    uid = str(body.get('uid') or '').strip()
    key = email or uid
    if not key:
        raise ValueError('Email or uid is required.')

    users_doc = load_users()
    users = users_doc.setdefault('users', {})
    current = {**DEFAULT_USER, **(users.get(key) or {})}
    current['email'] = email or current.get('email') or ''
    current['uid'] = uid or current.get('uid') or ''
    current['plan'] = str(body.get('plan') or current.get('plan') or 'free').strip().lower()
    current['blocked'] = bool(body.get('blocked', current.get('blocked')))
    current['note'] = str(body.get('note') if body.get('note') is not None else current.get('note') or '')
    current['updatedAt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

    for field in ('maxFileMb', 'maxJobsPerDay', 'maxMergeFiles'):
        if field in body:
            value = body.get(field)
            if value is None or value == '':
                current[field] = None
            else:
                current[field] = max(1, int(value))

    users[key] = current
    # Also index by uid if present so lookups work either way.
    if uid and uid != key:
        users[uid] = {**current}
    save_users(users_doc)
    return {**current, 'id': key}


def delete_user(user_id: str) -> bool:
    key = (user_id or '').strip().lower()
    if not key:
        return False
    users_doc = load_users()
    users = users_doc.get('users') or {}
    removed = False
    # Match by key, email, or uid
    to_delete = []
    for existing_key, value in users.items():
        email = str((value or {}).get('email') or '').lower()
        uid = str((value or {}).get('uid') or '')
        if existing_key.lower() == key or email == key or uid == user_id.strip():
            to_delete.append(existing_key)
    for item in to_delete:
        users.pop(item, None)
        removed = True
    if removed:
        save_users(users_doc)
    return removed


def find_user(*, email: str | None = None, uid: str | None = None) -> dict[str, Any] | None:
    users = load_users().get('users') or {}
    email_key = (email or '').strip().lower()
    uid_key = (uid or '').strip()
    if email_key and email_key in users:
        return {**DEFAULT_USER, **users[email_key], 'id': email_key}
    if uid_key and uid_key in users:
        return {**DEFAULT_USER, **users[uid_key], 'id': uid_key}
    for key, value in users.items():
        if not isinstance(value, dict):
            continue
        if email_key and str(value.get('email') or '').lower() == email_key:
            return {**DEFAULT_USER, **value, 'id': key}
        if uid_key and str(value.get('uid') or '') == uid_key:
            return {**DEFAULT_USER, **value, 'id': key}
    return None
