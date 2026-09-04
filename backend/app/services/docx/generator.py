from __future__ import annotations

import io
from pathlib import Path
from typing import Any, Dict, List

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement

import fitz

from backend.app.services.pdf.structure import TextBlock, TableBlock, page_reading_items


def _set_run_font(run, span) -> None:
    run.bold = span.bold
    run.italic = span.italic
    run.font.size = Pt(max(8, min(span.size, 48)))
    run.font.color.rgb = RGBColor(*span.color)
    # Map common PDF fonts loosely to Word-safe families.
    font_name = (span.font or '').lower()
    if 'courier' in font_name or 'mono' in font_name:
        run.font.name = 'Courier New'
    elif 'times' in font_name or 'serif' in font_name:
        run.font.name = 'Times New Roman'
    else:
        run.font.name = 'Calibri'
    # Ensure East Asian / complex scripts pick the same ASCII font where possible.
    try:
        run._element.rPr.rFonts.set(qn('w:eastAsia'), run.font.name)
    except Exception:
        pass


def _set_cell_shading(cell, fill_hex: str = 'F3F6FB') -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shading = OxmlElement('w:shd')
    shading.set(qn('w:fill'), fill_hex)
    shading.set(qn('w:val'), 'clear')
    tc_pr.append(shading)


def _add_text_block(document: Document, block: TextBlock, page_width: float) -> None:
    for line in block.lines:
        paragraph = document.add_paragraph()
        paragraph.paragraph_format.space_after = Pt(2)
        paragraph.paragraph_format.space_before = Pt(0)

        # Rough alignment from horizontal position.
        left_gap = line.bbox[0]
        right_gap = page_width - line.bbox[2]
        if abs(left_gap - right_gap) < 36 and left_gap > 72:
            paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        elif right_gap < 54 and left_gap > 120:
            paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        else:
            paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT

        for span in line.spans:
            if not span.text:
                continue
            run = paragraph.add_run(span.text)
            _set_run_font(run, span)


def _add_image_block(document: Document, block: TextBlock, page_width_pt: float) -> None:
    if not block.image_bytes:
        return
    ext = (block.image_ext or 'png').lower().lstrip('.')
    if ext == 'jpeg':
        ext = 'jpg'
    stream = io.BytesIO(block.image_bytes)
    stream.name = f'image.{ext}'
    paragraph = document.add_paragraph()
    paragraph.paragraph_format.space_before = Pt(6)
    paragraph.paragraph_format.space_after = Pt(8)
    run = paragraph.add_run()
    width_in = max(0.8, min(6.8, (block.bbox[2] - block.bbox[0]) / 72.0))
    max_width = max(3.5, min(7.0, page_width_pt / 72.0 - 1.0))
    try:
        run.add_picture(stream, width=Inches(min(width_in, max_width)))
    except Exception:
        # Last-resort: re-encode as PNG if Word rejects the original bytes.
        try:
            from PIL import Image as PILImage

            stream.seek(0)
            with PILImage.open(stream) as image:
                converted = io.BytesIO()
                image.convert('RGBA').save(converted, format='PNG')
                converted.seek(0)
                converted.name = 'image.png'
                run.add_picture(converted, width=Inches(min(width_in, max_width)))
        except Exception:
            return


def _add_table(document: Document, table: TableBlock) -> None:
    row_count = len(table.rows)
    col_count = max((len(row) for row in table.rows), default=1)
    word_table = document.add_table(rows=row_count, cols=col_count)
    word_table.style = 'Table Grid'
    for row_index, row_values in enumerate(table.rows):
        for col_index in range(col_count):
            value = row_values[col_index] if col_index < len(row_values) else ''
            cell = word_table.rows[row_index].cells[col_index]
            cell.text = value
            if row_index == 0:
                _set_cell_shading(cell)
                for paragraph in cell.paragraphs:
                    for run in paragraph.runs:
                        run.bold = True
    document.add_paragraph()


def build_docx_from_pdf(pdf_path: str | Path, output_path: str | Path, page_scale: float = 1.5) -> str:
    """
    Build a fully editable DOCX from PDF structure:
    styled text runs, tables, and embedded images — never full-page screenshots.
    """
    del page_scale  # kept for call-site compatibility
    source = Path(pdf_path)
    output = Path(output_path)
    document = Document()

    with fitz.open(str(source)) as pdf_document:
        if pdf_document.page_count == 0:
            raise ValueError('PDF contains no pages.')

        for page_index, page in enumerate(pdf_document):
            section = document.sections[0] if page_index == 0 else document.add_section()
            section.page_width = Inches(page.rect.width / 72.0)
            section.page_height = Inches(page.rect.height / 72.0)
            section.left_margin = Inches(0.6)
            section.right_margin = Inches(0.6)
            section.top_margin = Inches(0.5)
            section.bottom_margin = Inches(0.5)

            items = page_reading_items(pdf_document, page)
            if not items:
                fallback = (page.get_text('text') or '').strip()
                if fallback:
                    for line in fallback.splitlines():
                        if line.strip():
                            document.add_paragraph(line.strip())
                else:
                    document.add_paragraph('[Empty page]')
                continue

            for kind, payload in items:
                if kind == 'table':
                    _add_table(document, payload)
                elif kind == 'block':
                    block: TextBlock = payload
                    if block.kind == 'text':
                        _add_text_block(document, block, page.rect.width)
                    elif block.kind == 'image':
                        _add_image_block(document, block, page.rect.width)

    output.parent.mkdir(parents=True, exist_ok=True)
    document.save(output)
    return str(output)


def _finalize_cell_values(layout: List[Dict[str, Any]]) -> List[List[str]]:
    tokens: List[Dict[str, Any]] = []
    for item in layout:
        if item.get('kind') != 'text':
            continue
        text = (item.get('text') or '').strip()
        if not text:
            continue
        tokens.append(item)

    if not tokens:
        return [['Converted document is empty.']]

    tokens = sorted(tokens, key=lambda item: (item.get('y', 0), item.get('x', 0)))
    rows: List[List[str]] = []
    current_row: List[str] = []
    current_y: float | None = None

    for item in tokens:
        value = (item.get('text') or '').strip()
        y = item.get('y', 0)
        if current_y is None:
            current_y = y
        if current_y is not None and abs(y - current_y) > 10:
            rows.append(current_row)
            current_row = []
            current_y = y
        current_row.append(value)

    if current_row:
        rows.append(current_row)

    normalized: List[List[str]] = []
    for row in rows:
        if row:
            normalized.append(row)

    return normalized or [['Converted document is empty.']]


def build_docx_from_layout(layout: List[Dict[str, Any]], output_path: str | Path) -> str:
    document = Document()
    section = document.sections[0]
    section.page_width = Inches(8.27)
    section.page_height = Inches(11.69)
    section.left_margin = Inches(0.75)
    section.right_margin = Inches(0.75)
    section.top_margin = Inches(0.75)
    section.bottom_margin = Inches(0.75)

    rows = _finalize_cell_values(layout)
    if len(rows) == 1 and len(rows[0]) == 1:
        paragraph = document.add_paragraph()
        run = paragraph.add_run(rows[0][0])
        run.font.size = Pt(11)
    else:
        max_cols = max(len(row) for row in rows)
        table = document.add_table(rows=len(rows), cols=max_cols)
        table.style = 'Table Grid'
        for row_index, row_values in enumerate(rows):
            for col_index, value in enumerate(row_values[:max_cols]):
                table.rows[row_index].cells[col_index].text = value

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    document.save(output)
    return str(output)
