from __future__ import annotations

from pathlib import Path

from openpyxl import load_workbook
from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfgen.canvas import Canvas
from .office_renderer import render_office_to_pdf


def excel_to_pdf(input_path: str | Path, output_path: str | Path) -> str:
    source = Path(input_path)
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    rendered = render_office_to_pdf(source, output)
    if rendered:
        return rendered
    workbook = load_workbook(source, read_only=True, data_only=True)
    canvas = Canvas(str(output), pagesize=landscape(letter))
    width, height = landscape(letter)

    for sheet_index, sheet in enumerate(workbook.worksheets):
        if sheet_index:
            canvas.showPage()
        y = height - 48
        canvas.setFont('Helvetica-Bold', 12)
        canvas.drawString(36, y, sheet.title)
        canvas.setFont('Helvetica', 9)
        y -= 22
        for row in sheet.iter_rows(values_only=True):
            values = [str(value) if value is not None else '' for value in row]
            if y < 36:
                canvas.showPage()
                y = height - 36
            canvas.drawString(36, y, ' | '.join(values)[:150])
            y -= 14
    workbook.close()
    canvas.save()
    return str(output)
