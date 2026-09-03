from __future__ import annotations

from pathlib import Path
import re
from typing import Iterable, List

import fitz


def split_pdf(input_path: str | Path, ranges: Iterable[str], output_dir: str | Path) -> List[str]:
    """Split a PDF into ranges and return output file paths."""
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)
    generated: List[str] = []
    with fitz.open(str(input_path)) as source:
        selected_ranges = list(ranges)
        if not selected_ranges:
            selected_ranges = [f'{index + 1}' for index in range(source.page_count)]
        for part_index, page_range in enumerate(selected_ranges, start=1):
            pages: list[int] = []
            for value in re.split(r'\s*,\s*', page_range):
                if '-' in value:
                    start_text, end_text = value.split('-', 1)
                    if start_text.strip().isdigit() and end_text.strip().isdigit():
                        start = int(start_text) - 1
                        end = int(end_text) - 1
                        pages.extend(range(min(start, end), max(start, end) + 1))
                elif value.strip().isdigit():
                    pages.append(int(value.strip()) - 1)
            if not pages:
                continue
            result = fitz.open()
            for page_index in pages:
                if 0 <= page_index < source.page_count:
                    result.insert_pdf(source, from_page=page_index, to_page=page_index)
            if result.page_count:
                part_path = output / f'split-part-{part_index}.pdf'
                result.save(str(part_path))
                generated.append(str(part_path))
            result.close()
    return generated
