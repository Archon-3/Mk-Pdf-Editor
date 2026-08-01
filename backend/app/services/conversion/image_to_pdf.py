from __future__ import annotations

from pathlib import Path

from PIL import Image


def image_to_pdf(input_paths: list[str | Path], output_path: str | Path) -> str:
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    images = [Image.open(str(path)).convert('RGB') for path in input_paths]
    first_image = images[0]
    first_image.save(output, save_all=True, append_images=images[1:])
    return str(output)
