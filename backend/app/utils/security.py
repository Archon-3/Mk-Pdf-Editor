from __future__ import annotations

import os
import re
import uuid


def safe_filename(filename: str) -> str:
    base = os.path.basename(filename)
    cleaned = re.sub(r'[^A-Za-z0-9._-]', '_', base)
    return cleaned or f"docuforge-{uuid.uuid4().hex}"


def secure_upload_path(root_dir: str, filename: str) -> str:
    safe = safe_filename(filename)
    return os.path.join(root_dir, safe)
