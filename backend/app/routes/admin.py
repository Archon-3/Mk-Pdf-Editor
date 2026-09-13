"""Admin API: login, settings, usage, system status."""

from __future__ import annotations

import functools
import os
from typing import Any, Callable

from flask import Blueprint, jsonify, request

from backend.app.services.admin.auth import (
    create_session,
    revoke_session,
    session_valid,
    verify_password,
)
from backend.app.services.admin.settings import load_settings, public_settings, reset_settings, update_settings
from backend.app.services.admin.users import delete_user, list_users, upsert_user
from backend.app.services.payments.paypal import (
    PLAN_CATALOG,
    get_plan,
    is_practice_paypal,
    paypal_configured,
    paypal_mode,
)
from backend.app.services.plans.limits import clear_usage, usage_snapshot

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# Avoid scanning the disk for LibreOffice on every admin refresh.
_LIBREOFFICE_CACHE: bool | None = None


def _token_from_request() -> str | None:
    header = request.headers.get('X-MK-Admin-Token') or request.headers.get('Authorization') or ''
    if header.lower().startswith('bearer '):
        return header[7:].strip()
    return header.strip() or None


def require_admin(view: Callable[..., Any]):
    @functools.wraps(view)
    def wrapped(*args: Any, **kwargs: Any):
        if not session_valid(_token_from_request()):
            return jsonify({
                'success': False,
                'error': {'code': 'UNAUTHORIZED', 'message': 'Admin login required.'},
            }), 401
        return view(*args, **kwargs)

    return wrapped


def _mask_secret(value: str) -> str:
    text = (value or '').strip()
    if not text:
        return ''
    if len(text) <= 8:
        return text[:2] + '••••'
    return f'{text[:6]}…{text[-4:]}'


def _paypal_showcase() -> dict[str, Any]:
    """Sandbox panel payload — safe to display in admin (no secrets)."""
    client_id = (os.environ.get('PAYPAL_CLIENT_ID') or '').strip()
    mode = paypal_mode()
    configured = paypal_configured()
    practice = is_practice_paypal()
    pricing = (load_settings().get('pricing') or {})
    plans = []
    for plan_id in ('pro_monthly', 'pro_annual'):
        live = get_plan(plan_id) or PLAN_CATALOG.get(plan_id) or {}
        card = pricing.get(plan_id) or {}
        plans.append({
            'id': plan_id,
            'name': card.get('name') or live.get('name'),
            'amount': card.get('amount') or live.get('amount'),
            'currency': card.get('currency') or live.get('currency') or 'USD',
            'interval': live.get('interval'),
            'priceLabel': card.get('price') or f"${live.get('amount')}",
        })

    if configured:
        client_label = _mask_secret(client_id)
        status_note = f'Running in {mode} mode. Use sandbox buyer accounts for test checkouts.'
    elif practice:
        client_label = _mask_secret(client_id) or 'AYpractice…'
        status_note = (
            'Practice sandbox credentials are set. Checkout uses local DEMO mode until you paste '
            'real Client ID + Secret from developer.paypal.com.'
        )
    else:
        client_label = 'AXxx…demo (not set)'
        status_note = (
            'PayPal Sandbox is for testing only — no real money moves. '
            'Connect sandbox Client ID + Secret in .env to enable live checkout tests.'
        )

    return {
        'mode': mode,
        'configured': configured,
        'practice': practice,
        'clientIdMasked': client_label,
        'secretConfigured': bool((os.environ.get('PAYPAL_CLIENT_SECRET') or '').strip()),
        'apiBase': (
            'https://api-m.paypal.com'
            if mode == 'live'
            else 'https://api-m.sandbox.paypal.com'
        ),
        'dashboardUrl': 'https://developer.paypal.com/dashboard/',
        'sandboxAccountsUrl': 'https://developer.paypal.com/dashboard/accounts',
        'checkoutReturn': f"{(os.environ.get('FRONTEND_URL') or 'http://localhost:5173').rstrip('/')}/checkout/success",
        'checkoutCancel': f"{(os.environ.get('FRONTEND_URL') or 'http://localhost:5173').rstrip('/')}/checkout/cancel",
        'plans': plans,
        'demoNote': status_note,
    }


def _libreoffice_available() -> bool:
    global _LIBREOFFICE_CACHE
    if _LIBREOFFICE_CACHE is not None:
        return _LIBREOFFICE_CACHE
    try:
        from backend.app.services.conversion.office_renderer import has_libreoffice
        _LIBREOFFICE_CACHE = bool(has_libreoffice())
    except Exception:
        _LIBREOFFICE_CACHE = False
    return _LIBREOFFICE_CACHE


@bp.get('/public-settings')
def get_public_settings():
    """Public pricing + limits used by the marketing site and editor."""
    return jsonify({'success': True, **public_settings()})


@bp.post('/login')
def login():
    body = request.get_json(silent=True) or {}
    password = str(body.get('password') or '')
    if not verify_password(password):
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_PASSWORD', 'message': 'Incorrect admin password.'},
        }), 401
    session = create_session()
    return jsonify({
        'success': True,
        'token': session['token'],
        'expiresIn': session['expiresIn'],
    })


@bp.post('/logout')
@require_admin
def logout():
    revoke_session(_token_from_request())
    return jsonify({'success': True})


@bp.get('/me')
@require_admin
def me():
    return jsonify({'success': True, 'authenticated': True})


@bp.get('/settings')
@require_admin
def get_settings():
    return jsonify({'success': True, 'settings': load_settings()})


@bp.put('/settings')
@require_admin
def put_settings():
    body = request.get_json(silent=True) or {}
    patch = body.get('settings') if isinstance(body.get('settings'), dict) else body
    if not isinstance(patch, dict):
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_BODY', 'message': 'Expected settings object.'},
        }), 400
    settings = update_settings(patch)
    return jsonify({'success': True, 'settings': settings})


@bp.post('/settings/reset')
@require_admin
def reset_admin_settings():
    settings = reset_settings()
    return jsonify({'success': True, 'settings': settings})


@bp.post('/usage/clear')
@require_admin
def clear_admin_usage():
    clear_usage()
    return jsonify({'success': True, **usage_snapshot()})


@bp.get('/users')
@require_admin
def get_users():
    return jsonify({'success': True, 'users': list_users()})


@bp.post('/users')
@require_admin
def post_user():
    body = request.get_json(silent=True) or {}
    try:
        user = upsert_user(body)
    except ValueError as error:
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_USER', 'message': str(error)},
        }), 400
    except Exception as error:
        return jsonify({
            'success': False,
            'error': {'code': 'USER_SAVE_FAILED', 'message': str(error)},
        }), 500
    return jsonify({'success': True, 'user': user})


@bp.delete('/users/<user_id>')
@require_admin
def remove_user(user_id: str):
    deleted = delete_user(user_id)
    if not deleted:
        return jsonify({
            'success': False,
            'error': {'code': 'NOT_FOUND', 'message': 'User not found.'},
        }), 404
    return jsonify({'success': True})


@bp.get('/usage')
@require_admin
def get_usage():
    return jsonify({'success': True, **usage_snapshot()})


@bp.get('/system')
@require_admin
def get_system():
    firebase_project = (os.environ.get('VITE_FIREBASE_PROJECT_ID') or '').strip()
    return jsonify({
        'success': True,
        'system': {
            'paypalConfigured': paypal_configured(),
            'paypalMode': paypal_mode(),
            'libreOfficeAvailable': _libreoffice_available(),
            'adsenseConfigured': bool((os.environ.get('VITE_ADSENSE_CLIENT_ID') or '').strip()),
            'firebaseConfigured': bool(
                (os.environ.get('VITE_FIREBASE_API_KEY') or '').strip()
                and firebase_project
                and (os.environ.get('VITE_FIREBASE_APP_ID') or '').strip()
            ),
            'firebaseProjectId': firebase_project or None,
            'adminPasswordSet': bool((os.environ.get('ADMIN_PASSWORD') or '').strip()),
            'paypal': _paypal_showcase(),
            'checklist': [
                {
                    'id': 'admin_password',
                    'label': 'Set ADMIN_PASSWORD in .env',
                    'done': bool((os.environ.get('ADMIN_PASSWORD') or '').strip()),
                },
                {
                    'id': 'firebase',
                    'label': 'Add Firebase web keys (VITE_FIREBASE_*)',
                    'done': bool(
                        (os.environ.get('VITE_FIREBASE_API_KEY') or '').strip()
                        and firebase_project
                    ),
                },
                {
                    'id': 'paypal',
                    'label': 'PayPal sandbox keys (or PAYPAL_DEMO=1)',
                    'done': paypal_configured() or (os.environ.get('PAYPAL_DEMO', '1').strip() in {'1', 'true', 'yes'}),
                },
                {
                    'id': 'libreoffice',
                    'label': 'LibreOffice installed for Office fidelity',
                    'done': _libreoffice_available(),
                },
            ],
        },
    })
