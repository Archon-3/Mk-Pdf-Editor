from flask import Blueprint, jsonify

bp = Blueprint('editor', __name__, url_prefix='/api')


@bp.post('/pdf/edit')
def edit_pdf():
    return jsonify({"success": True, "job_id": "demo-job", "status": "queued", "message": "Editor pipeline ready."})
