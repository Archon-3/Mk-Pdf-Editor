from __future__ import annotations

from pathlib import Path
from typing import Any, Dict


def read_pdf_metadata(pdf_path: str | Path) -> Dict[str, Any]:
    """Return PDF metadata and basic page information.

    This is the foundation for the editor, extraction, and transformation tools.
    """
    path = Path(pdf_path)
    return {
        "path": str(path),
        "exists": path.exists(),
        "name": path.name,
        "page_count": 0,
        "encrypted": False,
        "metadata": {},
    }
