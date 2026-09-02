from __future__ import annotations

from pathlib import Path

from backend.app.services.docx.generator import build_docx_from_layout, build_docx_from_pdf
from backend.app.services.pdf.layout_analyzer import analyze_pdf_layout


def pdf_to_word(input_path: str | Path, output_path: str | Path) -> str:
    source = Path(input_path)
    output = Path(output_path)

    try:
        return build_docx_from_pdf(source, output)
    except Exception:
        layout = analyze_pdf_layout(str(source))
        if not layout:
            output.parent.mkdir(parents=True, exist_ok=True)
            from docx import Document

            doc = Document()
            doc.add_paragraph('Converted document is empty.')
            doc.save(output)
            return str(output)

        return build_docx_from_layout(layout, output)
