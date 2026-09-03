from __future__ import annotations

from pathlib import Path

import fitz


def extract_text(input_path: str | Path, output_path: str | Path) -> str:
    source = Path(input_path)
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    with fitz.open(source) as document:
        text = '\n\n'.join(page.get_text() for page in document)
    output.write_text(text, encoding='utf-8')
    return str(output)
