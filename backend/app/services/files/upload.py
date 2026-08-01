import os
import uuid
from datetime import datetime

from flask import current_app

from backend.app.utils.security import safe_filename


def save_uploaded_file(uploaded_file, tool_id: str):
    try:
        root_dir = os.path.join(current_app.root_path, '..')
        upload_dir = os.path.join(root_dir, 'uploads')
        os.makedirs(upload_dir, exist_ok=True)

        safe_name = safe_filename(uploaded_file.filename)
        unique_name = f"{uuid.uuid4()}_{safe_name}"
        file_path = os.path.join(upload_dir, unique_name)
        uploaded_file.save(file_path)

        job_id = str(uuid.uuid4())
        return {
            "success": True,
            "job_id": job_id,
            "filename": uploaded_file.filename,
            "path": file_path,
            "tool_id": tool_id,
            "uploaded_at": datetime.utcnow().isoformat() + 'Z',
        }
    except Exception as exc:  # pragma: no cover - simple guard
        return {
            "success": False,
            "code": "UPLOAD_FAILED",
            "message": f"Unable to save the uploaded file: {str(exc)}",
        }
