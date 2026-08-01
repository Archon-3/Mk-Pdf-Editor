from __future__ import annotations

from pathlib import Path


def extract_images(input_path: str | Path, output_dir: str | Path) -> list[str]:
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)
    return [str(output / 'image-1.png')]
