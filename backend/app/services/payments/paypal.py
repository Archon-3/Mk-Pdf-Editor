from __future__ import annotations

import os
from typing import Any

import requests


PLAN_CATALOG = {
    'pro_monthly': {
        'id': 'pro_monthly',
        'name': 'Pro Monthly',
        'description': 'MK PDF Editor Pro — billed monthly',
        'amount': '9.99',
        'currency': 'USD',
        'interval': 'monthly',
    },
    'pro_annual': {
        'id': 'pro_annual',
        'name': 'Pro Annual',
        'description': 'MK PDF Editor Pro — billed annually',
        'amount': '59.99',
        'currency': 'USD',
        'interval': 'annual',
    },
}


def paypal_mode() -> str:
    mode = (os.environ.get('PAYPAL_MODE') or 'sandbox').strip().lower()
    return 'live' if mode == 'live' else 'sandbox'


def paypal_api_base() -> str:
    return 'https://api-m.paypal.com' if paypal_mode() == 'live' else 'https://api-m.sandbox.paypal.com'


def _paypal_credentials() -> tuple[str, str]:
    return (
        (os.environ.get('PAYPAL_CLIENT_ID') or '').strip(),
        (os.environ.get('PAYPAL_CLIENT_SECRET') or '').strip(),
    )


def is_practice_paypal() -> bool:
    """Local placeholder credentials — never call the real PayPal API with these."""
    client_id, client_secret = _paypal_credentials()
    if not client_id or not client_secret:
        return False
    lowered = client_id.lower()
    return lowered.startswith('aypractice') or lowered.startswith('sb-practice')


def paypal_configured() -> bool:
    client_id, client_secret = _paypal_credentials()
    if not client_id or not client_secret:
        return False
    # Practice keys are for local demos; keep the DEMO checkout path.
    if is_practice_paypal():
        return False
    return True


def paypal_demo_enabled() -> bool:
    """Local/demo sandbox checkout when real PayPal keys are missing (default on)."""
    value = (os.environ.get('PAYPAL_DEMO') or '1').strip().lower()
    return value in {'1', 'true', 'yes', 'on'}


def frontend_base_url() -> str:
    return (os.environ.get('FRONTEND_URL') or 'http://localhost:5173').rstrip('/')


def create_demo_order(plan_id: str) -> dict[str, Any]:
    """Fake sandbox approval URL so pricing checkout works without PayPal keys."""
    plan = get_plan(plan_id)
    if not plan:
        raise ValueError('Unknown plan. Use pro_monthly or pro_annual.')

    order_id = f"DEMO-{plan_id}"
    approve_url = (
        f"{frontend_base_url()}/checkout/success"
        f"?token={order_id}&planId={plan_id}&demo=1"
    )
    return {
        'orderId': order_id,
        'status': 'CREATED',
        'approveUrl': approve_url,
        'plan': plan,
        'mode': 'sandbox',
        'demo': True,
    }


def capture_demo_order(order_id: str) -> dict[str, Any]:
    plan_id = 'pro_monthly'
    if order_id.startswith('DEMO-'):
        maybe = order_id.replace('DEMO-', '', 1).strip()
        if maybe in PLAN_CATALOG:
            plan_id = maybe
    plan = get_plan(plan_id) or PLAN_CATALOG['pro_monthly']
    return {
        'orderId': order_id,
        'status': 'COMPLETED',
        'planId': plan_id,
        'captureId': f'DEMO-CAPTURE-{plan_id}',
        'amount': {'value': plan['amount'], 'currency_code': plan.get('currency') or 'USD'},
        'payer': 'sandbox-buyer@mkpdfeditor.demo',
        'mode': 'sandbox',
        'demo': True,
    }


def get_plan(plan_id: str) -> dict[str, Any] | None:
    base = PLAN_CATALOG.get(plan_id)
    if not base:
        return None
    plan = dict(base)
    try:
        from backend.app.services.admin.settings import load_settings
        pricing = (load_settings().get('pricing') or {}).get(plan_id) or {}
        if pricing.get('amount'):
            plan['amount'] = str(pricing['amount'])
        if pricing.get('currency'):
            plan['currency'] = str(pricing['currency'])
        if pricing.get('name'):
            plan['name'] = str(pricing['name'])
        if pricing.get('details'):
            plan['description'] = str(pricing['details'])
    except Exception:
        pass
    return plan


def _access_token() -> str:
    client_id = os.environ.get('PAYPAL_CLIENT_ID', '').strip()
    client_secret = os.environ.get('PAYPAL_CLIENT_SECRET', '').strip()
    if not client_id or not client_secret:
        raise RuntimeError('PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.')

    response = requests.post(
        f'{paypal_api_base()}/v1/oauth2/token',
        headers={'Accept': 'application/json', 'Accept-Language': 'en_US'},
        data={'grant_type': 'client_credentials'},
        auth=(client_id, client_secret),
        timeout=30,
    )
    response.raise_for_status()
    token = response.json().get('access_token')
    if not token:
        raise RuntimeError('PayPal did not return an access token.')
    return token


def create_order(plan_id: str) -> dict[str, Any]:
    plan = get_plan(plan_id)
    if not plan:
        raise ValueError('Unknown plan. Use pro_monthly or pro_annual.')

    token = _access_token()
    success_url = f"{frontend_base_url()}/checkout/success"
    cancel_url = f"{frontend_base_url()}/checkout/cancel"
    interval = plan.get('interval') or 'monthly'

    payload = {
        'intent': 'CAPTURE',
        'purchase_units': [
            {
                'reference_id': plan['id'],
                'description': plan['description'],
                'custom_id': plan['id'],
                'soft_descriptor': 'MKPDF PRO',
                'amount': {
                    'currency_code': plan.get('currency') or 'USD',
                    'value': str(plan['amount']),
                    'breakdown': {
                        'item_total': {
                            'currency_code': plan.get('currency') or 'USD',
                            'value': str(plan['amount']),
                        },
                    },
                },
                'items': [
                    {
                        'name': plan.get('name') or 'MK PDF Editor Pro',
                        'description': f"{plan.get('description') or 'Pro plan'} ({interval})",
                        'sku': plan['id'],
                        'unit_amount': {
                            'currency_code': plan.get('currency') or 'USD',
                            'value': str(plan['amount']),
                        },
                        'quantity': '1',
                        'category': 'DIGITAL_GOODS',
                    }
                ],
            }
        ],
        'application_context': {
            'brand_name': 'MK PDF Editor',
            'locale': 'en-US',
            'landing_page': 'LOGIN',
            'user_action': 'PAY_NOW',
            'shipping_preference': 'NO_SHIPPING',
            'payment_method': {
                'payee_preferred': 'IMMEDIATE_PAYMENT_REQUIRED',
            },
            'return_url': success_url,
            'cancel_url': cancel_url,
        },
    }

    response = requests.post(
        f'{paypal_api_base()}/v2/checkout/orders',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}',
            'Prefer': 'return=representation',
        },
        json=payload,
        timeout=30,
    )
    if not response.ok:
        detail = ''
        try:
            detail = response.json().get('message') or response.json().get('details') or response.text
        except Exception:
            detail = response.text
        raise RuntimeError(f'PayPal order failed ({response.status_code}): {detail}')

    data = response.json()

    approve_url = next(
        (link.get('href') for link in data.get('links', []) if link.get('rel') == 'approve'),
        None,
    )
    if not approve_url:
        raise RuntimeError('PayPal order was created without an approval URL.')

    return {
        'orderId': data.get('id'),
        'status': data.get('status'),
        'approveUrl': approve_url,
        'plan': plan,
        'mode': paypal_mode(),
        'demo': False,
    }


def capture_order(order_id: str) -> dict[str, Any]:
    if not order_id:
        raise ValueError('Missing PayPal order id.')

    if str(order_id).startswith('DEMO-'):
        return capture_demo_order(order_id)

    token = _access_token()
    response = requests.post(
        f'{paypal_api_base()}/v2/checkout/orders/{order_id}/capture',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}',
            'Prefer': 'return=representation',
        },
        timeout=30,
    )
    if not response.ok:
        detail = ''
        try:
            body = response.json()
            detail = body.get('message') or body.get('details') or response.text
        except Exception:
            detail = response.text
        raise RuntimeError(f'PayPal capture failed ({response.status_code}): {detail}')

    data = response.json()

    capture = None
    purchase_units = data.get('purchase_units') or []
    if purchase_units:
        payments = purchase_units[0].get('payments') or {}
        captures = payments.get('captures') or []
        if captures:
            capture = captures[0]

    status = (data.get('status') or '').upper()
    capture_status = ((capture or {}).get('status') or '').upper()
    if status not in {'COMPLETED', 'APPROVED'} and capture_status not in {'COMPLETED', 'PENDING'}:
        raise RuntimeError(f'Payment was not completed (status: {status or "unknown"}).')

    return {
        'orderId': data.get('id'),
        'status': status or capture_status or 'COMPLETED',
        'planId': (purchase_units[0].get('custom_id') if purchase_units else None),
        'captureId': (capture or {}).get('id'),
        'amount': ((capture or {}).get('amount') or {}),
        'payer': ((data.get('payer') or {}).get('email_address')),
        'mode': paypal_mode(),
        'demo': False,
    }
