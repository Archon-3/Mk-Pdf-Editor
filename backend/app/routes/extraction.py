from flask import Blueprint, jsonify

bp = Blueprint('extraction', __name__, url_prefix='/api')


@bp.post('/pdf/extract-text')
def extract_text():
    return jsonify({"success": True, "job_id": "demo-job", "status": "queued", "message": "Text extraction pipeline ready."})


@bp.post('/pdf/extract-images')
def extract_images():
    return jsonify({"success": True, "job_id": "demo-job", "status": "queued", "message": "Image extraction pipeline ready."})


@bp.post('/pdf/extract-tables')
def extract_tables():
    return jsonify({"success": True, "job_id": "demo-job", "status": "queued", "message": "Table extraction pipeline ready."})
