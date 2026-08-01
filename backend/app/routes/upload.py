from flask import Blueprint, jsonify, request

from backend.app.services.files.validation import validate_uploaded_file
from backend.app.services.files.upload import save_uploaded_file

bp = Blueprint('upload', __name__, url_prefix='/api')


@bp.post('/upload')
def upload_file():
    if 'file' not in request.files:
        return jsonify({"success": False, "error": {"code": "NO_FILE", "message": "No file uploaded."}}), 400

    uploaded_file = request.files['file']
    tool_id = (request.form.get('toolId') or '').strip()

    validation = validate_uploaded_file(uploaded_file, tool_id)
    if not validation['valid']:
        return jsonify({"success": False, "error": {"code": validation['code'], "message": validation['message']}}), 400

    save_result = save_uploaded_file(uploaded_file, tool_id)
    if not save_result['success']:
        return jsonify({"success": False, "error": {"code": save_result['code'], "message": save_result['message']}}), 400

    return jsonify({
        "success": True,
        "job_id": save_result['job_id'],
        "status": "uploaded",
        "filename": save_result['filename'],
        "download_url": f"/api/jobs/{save_result['job_id']}/download",
    })
