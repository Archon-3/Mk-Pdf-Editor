import os
import json
import io
import tempfile
from pathlib import Path

from flask import Blueprint, Response, jsonify, request, send_file

from backend.app.services.files.validation import validate_uploaded_file
from backend.app.services.files.upload import save_uploaded_file
from backend.app.services.processing_engine import ProcessingEngine
from backend.app.services.tool_registry import TOOL_CATALOG
from backend.app.services.conversion.office_preview_html import office_to_preview_html
from backend.app.services.conversion.office_renderer import has_libreoffice, render_office_to_pdf

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


@bp.post('/preview')
def preview():
    uploaded_file = request.files.get('file')
    if not uploaded_file or not uploaded_file.filename:
        return jsonify({"success": False, "error": {"code": "NO_FILE", "message": "No file uploaded."}}), 400

    suffix = Path(uploaded_file.filename).suffix.lower()
    if suffix == '.pdf':
        return send_file(uploaded_file.stream, mimetype='application/pdf')
    if suffix not in {'.doc', '.docx', '.xls', '.xlsx', '.csv', '.ppt', '.pptx'}:
        return jsonify({"success": False, "error": {"code": "UNSUPPORTED_PREVIEW", "message": "This file type has no visual preview."}}), 400

    with tempfile.TemporaryDirectory() as temporary_directory:
        source = Path(temporary_directory) / f'input{suffix}'
        output = Path(temporary_directory) / 'preview.pdf'
        uploaded_file.save(source)

        if has_libreoffice():
            rendered = render_office_to_pdf(source, output)
            if rendered and output.exists():
                return send_file(io.BytesIO(output.read_bytes()), mimetype='application/pdf', download_name='preview.pdf')

        try:
            html = office_to_preview_html(source)
        except Exception as error:
            return jsonify({
                "success": False,
                "error": {"code": "PREVIEW_FAILED", "message": f"Could not build a structural preview: {error}"},
            }), 500

        return Response(html, mimetype='text/html; charset=utf-8')


@bp.post('/upload')
def upload():
    if 'file' not in request.files:
        return jsonify({"success": False, "error": {"code": "NO_FILE", "message": "No file uploaded."}}), 400

    uploaded_files = request.files.getlist('file')
    uploaded_file = uploaded_files[0] if uploaded_files else None
    tool_id = (request.form.get('toolId') or '').strip()
    try:
        options = json.loads(request.form.get('options') or '{}')
    except json.JSONDecodeError:
        return jsonify({"success": False, "error": {"code": "INVALID_OPTIONS", "message": "Tool options are invalid."}}), 400

    for candidate in uploaded_files:
        validation = validate_uploaded_file(candidate, tool_id)
        if not validation['valid']:
            return jsonify({"success": False, "error": {"code": validation['code'], "message": validation['message']}}), 400

    save_result = save_uploaded_file(uploaded_file, tool_id)
    if not save_result['success']:
        return jsonify({"success": False, "error": {"code": save_result['code'], "message": save_result['message']}}), 400

    input_paths = [save_result['path']]
    for candidate in uploaded_files[1:]:
        extra_result = save_uploaded_file(candidate, tool_id)
        if not extra_result['success']:
            return jsonify({"success": False, "error": {"code": extra_result['code'], "message": extra_result['message']}}), 400
        input_paths.append(extra_result['path'])

    engine = ProcessingEngine()
    job_result = engine.process(tool_id, input_paths, options=options, job_id=save_result['job_id'])

    if not job_result.success:
        return jsonify({"success": False, "error": {"code": "PROCESSING_FAILED", "message": job_result.error}}), 400

    return jsonify({
        "success": True,
        "job_id": job_result.job_id,
        "status": "uploaded",
        "filename": Path(job_result.output_path).name if job_result.output_path else save_result['filename'],
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
