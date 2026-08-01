from flask import Blueprint, jsonify

bp = Blueprint('pdf', __name__, url_prefix='/api')


@bp.post('/pdf/merge')
def merge_pdf():
    return jsonify({"success": True, "job_id": "demo-job", "status": "queued", "message": "Merge pipeline ready."})


@bp.post('/pdf/split')
def split_pdf():
    return jsonify({"success": True, "job_id": "demo-job", "status": "queued", "message": "Split pipeline ready."})


@bp.post('/pdf/compress')
def compress_pdf():
    return jsonify({"success": True, "job_id": "demo-job", "status": "queued", "message": "Compression pipeline ready."})


@bp.post('/pdf/rotate')
def rotate_pdf():
    return jsonify({"success": True, "job_id": "demo-job", "status": "queued", "message": "Rotate pipeline ready."})


@bp.post('/pdf/delete-pages')
def delete_pages():
    return jsonify({"success": True, "job_id": "demo-job", "status": "queued", "message": "Page delete pipeline ready."})


@bp.post('/pdf/reorder-pages')
def reorder_pages():
    return jsonify({"success": True, "job_id": "demo-job", "status": "queued", "message": "Page reorder pipeline ready."})


@bp.post('/pdf/watermark')
def watermark():
    return jsonify({"success": True, "job_id": "demo-job", "status": "queued", "message": "Watermark pipeline ready."})


@bp.post('/pdf/redact')
def redact():
    return jsonify({"success": True, "job_id": "demo-job", "status": "queued", "message": "Redaction pipeline ready."})


@bp.post('/pdf/annotate')
def annotate():
    return jsonify({"success": True, "job_id": "demo-job", "status": "queued", "message": "Annotation pipeline ready."})


@bp.post('/pdf/sign')
def sign_pdf():
    return jsonify({"success": True, "job_id": "demo-job", "status": "queued", "message": "Signature pipeline ready."})
