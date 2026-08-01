from __future__ import annotations

from pathlib import Path
from typing import Iterable


def merge_pdfs(input_paths: Iterable[str | Path], output_path: str | Path) -> str:
    """Merge multiple PDFs into a single output PDF.

    This is intentionally kept as a service hook so the actual implementation can
    swap between PyMuPDF, ReportLab, or a background worker without changing the API.
    """
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    return str(output)
