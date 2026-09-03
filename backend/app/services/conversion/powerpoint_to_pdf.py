from __future__ import annotations

from pathlib import Path

from pptx import Presentation
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen.canvas import Canvas
from .office_renderer import render_office_to_pdf


def powerpoint_to_pdf(input_path: str | Path, output_path: str | Path) -> str:
    source = Path(input_path)
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    rendered = render_office_to_pdf(source, output)
    if rendered:
        return rendered
    presentation = Presentation(source)
    canvas = Canvas(str(output), pagesize=letter)
    for slide_index, slide in enumerate(presentation.slides):
        if slide_index:
            canvas.showPage()
        y = 740
        for shape in slide.shapes:
            if not hasattr(shape, 'text') or not shape.text.strip():
                continue
            for line in shape.text.splitlines():
                canvas.drawString(54, y, line[:110])
                y -= 18
                if y < 54:
                    break
    canvas.save()
    return str(output)
