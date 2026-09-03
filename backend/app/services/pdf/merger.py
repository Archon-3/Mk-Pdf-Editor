from __future__ import annotations

from pathlib import Path
from typing import Iterable

import fitz


def merge_pdfs(input_paths: Iterable[str | Path], output_path: str | Path) -> str:
    """Merge PDF inputs into a single output PDF."""
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    merged = fitz.open()
    for input_path in input_paths:
        with fitz.open(str(input_path)) as source:
            merged.insert_pdf(source)
    merged.save(str(output))
    merged.close()
    return str(output)
