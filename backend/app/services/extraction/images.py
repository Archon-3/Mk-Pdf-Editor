from __future__ import annotations

from pathlib import Path

import fitz


def extract_images(input_path: str | Path, output_dir: str | Path) -> list[str]:
    source = Path(input_path)
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)
    generated: list[str] = []
    with fitz.open(source) as document:
        for page_index, page in enumerate(document, start=1):
            for image_index, image in enumerate(page.get_images(full=True), start=1):
                image_data = document.extract_image(image[0])
                image_path = output / f'image-{page_index}-{image_index}.{image_data["ext"]}'
                image_path.write_bytes(image_data['image'])
                generated.append(str(image_path))
    return generated
