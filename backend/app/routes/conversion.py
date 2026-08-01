import os
import uuid
from pathlib import Path

from flask import Blueprint, jsonify, request

from backend.app.services.conversion.pdf_to_word import pdf_to_word as convert_pdf_to_word

bp = Blueprint('conversion', __name__, url_prefix='/api')


@bp.post('/pdf/to-word')
def pdf_to_word():
    if 'file' not in request.files:
        return jsonify({"success": False, "error": {"code": "NO_FILE", "message": "No PDF uploaded."}}), 400

    uploaded = request.files['file']
    if not uploaded.filename:
        return jsonify({"success": False, "error": {"code": "INVALID_FILE", "message": "A PDF file is required."}}), 400

    output_dir = Path('backend/output')
    output_dir.mkdir(parents=True, exist_ok=True)
    job_id = uuid.uuid4().hex
    source_path = Path('backend/uploads') / f'{job_id}_{uploaded.filename}'
    source_path.parent.mkdir(parents=True, exist_ok=True)
    uploaded.save(source_path)

    output_path = output_dir / f'{job_id}_{Path(uploaded.filename).stem}.docx'
    generated = convert_pdf_to_word(source_path, output_path)

    if not os.path.exists(generated):
        return jsonify({"success": False, "error": {"code": "CONVERSION_FAILED", "message": "The PDF to Word conversion did not produce a document."}}), 500

    return jsonify({
        "success": True,
        "job_id": job_id,
        "status": "completed",
        "filename": Path(generated).name,
        "download_url": f"/api/jobs/{job_id}/download",
        "message": "PDF converted into an editable DOCX document.",
    })


@bp.post('/pdf/to-image')
def pdf_to_image():
    return jsonify({"success": True, "job_id": "demo-job", "status": "queued", "message": "PDF to image pipeline ready."})


@bp.post('/word/to-pdf')
def word_to_pdf():
    return jsonify({"success": True, "job_id": "demo-job", "status": "queued", "message": "Word to PDF pipeline ready."})


@bp.post('/excel/to-pdf')
def excel_to_pdf():
    return jsonify({"success": True, "job_id": "demo-job", "status": "queued", "message": "Excel to PDF pipeline ready."})


@bp.post('/powerpoint/to-pdf')
def powerpoint_to_pdf():
    return jsonify({"success": True, "job_id": "demo-job", "status": "queued", "message": "PowerPoint to PDF pipeline ready."})


@bp.post('/image/to-pdf')
def image_to_pdf():
    return jsonify({"success": True, "job_id": "demo-job", "status": "queued", "message": "Image to PDF pipeline ready."})
