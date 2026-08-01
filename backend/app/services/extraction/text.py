from __future__ import annotations

from pathlib import Path


def extract_text(input_path: str | Path, output_path: str | Path) -> str:
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    return str(output)
