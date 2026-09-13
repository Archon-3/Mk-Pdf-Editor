"""Plan limits for Free vs Pro users (plus unlimited developer mode).

Numeric caps are loaded from admin settings when available.
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any

FREE_MAX_FILE_BYTES = 50 * 1024 * 1024
PRO_MAX_FILE_BYTES = 200 * 1024 * 1024
DEV_MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024
FREE_MAX_JOBS_PER_DAY = 15
PRO_MAX_JOBS_PER_DAY = 500
DEV_MAX_JOBS_PER_DAY = 100_000
FREE_MAX_MERGE_FILES = 3
PRO_MAX_MERGE_FILES = 30
DEV_MAX_MERGE_FILES = 500

PRO_PLANS = {'pro_monthly', 'pro_annual', 'pro'}
DEV_PLANS = {'developer', 'dev', 'unlimited'}


def _env_force_unlimited() -> bool:
    """Optional global unlock for local API testing (set DEV_UNLIMITED=1). Off by default."""
    return os.getenv('DEV_UNLIMITED', '').strip().lower() in {'1', 'true', 'yes', 'on'}


def _configured_limits() -> dict[str, Any]:
    try:
        from backend.app.services.admin.settings import load_settings
        return load_settings().get('limits') or {}
    except Exception:
        return {}


def _tier_bytes(tier: str, fallback: int) -> int:
    limits = _configured_limits().get(tier) or {}
    mb = limits.get('maxFileMb')
    try:
        if mb is not None:
            return max(1, int(mb)) * 1024 * 1024
    except (TypeError, ValueError):
        pass
    return fallback


def _tier_jobs(tier: str, fallback: int) -> int:
    limits = _configured_limits().get(tier) or {}
    value = limits.get('maxJobsPerDay')
    try:
        if value is not None:
            return max(1, int(value))
    except (TypeError, ValueError):
        pass
    return fallback


def _tier_merge(tier: str, fallback: int) -> int:
    limits = _configured_limits().get(tier) or {}
    value = limits.get('maxMergeFiles')
    try:
        if value is not None:
            return max(1, int(value))
    except (TypeError, ValueError):
        pass
    return fallback


def normalize_plan(plan_id: str | None) -> str:
    value = (plan_id or 'free').strip().lower()
    if value in DEV_PLANS:
        return 'developer'
    if value in PRO_PLANS:
        return value if value != 'pro' else 'pro_monthly'
    return 'free'


def is_developer(plan_id: str | None) -> bool:
    return normalize_plan(plan_id) == 'developer' or _env_force_unlimited()


def is_pro(plan_id: str | None) -> bool:
    plan = normalize_plan(plan_id)
    return is_developer(plan_id) or plan in {'pro_monthly', 'pro_annual'}


def limits_for(
    plan_id: str | None,
    *,
    user_email: str | None = None,
    user_uid: str | None = None,
) -> dict[str, Any]:
    managed = None
    try:
        from backend.app.services.admin.users import find_user
        managed = find_user(email=user_email, uid=user_uid)
    except Exception:
        managed = None

    if managed and managed.get('blocked'):
        return {
            'plan': 'blocked',
            'isPro': False,
            'isDeveloper': False,
            'blocked': True,
            'maxFileBytes': 0,
            'maxFileLabel': '0MB',
            'maxJobsPerDay': 0,
            'maxMergeFiles': 0,
            'message': 'This account is blocked by an administrator.',
        }

    effective_plan = plan_id
    if managed and managed.get('plan'):
        effective_plan = managed.get('plan')

    if is_developer(effective_plan):
        return {
            'plan': 'developer',
            'isPro': True,
            'isDeveloper': True,
            'blocked': False,
            'maxFileBytes': DEV_MAX_FILE_BYTES,
            'maxFileLabel': '2GB',
            'maxJobsPerDay': DEV_MAX_JOBS_PER_DAY,
            'maxMergeFiles': DEV_MAX_MERGE_FILES,
        }

    if is_pro(effective_plan):
        max_bytes = _tier_bytes('pro', PRO_MAX_FILE_BYTES)
        max_jobs = _tier_jobs('pro', PRO_MAX_JOBS_PER_DAY)
        max_merge = _tier_merge('pro', PRO_MAX_MERGE_FILES)
        base = {
            'plan': normalize_plan(effective_plan),
            'isPro': True,
            'isDeveloper': False,
            'blocked': False,
            'maxFileBytes': max_bytes,
            'maxFileLabel': f'{max(1, max_bytes // (1024 * 1024))}MB',
            'maxJobsPerDay': max_jobs,
            'maxMergeFiles': max_merge,
        }
    else:
        max_bytes = _tier_bytes('free', FREE_MAX_FILE_BYTES)
        max_jobs = _tier_jobs('free', FREE_MAX_JOBS_PER_DAY)
        max_merge = _tier_merge('free', FREE_MAX_MERGE_FILES)
        base = {
            'plan': 'free',
            'isPro': False,
            'isDeveloper': False,
            'blocked': False,
            'maxFileBytes': max_bytes,
            'maxFileLabel': f'{max(1, max_bytes // (1024 * 1024))}MB',
            'maxJobsPerDay': max_jobs,
            'maxMergeFiles': max_merge,
        }

    if managed:
        if managed.get('maxFileMb') is not None:
            mb = max(1, int(managed['maxFileMb']))
            base['maxFileBytes'] = mb * 1024 * 1024
            base['maxFileLabel'] = f'{mb}MB'
        if managed.get('maxJobsPerDay') is not None:
            base['maxJobsPerDay'] = max(1, int(managed['maxJobsPerDay']))
        if managed.get('maxMergeFiles') is not None:
            base['maxMergeFiles'] = max(1, int(managed['maxMergeFiles']))
        base['managedUser'] = True

    return base


def _usage_path() -> Path:
    root = Path(__file__).resolve().parents[3]
    path = root / 'output' / 'plan_usage.json'
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _read_usage() -> dict[str, Any]:
    path = _usage_path()
    if not path.exists():
        return {'day': '', 'clients': {}}
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except Exception:
        return {'day': '', 'clients': {}}


def _write_usage(payload: dict[str, Any]) -> None:
    _usage_path().write_text(json.dumps(payload), encoding='utf-8')


def _today() -> str:
    return time.strftime('%Y-%m-%d')


def usage_snapshot() -> dict[str, Any]:
    usage = _read_usage()
    today = _today()
    clients = usage.get('clients') if usage.get('day') == today else {}
    if not isinstance(clients, dict):
        clients = {}
    ranked = sorted(
        ({'client': key, 'jobs': int(value)} for key, value in clients.items()),
        key=lambda item: item['jobs'],
        reverse=True,
    )
    return {
        'day': today if usage.get('day') == today else today,
        'totalJobs': sum(item['jobs'] for item in ranked),
        'activeClients': len(ranked),
        'clients': ranked[:100],
        'freeLimits': limits_for('free'),
        'proLimits': limits_for('pro_monthly'),
    }


def clear_usage() -> None:
    _write_usage({'day': _today(), 'clients': {}})


def check_and_consume_job(
    client_key: str,
    plan_id: str | None,
    *,
    user_email: str | None = None,
    user_uid: str | None = None,
) -> dict[str, Any]:
    """Track daily job usage and reject free users who exceed the daily cap."""
    limits = limits_for(plan_id, user_email=user_email, user_uid=user_uid)
    if limits.get('blocked'):
        return {
            'allowed': False,
            'code': 'USER_BLOCKED',
            'message': limits.get('message') or 'This account is blocked by an administrator.',
            'used': 0,
            'limit': 0,
            'limits': limits,
        }
    if limits.get('isDeveloper'):
        return {
            'allowed': True,
            'used': 0,
            'limit': limits['maxJobsPerDay'],
            'limits': limits,
        }

    key = (user_email or user_uid or client_key or 'anonymous').strip() or 'anonymous'
    usage = _read_usage()
    today = _today()
    if usage.get('day') != today:
        usage = {'day': today, 'clients': {}}

    clients = usage.setdefault('clients', {})
    current = int(clients.get(key, 0))
    if current >= int(limits['maxJobsPerDay']):
        return {
            'allowed': False,
            'code': 'DAILY_LIMIT',
            'message': (
                f"Free plan allows {limits['maxJobsPerDay']} tool runs per day. "
                'Upgrade to Pro for a much higher daily limit.'
                if not limits['isPro']
                else f"Daily Pro limit of {limits['maxJobsPerDay']} runs reached. Try again tomorrow."
            ),
            'used': current,
            'limit': limits['maxJobsPerDay'],
            'limits': limits,
        }

    clients[key] = current + 1
    _write_usage(usage)
    return {
        'allowed': True,
        'used': current + 1,
        'limit': limits['maxJobsPerDay'],
        'limits': limits,
    }


def validate_plan_constraints(
    *,
    plan_id: str | None,
    file_sizes: list[int],
    tool_id: str,
    file_count: int,
    user_email: str | None = None,
    user_uid: str | None = None,
) -> dict[str, Any]:
    limits = limits_for(plan_id, user_email=user_email, user_uid=user_uid)
    if limits.get('blocked'):
        return {
            'valid': False,
            'code': 'USER_BLOCKED',
            'message': limits.get('message') or 'This account is blocked by an administrator.',
            'limits': limits,
        }
    if limits.get('isDeveloper'):
        return {'valid': True, 'code': 'OK', 'message': 'Developer unlimited.', 'limits': limits}

    max_bytes = int(limits['maxFileBytes'])

    for size in file_sizes:
        if size > max_bytes:
            return {
                'valid': False,
                'code': 'FILE_TOO_LARGE',
                'message': (
                    f"Free plan allows files up to {limits['maxFileLabel']}. "
                    'Upgrade to Pro for larger files.'
                    if not limits['isPro']
                    else f"This file exceeds the Pro upload limit of {limits['maxFileLabel']}."
                ),
                'limits': limits,
            }

    if tool_id == 'merge' and file_count > int(limits['maxMergeFiles']):
        return {
            'valid': False,
            'code': 'MERGE_LIMIT',
            'message': (
                f"Free plan can merge up to {limits['maxMergeFiles']} PDFs at once. "
                'Upgrade to Pro to merge more files.'
                if not limits['isPro']
                else f"Pro merge limit is {limits['maxMergeFiles']} files per run."
            ),
            'limits': limits,
        }

    return {'valid': True, 'code': 'OK', 'message': 'Plan limits ok.', 'limits': limits}
