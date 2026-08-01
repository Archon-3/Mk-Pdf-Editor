from __future__ import annotations

from pathlib import Path

import fitz
from PIL import Image


def pdf_to_image(input_path: str | Path, output_dir: str | Path) -> list[str]:
    source = Path(input_path)
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(str(source))
    generated: list[str] = []

    for page_index, page in enumerate(doc, start=1):
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        image_path = output / f'page-{page_index}.png'
        pix.save(str(image_path))
        generated.append(str(image_path))

    if not generated:
        placeholder = output / 'page-1.png'
        Image.new('RGB', (1200, 1600), color='white').save(placeholder)
        generated.append(str(placeholder))

    return generated
