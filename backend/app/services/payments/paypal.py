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


def paypal_configured() -> bool:
    return bool(os.environ.get('PAYPAL_CLIENT_ID') and os.environ.get('PAYPAL_CLIENT_SECRET'))


def frontend_base_url() -> str:
    return (os.environ.get('FRONTEND_URL') or 'http://localhost:5173').rstrip('/')


def get_plan(plan_id: str) -> dict[str, Any] | None:
    return PLAN_CATALOG.get(plan_id)


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

    payload = {
        'intent': 'CAPTURE',
        'purchase_units': [
            {
                'reference_id': plan['id'],
                'description': plan['description'],
                'custom_id': plan['id'],
                'amount': {
                    'currency_code': plan['currency'],
                    'value': plan['amount'],
                },
            }
        ],
        'application_context': {
            'brand_name': 'MK PDF Editor',
            'landing_page': 'LOGIN',
            'user_action': 'PAY_NOW',
            'shipping_preference': 'NO_SHIPPING',
            'return_url': success_url,
            'cancel_url': cancel_url,
        },
    }

    response = requests.post(
        f'{paypal_api_base()}/v2/checkout/orders',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}',
        },
        json=payload,
        timeout=30,
    )
    response.raise_for_status()
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
    }


def capture_order(order_id: str) -> dict[str, Any]:
    if not order_id:
        raise ValueError('Missing PayPal order id.')

    token = _access_token()
    response = requests.post(
        f'{paypal_api_base()}/v2/checkout/orders/{order_id}/capture',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}',
        },
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()

    capture = None
    purchase_units = data.get('purchase_units') or []
    if purchase_units:
        payments = purchase_units[0].get('payments') or {}
        captures = payments.get('captures') or []
        if captures:
            capture = captures[0]

    return {
        'orderId': data.get('id'),
        'status': data.get('status'),
        'planId': (purchase_units[0].get('custom_id') if purchase_units else None),
        'captureId': (capture or {}).get('id'),
        'amount': ((capture or {}).get('amount') or {}),
        'payer': ((data.get('payer') or {}).get('email_address')),
        'mode': paypal_mode(),
    }
