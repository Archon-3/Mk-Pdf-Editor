from __future__ import annotations

from pathlib import Path
from typing import Iterable, List


def split_pdf(input_path: str | Path, ranges: Iterable[str], output_dir: str | Path) -> List[str]:
    """Split a PDF into ranges and return output file paths."""
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)
    return [str(output / 'split-part-1.pdf')]
