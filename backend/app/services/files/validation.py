import os
from typing import Dict, Any

ALLOWED_MIME_TYPES = {
    'pdf': {'application/pdf'},
    'word': {'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'},
    'excel': {'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'},
    'powerpoint': {'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'},
    'image': {'image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'},
    'text': {'text/plain', 'text/csv', 'application/csv'},
}

TOOL_ACCEPTS = {
    'merge': {'pdf'},
    'split': {'pdf'},
    'compress': {'pdf'},
    'rotate': {'pdf'},
    'delete-pages': {'pdf'},
    'page-rearrangement': {'pdf'},
    'extract-images': {'pdf'},
    'extract-text': {'pdf'},
    'extract-tables': {'pdf'},
    'pdf-to-word': {'pdf'},
    'word-to-pdf': {'word'},
    'excel-to-pdf': {'excel'},
    'powerpoint-to-pdf': {'powerpoint'},
    'image-to-pdf': {'image'},
    'pdf-to-image': {'pdf'},
    'watermark': {'pdf'},
    'redaction': {'pdf'},
    'annotation': {'pdf'},
    'signature': {'pdf'},
}


def _extension_for(filename: str) -> str:
    return os.path.splitext(filename)[1].lower().lstrip('.')


def validate_uploaded_file(uploaded_file, tool_id: str) -> Dict[str, Any]:
    if not uploaded_file or not uploaded_file.filename:
        return {"valid": False, "code": "INVALID_FILE", "message": "A valid file is required."}

    if not tool_id:
        return {"valid": False, "code": "NO_TOOL", "message": "A tool selection is required."}

    extension = _extension_for(uploaded_file.filename)
    mime_type = uploaded_file.mimetype or ''
    accepted = TOOL_ACCEPTS.get(tool_id)

    if accepted is None:
        return {"valid": False, "code": "UNSUPPORTED_TOOL", "message": "This tool is not supported."}

    if extension and extension in {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'txt'}:
        pass
    else:
        return {"valid": False, "code": "UNSUPPORTED_FILE_TYPE", "message": "This file type is not supported."}

    category = 'pdf'
    if extension in {'doc', 'docx'}:
        category = 'word'
    elif extension in {'xls', 'xlsx', 'csv'}:
        category = 'excel'
    elif extension in {'ppt', 'pptx'}:
        category = 'powerpoint'
    elif extension in {'jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff'}:
        category = 'image'
    elif extension in {'txt'}:
        category = 'text'

    if category not in accepted:
        return {"valid": False, "code": "UNSUPPORTED_FILE_TYPE", "message": f"This operation does not support {extension.upper()} files."}

    if mime_type and category in ALLOWED_MIME_TYPES and mime_type not in ALLOWED_MIME_TYPES[category]:
        return {"valid": False, "code": "MIME_MISMATCH", "message": "File signature and extension are inconsistent."}

    return {"valid": True, "code": "OK", "message": "File validated."}
