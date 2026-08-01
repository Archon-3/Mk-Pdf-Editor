from __future__ import annotations

import re
from typing import Any, Dict, List

import fitz


def _fallback_tokens_from_pdf(pdf_path: str) -> List[str]:
    try:
        with open(pdf_path, 'rb') as handle:
            raw = handle.read().decode('latin-1', errors='ignore')
    except OSError:
        return []

    matches = re.findall(r'\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*Tj', raw)
    tokens: List[str] = []
    for match in matches:
        value = match.encode('latin-1').decode('unicode_escape', errors='ignore')
        clean = value.replace('\\(', '(').replace('\\)', ')').strip()
        if clean:
            tokens.append(clean)
    return tokens


def analyze_pdf_layout(pdf_path: str) -> List[Dict[str, Any]]:
    """Extract page text blocks with layout metadata to drive DOCX reconstruction."""
    doc = fitz.open(pdf_path)
    layout: List[Dict[str, Any]] = []
    fallback_tokens = _fallback_tokens_from_pdf(pdf_path)

    for page_index, page in enumerate(doc, start=1):
        page_rect = page.rect
        blocks = page.get_text('dict')['blocks']
        extracted: List[Dict[str, Any]] = []

        for block in blocks:
            if block.get('type') != 0:
                continue
            block_bbox = block.get('bbox', [0, 0, 0, 0])
            text = ''.join(span.get('text', '') for line in block.get('lines', []) for span in line.get('spans', [])).strip()
            if not text:
                continue

            font_sizes = [span.get('size', 10) for line in block.get('lines', []) for span in line.get('spans', [])]
            font_size = max(font_sizes) if font_sizes else 10
            extracted.append({
                'page': page_index,
                'kind': 'text',
                'x': round(block_bbox[0], 2),
                'y': round(block_bbox[1], 2),
                'width': round(block_bbox[2] - block_bbox[0], 2),
                'height': round(block_bbox[3] - block_bbox[1], 2),
                'text': text,
                'font_size': round(font_size, 2),
                'page_width': round(page_rect.width, 2),
                'page_height': round(page_rect.height, 2),
            })

        if len(extracted) < len(fallback_tokens):
            for token_index, token in enumerate(fallback_tokens):
                line_index = token_index // 2
                column_index = token_index % 2
                layout.append({
                    'page': page_index,
                    'kind': 'text',
                    'x': 20 + (column_index * 100),
                    'y': page_rect.height - (line_index * 30) - 20,
                    'width': 80,
                    'height': 14,
                    'text': token,
                    'font_size': 10,
                    'page_width': round(page_rect.width, 2),
                    'page_height': round(page_rect.height, 2),
                })
            continue

        layout.extend(extracted)

    return layout
