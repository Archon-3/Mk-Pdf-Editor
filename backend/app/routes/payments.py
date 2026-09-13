from __future__ import annotations

from flask import Blueprint, jsonify, request

from backend.app.services.payments.paypal import (
    PLAN_CATALOG,
    capture_order,
    create_demo_order,
    create_order,
    get_plan,
    paypal_configured,
    paypal_demo_enabled,
    paypal_mode,
)

bp = Blueprint('payments', __name__, url_prefix='/api/payments')


@bp.get('/paypal/config')
def paypal_config():
    configured = paypal_configured()
    return jsonify({
        'success': True,
        'configured': configured,
        'demo': (not configured) and paypal_demo_enabled(),
        'mode': paypal_mode(),
        'plans': list(PLAN_CATALOG.values()),
    })


@bp.post('/paypal/create-order')
def paypal_create_order():
    body = request.get_json(silent=True) or {}
    plan_id = str(body.get('planId') or '').strip()
    if not get_plan(plan_id):
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_PLAN',
                'message': 'Choose a valid Pro plan (pro_monthly or pro_annual).',
            },
        }), 400

    # Real sandbox/live keys always win. Demo only when keys are missing.
    if paypal_configured():
        try:
            order = create_order(plan_id)
            return jsonify({'success': True, **order})
        except Exception as error:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'PAYPAL_CREATE_FAILED',
                    'message': str(error),
                },
            }), 502

    if paypal_demo_enabled():
        order = create_demo_order(plan_id)
        return jsonify({'success': True, **order})

    return jsonify({
        'success': False,
        'error': {
            'code': 'PAYPAL_NOT_CONFIGURED',
            'message': 'PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in the environment.',
        },
    }), 503


@bp.post('/paypal/capture-order')
def paypal_capture_order():
    body = request.get_json(silent=True) or {}
    order_id = str(body.get('orderId') or request.args.get('token') or '').strip()
    if not order_id:
        return jsonify({
            'success': False,
            'error': {
                'code': 'MISSING_ORDER',
                'message': 'Missing PayPal order id.',
            },
        }), 400

    if order_id.startswith('DEMO-'):
        return jsonify({'success': True, **capture_order(order_id)})

    if not paypal_configured():
        return jsonify({
            'success': False,
            'error': {
                'code': 'PAYPAL_NOT_CONFIGURED',
                'message': 'PayPal is not configured.',
            },
        }), 503

    try:
        result = capture_order(order_id)
        return jsonify({'success': True, **result})
    except Exception as error:
        return jsonify({
            'success': False,
            'error': {
                'code': 'PAYPAL_CAPTURE_FAILED',
                'message': str(error),
            },
        }), 502
