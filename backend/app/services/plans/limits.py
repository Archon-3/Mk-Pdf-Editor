"""Plan limits for Free vs Pro users (plus unlimited developer mode)."""

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


def limits_for(plan_id: str | None) -> dict[str, Any]:
    if is_developer(plan_id):
        return {
            'plan': 'developer',
            'isPro': True,
            'isDeveloper': True,
            'maxFileBytes': DEV_MAX_FILE_BYTES,
            'maxFileLabel': '2GB',
            'maxJobsPerDay': DEV_MAX_JOBS_PER_DAY,
            'maxMergeFiles': DEV_MAX_MERGE_FILES,
        }

    if is_pro(plan_id):
        return {
            'plan': normalize_plan(plan_id),
            'isPro': True,
            'isDeveloper': False,
            'maxFileBytes': PRO_MAX_FILE_BYTES,
            'maxFileLabel': '200MB',
            'maxJobsPerDay': PRO_MAX_JOBS_PER_DAY,
            'maxMergeFiles': PRO_MAX_MERGE_FILES,
        }

    return {
        'plan': 'free',
        'isPro': False,
        'isDeveloper': False,
        'maxFileBytes': FREE_MAX_FILE_BYTES,
        'maxFileLabel': '50MB',
        'maxJobsPerDay': FREE_MAX_JOBS_PER_DAY,
        'maxMergeFiles': FREE_MAX_MERGE_FILES,
    }


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


def check_and_consume_job(client_key: str, plan_id: str | None) -> dict[str, Any]:
    """Track daily job usage and reject free users who exceed the daily cap."""
    limits = limits_for(plan_id)
    if limits.get('isDeveloper'):
        return {
            'allowed': True,
            'used': 0,
            'limit': limits['maxJobsPerDay'],
            'limits': limits,
        }

    key = (client_key or 'anonymous').strip() or 'anonymous'
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
                f"Free plan allows {FREE_MAX_JOBS_PER_DAY} tool runs per day. "
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
) -> dict[str, Any]:
    limits = limits_for(plan_id)
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
