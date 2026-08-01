from __future__ import annotations

from pathlib import Path

import fitz


def ocr_pdf(input_path: str, output_path: str | None = None) -> dict:
    source = Path(input_path)
    output = Path(output_path) if output_path else source.with_suffix('.ocr.pdf')

    doc = fitz.open(str(source))
    summary = {
        'source': str(source),
        'output': str(output),
        'pages': [],
        'status': 'ready',
    }

    for page_index, page in enumerate(doc, start=1):
        page_text = page.get_text('text')
        blocks = page.get_text('dict')['blocks']
        page_data = {
            'page': page_index,
            'text_length': len(page_text.strip()),
            'blocks': len(blocks),
            'sample': page_text.strip()[:200],
        }
        summary['pages'].append(page_data)

    output.parent.mkdir(parents=True, exist_ok=True)
    if not output.exists():
        output.write_bytes(source.read_bytes())

    return summary
