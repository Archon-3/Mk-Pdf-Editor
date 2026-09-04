from __future__ import annotations

import io
from html import escape
from pathlib import Path

from docx import Document
from docx.document import Document as DocxDocument
from docx.oxml.ns import qn
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P
from docx.table import Table as DocxTable
from docx.text.paragraph import Paragraph as DocxParagraph
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .office_renderer import has_libreoffice, render_office_to_pdf


def _iter_docx_blocks(document: DocxDocument):
    body = document.element.body
    for child in body.iterchildren():
        if isinstance(child, CT_P):
            yield DocxParagraph(child, document)
        elif isinstance(child, CT_Tbl):
            yield DocxTable(child, document)


def _paragraph_images(paragraph: DocxParagraph) -> list[bytes]:
    images: list[bytes] = []
    for run in paragraph.runs:
        for blip in run._element.xpath('.//a:blip'):
            embed = blip.get(qn('r:embed'))
            if not embed:
                continue
            try:
                part = paragraph.part.related_parts[embed]
            except KeyError:
                continue
            images.append(part.blob)
    return images


def _fallback_docx_to_pdf(source: Path, output: Path) -> str:
    styles = getSampleStyleSheet()
    story = []
    document = Document(source)

    for block in _iter_docx_blocks(document):
        if isinstance(block, DocxParagraph):
            for blob in _paragraph_images(block):
                try:
                    image = Image(io.BytesIO(blob))
                    image._restrictSize(6.5 * inch, 8 * inch)
                    story.append(image)
                    story.append(Spacer(1, 8))
                except Exception:
                    continue
            text = (block.text or '').strip()
            if text:
                style_name = (block.style.name if block.style is not None else '') or ''
                style = styles['Heading2'] if style_name.startswith('Heading') else styles['Normal']
                story.append(Paragraph(escape(text).replace('\n', '<br/>'), style))
                story.append(Spacer(1, 6))
        elif isinstance(block, DocxTable):
            data = []
            for row in block.rows:
                data.append([
                    Paragraph(escape((cell.text or '').strip()).replace('\n', '<br/>'), styles['Normal'])
                    for cell in row.cells
                ])
            if not data:
                continue
            table = Table(data, hAlign='LEFT')
            table.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 4),
                ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ]))
            story.append(table)
            story.append(Spacer(1, 12))

    if not story:
        story.append(Paragraph('Converted document is empty.', styles['Normal']))

    pdf = SimpleDocTemplate(str(output), pagesize=letter, leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54)
    pdf.build(story)
    return str(output)


def word_to_pdf(input_path: str | Path, output_path: str | Path) -> str:
    source = Path(input_path)
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    if has_libreoffice():
        rendered = render_office_to_pdf(source, output)
        if rendered:
            return rendered
        # Retry once — concurrent LibreOffice locks are common on Windows.
        rendered = render_office_to_pdf(source, output)
        if rendered:
            return rendered
        raise RuntimeError(
            'LibreOffice is installed but could not convert this Word file. '
            'Close other LibreOffice windows and try again.'
        )

    if source.suffix.lower() == '.docx':
        return _fallback_docx_to_pdf(source, output)

    styles = getSampleStyleSheet()
    story = [
        Paragraph(escape(line), styles['Normal'])
        for line in source.read_text(encoding='utf-8', errors='replace').splitlines()
        or ['Converted document is empty.']
    ]
    pdf = SimpleDocTemplate(str(output), pagesize=letter)
    pdf.build(story)
    return str(output)
