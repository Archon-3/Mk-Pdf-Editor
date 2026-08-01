import os

from flask import Blueprint, jsonify, request, send_file

from backend.app.services.files.validation import validate_uploaded_file
from backend.app.services.files.upload import save_uploaded_file
from backend.app.services.processing_engine import ProcessingEngine
from backend.app.services.tool_registry import TOOL_CATALOG

bp = Blueprint('api', __name__, url_prefix='/api')


@bp.get('/health')
def health():
    return jsonify({"success": True, "status": "ok"})


@bp.get('/tools')
def tools():
    return jsonify({
        "success": True,
        "tools": TOOL_CATALOG,
    })


@bp.post('/upload')
def upload():
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

    engine = ProcessingEngine()
    job_result = engine.process(tool_id, save_result['path'], job_id=save_result['job_id'])

    if not job_result.success:
        return jsonify({"success": False, "error": {"code": "PROCESSING_FAILED", "message": job_result.error}}), 400

    return jsonify({
        "success": True,
        "job_id": job_result.job_id,
        "status": "uploaded",
        "filename": save_result['filename'],
        "download_url": job_result.download_url,
    })


@bp.get('/jobs/<job_id>')
def get_job(job_id):
    engine = ProcessingEngine()
    return jsonify(engine.get_status(job_id))


@bp.get('/jobs/<job_id>/download')
def download(job_id):
    engine = ProcessingEngine()
    record = engine.get_job(job_id)
    if not record:
        return jsonify({"success": False, "error": {"code": "JOB_NOT_FOUND", "message": "The requested job does not exist."}}), 404

    output_path = record.get('output_path')
    if not output_path or not os.path.exists(output_path):
        return jsonify({"success": False, "error": {"code": "FILE_NOT_FOUND", "message": "The generated file is missing."}}), 404

    response = send_file(output_path, as_attachment=True, download_name=os.path.basename(output_path))
    response.call_on_close(lambda: engine.cleanup_job(job_id))
    return response
