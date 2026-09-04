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
    return bool(flags & 2**4), bool(flags & 2**1)


def _bbox_tuple(bbox: Any) -> tuple[float, float, float, float]:
    return (float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3]))


def _overlaps(a: tuple[float, float, float, float], b: tuple[float, float, float, float], pad: float = 2.0) -> bool:
    return not (a[2] < b[0] - pad or a[0] > b[2] + pad or a[3] < b[1] - pad or a[1] > b[3] + pad)


def _normalize_image_bytes(raw: bytes, preferred_ext: str = 'png') -> tuple[bytes, str]:
    """Ensure Word/Excel/PPT can embed the image bytes."""
    ext = (preferred_ext or 'png').lower().lstrip('.')
    if ext in {'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tif', 'tiff', 'webp'}:
        try:
            with Image.open(io.BytesIO(raw)) as image:
                if image.width < 8 or image.height < 8:
                    return raw, ext
                if ext in {'jpg', 'jpeg'} and image.mode not in {'RGB', 'L'}:
                    buffer = io.BytesIO()
                    image.convert('RGB').save(buffer, format='JPEG', quality=92)
                    return buffer.getvalue(), 'jpg'
                if ext == 'png' and image.mode not in {'RGB', 'RGBA', 'L', 'P'}:
                    buffer = io.BytesIO()
                    image.convert('RGBA').save(buffer, format='PNG')
                    return buffer.getvalue(), 'png'
        except Exception:
            pass
        return raw, 'jpg' if ext in {'jpg', 'jpeg'} else ext

    # Convert uncommon formats (e.g. jpx, jbig2) to PNG.
    try:
        with Image.open(io.BytesIO(raw)) as image:
            buffer = io.BytesIO()
            if image.mode not in {'RGB', 'RGBA', 'L'}:
                image = image.convert('RGBA')
            image.save(buffer, format='PNG')
            return buffer.getvalue(), 'png'
    except Exception:
        pix_fallback = raw
        return pix_fallback, 'png'


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
        tables.append(TableBlock(bbox=_bbox_tuple(table.bbox), rows=rows))
    return tables


def _extract_by_xref(document: fitz.Document, xref: int) -> tuple[bytes, str] | None:
    if not xref:
        return None
    try:
        extracted = document.extract_image(int(xref))
    except Exception:
        return None
    if not extracted or not extracted.get('image'):
        return None
    return _normalize_image_bytes(extracted['image'], extracted.get('ext') or 'png')


def _clip_render(page: fitz.Page, bbox: fitz.Rect) -> tuple[bytes, str] | None:
    if bbox.is_empty or bbox.get_area() < 16:
        return None
    # Inflate slightly so cropped edges are not clipped.
    clip = fitz.Rect(bbox)
    clip.x0 = max(page.rect.x0, clip.x0 - 1)
    clip.y0 = max(page.rect.y0, clip.y0 - 1)
    clip.x1 = min(page.rect.x1, clip.x1 + 1)
    clip.y1 = min(page.rect.y1, clip.y1 + 1)
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=clip, alpha=False)
    return pix.tobytes('png'), 'png'


def collect_page_images(document: fitz.Document, page: fitz.Page) -> list[TextBlock]:
    """
    Collect every visible image on the page with a bbox.
    Uses both text-dict image blocks and get_images()/get_image_rects().
    """
    images: list[TextBlock] = []
    seen: set[tuple[int, int, int, int, int]] = set()

    def add_image(bbox: tuple[float, float, float, float], raw: bytes, ext: str, xref: int = 0) -> None:
        key = (xref, int(bbox[0]), int(bbox[1]), int(bbox[2]), int(bbox[3]))
        if key in seen:
            return
        # Deduplicate near-identical placements.
        for existing in images:
            if _overlaps(existing.bbox, bbox, pad=4):
                existing_area = (existing.bbox[2] - existing.bbox[0]) * (existing.bbox[3] - existing.bbox[1])
                new_area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
                if abs(existing_area - new_area) / max(existing_area, new_area, 1) < 0.25:
                    return
        try:
            with Image.open(io.BytesIO(raw)) as image:
                if image.width < 16 or image.height < 16:
                    return
        except Exception:
            pass
        seen.add(key)
        images.append(TextBlock(kind='image', bbox=bbox, lines=[], image_bytes=raw, image_ext=ext))

    # 1) Image blocks from the text dictionary.
    payload = page.get_text('dict')
    for block in payload.get('blocks', []):
        if block.get('type') != 1:
            continue
        bbox = _bbox_tuple(block.get('bbox', (0, 0, 0, 0)))
        xref = int(block.get('xref') or block.get('number') or 0)
        data = _extract_by_xref(document, xref) if xref else None
        if not data and isinstance(block.get('image'), (bytes, bytearray)):
            data = _normalize_image_bytes(bytes(block['image']), 'png')
        if not data:
            data = _clip_render(page, fitz.Rect(bbox))
        if data:
            add_image(bbox, data[0], data[1], xref)

    # 2) Explicit image xrefs + placement rectangles (covers many PDFs missed by dict blocks).
    try:
        for img in page.get_images(full=True):
            xref = int(img[0])
            data = _extract_by_xref(document, xref)
            rects = []
            try:
                rects = list(page.get_image_rects(xref))
            except Exception:
                rects = []
            if not rects:
                try:
                    infos = page.get_image_info(hashes=False)
                    rects = [fitz.Rect(info['bbox']) for info in infos if int(info.get('xref') or 0) == xref]
                except Exception:
                    rects = []
            if not data and rects:
                data = _clip_render(page, rects[0])
            if not data:
                continue
            if not rects:
                # Unknown placement: put near top as a content image still worth keeping.
                width = min(page.rect.width * 0.45, 280)
                height = min(page.rect.height * 0.35, 220)
                rects = [fitz.Rect(36, 36, 36 + width, 36 + height)]
            for rect in rects:
                add_image(_bbox_tuple(rect), data[0], data[1], xref)
    except Exception:
        pass

    images.sort(key=lambda item: (round(item.bbox[1], 1), round(item.bbox[0], 1)))
    return images


def iter_text_blocks(page: fitz.Page, skip_bboxes: list[tuple[float, float, float, float]] | None = None) -> Iterator[TextBlock]:
    skip = skip_bboxes or []
    payload = page.get_text('dict', flags=fitz.TEXT_PRESERVE_WHITESPACE)
    for block in payload.get('blocks', []):
        if block.get('type', 0) != 0:
            continue
        bbox = _bbox_tuple(block.get('bbox', (0, 0, 0, 0)))
        if any(_overlaps(bbox, skipped) for skipped in skip):
            continue
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


def page_reading_items(document: fitz.Document, page: fitz.Page) -> list[tuple[str, Any]]:
    """Ordered page content: tables, text, and images (no full-page screenshot)."""
    tables = extract_tables(page)
    table_bboxes = [table.bbox for table in tables]
    text_blocks = list(iter_text_blocks(page, skip_bboxes=table_bboxes))
    image_blocks = collect_page_images(document, page)

    # Keep images even if they overlap tables slightly; only skip tiny icons inside table cells.
    filtered_images: list[TextBlock] = []
    for image in image_blocks:
        area = max((image.bbox[2] - image.bbox[0]) * (image.bbox[3] - image.bbox[1]), 1)
        inside_table = False
        for table_bbox in table_bboxes:
            if _overlaps(image.bbox, table_bbox, pad=1):
                table_area = max((table_bbox[2] - table_bbox[0]) * (table_bbox[3] - table_bbox[1]), 1)
                if area / table_area < 0.15:
                    inside_table = True
                    break
        if not inside_table:
            filtered_images.append(image)

    items: list[tuple[float, float, str, Any]] = []
    for table in tables:
        items.append((table.bbox[1], table.bbox[0], 'table', table))
    for block in text_blocks:
        items.append((block.bbox[1], block.bbox[0], 'block', block))
    for block in filtered_images:
        items.append((block.bbox[1], block.bbox[0], 'block', block))

    items.sort(key=lambda entry: (round(entry[0], 1), round(entry[1], 1)))
    return [(kind, payload) for _y, _x, kind, payload in items]
