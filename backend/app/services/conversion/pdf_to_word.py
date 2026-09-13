from __future__ import annotations

import tempfile
from pathlib import Path

from backend.app.services.docx.generator import build_docx_from_layout, build_docx_from_pdf
from backend.app.services.pdf.layout_analyzer import analyze_pdf_layout

from .office_renderer import convert_with_libreoffice, has_libreoffice


def _pdf_to_word_via_libreoffice(source: Path, output: Path) -> str | None:
    """LibreOffice often cannot export PDF→DOCX directly; PDF→HTML→DOCX preserves layout/colors better."""
    with tempfile.TemporaryDirectory(prefix='pdf-word-') as temporary_directory:
        html_path = Path(temporary_directory) / f'{source.stem}.html'
        html_result = convert_with_libreoffice(source, html_path, 'html')
        if not html_result:
            return None
        return convert_with_libreoffice(html_path, output, 'docx')


def pdf_to_word(input_path: str | Path, output_path: str | Path) -> str:
    """
    Convert PDF → editable Word (.docx) preserving text styles, tables, images, and colors
    when LibreOffice is available. Falls back to structured reconstruction otherwise.
    """
    source = Path(input_path)
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    if has_libreoffice():
        converted = _pdf_to_word_via_libreoffice(source, output)
        if converted:
            return converted
        # Retry once — Windows LO profile locks are common.
        converted = _pdf_to_word_via_libreoffice(source, output)
        if converted:
            return converted

    try:
        return build_docx_from_pdf(source, output)
    except Exception:
        layout = analyze_pdf_layout(str(source))
        if not layout:
            from docx import Document

            doc = Document()
            doc.add_paragraph('Converted document is empty.')
            doc.save(output)
            return str(output)
        return build_docx_from_layout(layout, output)
