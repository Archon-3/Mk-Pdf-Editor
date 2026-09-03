from __future__ import annotations

from pathlib import Path

import fitz
from openpyxl import Workbook
from openpyxl.drawing.image import Image as SpreadsheetImage


def pdf_to_excel(input_path: str | Path, output_path: str | Path) -> str:
    workbook = Workbook()
    workbook.remove(workbook.active)
    with fitz.open(str(input_path)) as document:
        for page_number, page in enumerate(document, start=1):
            sheet = workbook.create_sheet(f'Page {page_number}')
            snapshot = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
            snapshot_path = Path(output_path).with_name(f'.page-{page_number}.png')
            snapshot.save(str(snapshot_path))
            sheet.add_image(SpreadsheetImage(str(snapshot_path)), 'D1')
            for row_number, line in enumerate(page.get_text().splitlines(), start=1):
                columns = [value.strip() for value in line.split('\t')]
                for column_number, value in enumerate(columns, start=1):
                    sheet.cell(row=row_number, column=column_number, value=value)
    if not workbook.sheetnames:
        workbook.create_sheet('Page 1')
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    workbook.save(output)
    for snapshot_path in output.parent.glob('.page-*.png'):
        snapshot_path.unlink(missing_ok=True)
    return str(output)