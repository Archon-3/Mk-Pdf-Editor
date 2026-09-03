from __future__ import annotations

from pathlib import Path

import fitz
from pptx import Presentation
from pptx.util import Inches, Pt


def pdf_to_powerpoint(input_path: str | Path, output_path: str | Path) -> str:
    presentation = Presentation()
    presentation.slide_width = Inches(10)
    presentation.slide_height = Inches(7.5)
    blank_layout = presentation.slide_layouts[6]
    with fitz.open(str(input_path)) as document:
        for page_number, page in enumerate(document, start=1):
            slide = presentation.slides.add_slide(blank_layout)
            snapshot_path = Path(output_path).with_name(f'.page-{page_number}.png')
            page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False).save(str(snapshot_path))
            slide.shapes.add_picture(str(snapshot_path), 0, 0, width=presentation.slide_width, height=presentation.slide_height)
            text = page.get_text().strip() or ' '
            box = slide.shapes.add_textbox(Inches(0.5), Inches(0.4), Inches(9), Inches(6.7))
            frame = box.text_frame
            frame.word_wrap = True
            frame.text = text
            for paragraph in frame.paragraphs:
                for run in paragraph.runs:
                    run.font.size = Pt(14)
    if not presentation.slides:
        presentation.slides.add_slide(blank_layout)
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    presentation.save(output)
    for snapshot_path in output.parent.glob('.page-*.png'):
        snapshot_path.unlink(missing_ok=True)
    return str(output)