from __future__ import annotations

import io
from dataclasses import dataclass
from typing import Any, Iterator

import fitz
from PIL import Image


@dataclass
class TextSpan:
    text: str
    size: float
    bold: bool
    italic: bool
    color: tuple[int, int, int]
    font: str


@dataclass
class TextLine:
    spans: list[TextSpan]
    bbox: tuple[float, float, float, float]


@dataclass
class TextBlock:
    kind: str  # text | image
    bbox: tuple[float, float, float, float]
    lines: list[TextLine]
    image_bytes: bytes | None = None
    image_ext: str = 'png'


@dataclass
class TableBlock:
    bbox: tuple[float, float, float, float]
    rows: list[list[str]]


def _rgb_from_int(value: int) -> tuple[int, int, int]:
    value = int(value or 0)
    return ((value >> 16) & 255, (value >> 8) & 255, value & 255)


def _flags_bold_italic(flags: int) -> tuple[bool, bool]:
    # MuPDF: bit 0 superscript, 1 italic, 2 serifed, 3 monospaced, 4 bold
    return bool(flags & 2**4), bool(flags & 2**1)


def _bbox_tuple(bbox: Any) -> tuple[float, float, float, float]:
    return (float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3]))


def _overlaps(a: tuple[float, float, float, float], b: tuple[float, float, float, float], pad: float = 2.0) -> bool:
    return not (a[2] < b[0] - pad or a[0] > b[2] + pad or a[3] < b[1] - pad or a[1] > b[3] + pad)


def extract_tables(page: fitz.Page) -> list[TableBlock]:
    tables: list[TableBlock] = []
    try:
        finder = page.find_tables()
    except Exception:
        return tables

    for table in getattr(finder, 'tables', []) or []:
        try:
            raw_rows = table.extract() or []
        except Exception:
            continue
        rows: list[list[str]] = []
        for row in raw_rows:
            cells = [('' if cell is None else str(cell).strip()) for cell in row]
            if any(cells):
                rows.append(cells)
        if not rows:
            continue
        bbox = _bbox_tuple(table.bbox)
        tables.append(TableBlock(bbox=bbox, rows=rows))
    return tables


def _extract_image_bytes(document: fitz.Document, page: fitz.Page, block: dict[str, Any]) -> tuple[bytes, str] | None:
    image_info = block.get('image')
    if isinstance(image_info, (bytes, bytearray)):
        return bytes(image_info), 'png'

    xref = block.get('xref') or block.get('number')
    if not xref:
        # Fallback: render only this image bbox region.
        bbox = fitz.Rect(block.get('bbox'))
        if bbox.is_empty or bbox.get_area() < 24:
            return None
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=bbox, alpha=False)
        return pix.tobytes('png'), 'png'

    try:
        extracted = document.extract_image(int(xref))
    except Exception:
        return None
    if not extracted or not extracted.get('image'):
        return None
    return extracted['image'], (extracted.get('ext') or 'png')


def iter_page_blocks(document: fitz.Document, page: fitz.Page, skip_table_bboxes: list[tuple[float, float, float, float]] | None = None) -> Iterator[TextBlock]:
    skip = skip_table_bboxes or []
    payload = page.get_text('dict', flags=fitz.TEXT_PRESERVE_WHITESPACE)
    for block in payload.get('blocks', []):
        bbox = _bbox_tuple(block.get('bbox', (0, 0, 0, 0)))
        if any(_overlaps(bbox, table_bbox) for table_bbox in skip):
            continue

        block_type = block.get('type', 0)
        if block_type == 0:
            lines: list[TextLine] = []
            for line in block.get('lines', []):
                spans: list[TextSpan] = []
                for span in line.get('spans', []):
                    text = span.get('text') or ''
                    if not text:
                        continue
                    bold, italic = _flags_bold_italic(int(span.get('flags') or 0))
                    spans.append(
                        TextSpan(
                            text=text,
                            size=float(span.get('size') or 11),
                            bold=bold,
                            italic=italic,
                            color=_rgb_from_int(int(span.get('color') or 0)),
                            font=str(span.get('font') or ''),
                        )
                    )
                if spans:
                    lines.append(TextLine(spans=spans, bbox=_bbox_tuple(line.get('bbox', bbox))))
            if lines:
                yield TextBlock(kind='text', bbox=bbox, lines=lines)
        elif block_type == 1:
            image_data = _extract_image_bytes(document, page, block)
            if not image_data:
                continue
            image_bytes, ext = image_data
            # Ignore tiny decorative artifacts.
            try:
                with Image.open(io.BytesIO(image_bytes)) as image:
                    if image.width < 24 or image.height < 24:
                        continue
            except Exception:
                pass
            yield TextBlock(kind='image', bbox=bbox, lines=[], image_bytes=image_bytes, image_ext=ext)


def page_reading_items(document: fitz.Document, page: fitz.Page) -> list[tuple[str, Any]]:
    """Return ordered content items for a page: ('table', TableBlock) or ('block', TextBlock)."""
    tables = extract_tables(page)
    table_bboxes = [table.bbox for table in tables]
    blocks = list(iter_page_blocks(document, page, skip_table_bboxes=table_bboxes))

    items: list[tuple[float, float, str, Any]] = []
    for table in tables:
        items.append((table.bbox[1], table.bbox[0], 'table', table))
    for block in blocks:
        items.append((block.bbox[1], block.bbox[0], 'block', block))

    items.sort(key=lambda entry: (round(entry[0], 1), round(entry[1], 1)))
    return [(kind, payload) for _y, _x, kind, payload in items]
