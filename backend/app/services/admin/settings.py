"""Persistent admin settings for limits, pricing, and site controls."""

from __future__ import annotations

import json
import threading
import time
from copy import deepcopy
from pathlib import Path
from typing import Any

_lock = threading.Lock()
_CACHE: dict[str, Any] = {'mtime': None, 'data': None, 'loaded_at': 0.0}

DEFAULT_SETTINGS: dict[str, Any] = {
    'limits': {
        'free': {
            'maxFileMb': 50,
            'maxJobsPerDay': 15,
            'maxMergeFiles': 3,
        },
        'pro': {
            'maxFileMb': 200,
            'maxJobsPerDay': 500,
            'maxMergeFiles': 30,
        },
    },
    'pricing': {
        'free': {
            'name': 'Free',
            'price': '$0',
            'period': '/ forever',
            'details': 'Basic features included',
            'features': [
                'All tools access',
                'Up to 50MB per file',
                '15 tool runs per day',
                'Merge up to 3 PDFs',
                'Standard processing',
            ],
            'cta': 'Get Started',
            'badge': '',
            'featured': False,
            'checkout': 'free',
        },
        'pro_monthly': {
            'name': 'Pro Monthly',
            'price': '$9.99',
            'amount': '9.99',
            'currency': 'USD',
            'period': '/ month',
            'details': 'Billed monthly via PayPal',
            'features': [
                'All tools access',
                'Files up to 200MB',
                '500 tool runs per day',
                'Merge up to 30 PDFs',
                'Priority support',
            ],
            'cta': 'Upgrade Monthly',
            'badge': 'Most Popular',
            'featured': True,
            'checkout': 'paypal',
        },
        'pro_annual': {
            'name': 'Pro Annual',
            'price': '$59.99',
            'amount': '59.99',
            'currency': 'USD',
            'period': '/ year',
            'details': 'Billed annually via PayPal · save ~50%',
            'features': [
                'All tools access',
                'Files up to 200MB',
                '500 tool runs per day',
                'Merge up to 30 PDFs',
                'Priority support',
            ],
            'cta': 'Upgrade Annual',
            'badge': 'Best Value',
            'featured': False,
            'checkout': 'paypal',
        },
    },
    'site': {
        'maintenanceMode': False,
        'adsenseEnabled': True,
        'supportEmail': 'support@mkpdfeditor.com',
        'announcement': '',
    },
    'meta': {
        'updatedAt': '',
        'version': 1,
    },
}


def _settings_path() -> Path:
    root = Path(__file__).resolve().parents[3]
    path = root / 'output' / 'admin_settings.json'
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _deep_merge(base: dict[str, Any], overlay: dict[str, Any]) -> dict[str, Any]:
    result = deepcopy(base)
    for key, value in overlay.items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = value
    return result


def _invalidate_cache() -> None:
    _CACHE['mtime'] = None
    _CACHE['data'] = None


def load_settings() -> dict[str, Any]:
    path = _settings_path()
    with _lock:
        mtime = path.stat().st_mtime if path.exists() else 0
        if _CACHE['data'] is not None and _CACHE['mtime'] == mtime:
            return deepcopy(_CACHE['data'])

        if not path.exists():
            data = deepcopy(DEFAULT_SETTINGS)
            data['meta']['updatedAt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
            path.write_text(json.dumps(data, indent=2), encoding='utf-8')
            _CACHE['data'] = data
            _CACHE['mtime'] = path.stat().st_mtime
            return deepcopy(data)

        try:
            stored = json.loads(path.read_text(encoding='utf-8'))
            if not isinstance(stored, dict):
                data = deepcopy(DEFAULT_SETTINGS)
            else:
                data = _deep_merge(DEFAULT_SETTINGS, stored)
        except Exception:
            data = deepcopy(DEFAULT_SETTINGS)

        _CACHE['data'] = data
        _CACHE['mtime'] = mtime
        _CACHE['loaded_at'] = time.time()
        return deepcopy(data)


def save_settings(settings: dict[str, Any]) -> dict[str, Any]:
    merged = _deep_merge(DEFAULT_SETTINGS, settings)
    merged.setdefault('meta', {})
    merged['meta']['updatedAt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    merged['meta']['version'] = int(merged['meta'].get('version') or 1) + 1
    path = _settings_path()
    with _lock:
        path.write_text(json.dumps(merged, indent=2), encoding='utf-8')
        _CACHE['data'] = merged
        _CACHE['mtime'] = path.stat().st_mtime
    return deepcopy(merged)


def public_settings() -> dict[str, Any]:
    settings = load_settings()
    return {
        'limits': settings['limits'],
        'pricing': settings['pricing'],
        'site': {
            'maintenanceMode': bool(settings['site'].get('maintenanceMode')),
            'adsenseEnabled': bool(settings['site'].get('adsenseEnabled')),
            'supportEmail': settings['site'].get('supportEmail') or '',
            'announcement': settings['site'].get('announcement') or '',
        },
        'meta': settings.get('meta') or {},
    }


def update_settings(patch: dict[str, Any]) -> dict[str, Any]:
    current = load_settings()
    merged = _deep_merge(current, patch)
    return save_settings(merged)


def reset_settings() -> dict[str, Any]:
    _invalidate_cache()
    return save_settings(deepcopy(DEFAULT_SETTINGS))
