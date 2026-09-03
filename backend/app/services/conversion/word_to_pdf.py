from __future__ import annotations

from pathlib import Path

from docx import Document
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen.canvas import Canvas
from .office_renderer import render_office_to_pdf


def word_to_pdf(input_path: str | Path, output_path: str | Path) -> str:
    source = Path(input_path)
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    rendered = render_office_to_pdf(source, output)
    if rendered:
        return rendered

    canvas = Canvas(str(output), pagesize=letter)
    y = 750
    if source.suffix.lower() == '.docx':
        paragraphs = [paragraph.text for paragraph in Document(source).paragraphs]
    else:
        paragraphs = source.read_text(encoding='utf-8', errors='replace').splitlines()

    for paragraph in paragraphs or ['Converted document is empty.']:
        for line in (paragraph or ' ').splitlines() or [' ']:
            if y < 54:
                canvas.showPage()
                y = 750
            canvas.drawString(54, y, line[:110])
            y -= 16
    canvas.save()
    return str(output)
