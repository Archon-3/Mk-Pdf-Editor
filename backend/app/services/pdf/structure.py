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
                if image.width < 4 or image.height < 4:
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

    try:
        with Image.open(io.BytesIO(raw)) as image:
            buffer = io.BytesIO()
            if image.mode not in {'RGB', 'RGBA', 'L'}:
                image = image.convert('RGBA')
            image.save(buffer, format='PNG')
            return buffer.getvalue(), 'png'
    except Exception:
        # MuPDF pixmap path already returns PNG-compatible bytes in most cases.
        return raw, 'png'


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


def _clip_render(page: fitz.Page, bbox: fitz.Rect, scale: float = 2.5) -> tuple[bytes, str] | None:
    if bbox.is_empty or bbox.get_area() < 4:
        return None
    clip = fitz.Rect(bbox)
    clip.x0 = max(page.rect.x0, clip.x0 - 0.5)
    clip.y0 = max(page.rect.y0, clip.y0 - 0.5)
    clip.x1 = min(page.rect.x1, clip.x1 + 0.5)
    clip.y1 = min(page.rect.y1, clip.y1 + 0.5)
    if clip.get_area() < 4:
        return None
    pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), clip=clip, alpha=False)
    return pix.tobytes('png'), 'png'


def collect_page_images(document: fitz.Document, page: fitz.Page) -> list[TextBlock]:
    """
    Collect as many visible images as possible:
    - text-dict image blocks
    - page.get_images() + get_image_rects()
    - page.get_image_info()
    - soft-mask companions when useful
    Falls back to clipped renders when raw extraction fails.
    """
    images: list[TextBlock] = []
    seen_keys: set[tuple[int, int, int, int, int]] = set()

    def too_similar(bbox: tuple[float, float, float, float]) -> bool:
        for existing in images:
            if not _overlaps(existing.bbox, bbox, pad=2):
                continue
            existing_area = max((existing.bbox[2] - existing.bbox[0]) * (existing.bbox[3] - existing.bbox[1]), 1)
            new_area = max((bbox[2] - bbox[0]) * (bbox[3] - bbox[1]), 1)
            # Only skip near-exact duplicates; keep differently sized/overlapping images.
            ratio = min(existing_area, new_area) / max(existing_area, new_area)
            center_dx = abs(((existing.bbox[0] + existing.bbox[2]) / 2) - ((bbox[0] + bbox[2]) / 2))
            center_dy = abs(((existing.bbox[1] + existing.bbox[3]) / 2) - ((bbox[1] + bbox[3]) / 2))
            if ratio > 0.82 and center_dx < 8 and center_dy < 8:
                return True
        return False

    def add_image(bbox: tuple[float, float, float, float], raw: bytes, ext: str, xref: int = 0) -> None:
        width = bbox[2] - bbox[0]
        height = bbox[3] - bbox[1]
        if width < 6 or height < 6:
            return
        # Ignore hairline / nearly invisible strips.
        if width * height < 80:
            return

        key = (xref, int(bbox[0]), int(bbox[1]), int(bbox[2]), int(bbox[3]))
        if key in seen_keys or too_similar(bbox):
            return

        try:
            with Image.open(io.BytesIO(raw)) as image:
                if image.width < 6 or image.height < 6:
                    return
        except Exception:
            # Still keep raw bytes if Pillow cannot inspect them; Word path may re-encode.
            pass

        seen_keys.add(key)
        images.append(TextBlock(kind='image', bbox=bbox, lines=[], image_bytes=raw, image_ext=ext))

    def resolve_image(xref: int, bbox: fitz.Rect) -> tuple[bytes, str] | None:
        data = _extract_by_xref(document, xref) if xref else None
        if data:
            return data
        return _clip_render(page, bbox)

    # 1) Rich image info with bboxes (best coverage on modern PyMuPDF).
    try:
        for info in page.get_image_info(xrefs=True):
            bbox = fitz.Rect(info.get('bbox'))
            xref = int(info.get('xref') or 0)
            data = resolve_image(xref, bbox)
            if data:
                add_image(_bbox_tuple(bbox), data[0], data[1], xref)
    except Exception:
        pass

    # 2) Classic xref list + placement rects / soft masks.
    try:
        for img in page.get_images(full=True):
            xref = int(img[0])
            smask = int(img[1] or 0)
            rects: list[fitz.Rect] = []
            try:
                rects = list(page.get_image_rects(xref))
            except Exception:
                rects = []
            if not rects:
                try:
                    rects = [fitz.Rect(info['bbox']) for info in page.get_image_info(xrefs=True) if int(info.get('xref') or 0) == xref]
                except Exception:
                    rects = []
            if not rects:
                # Still export the image once with an estimated content box.
                width = min(page.rect.width * 0.4, 260)
                height = min(page.rect.height * 0.3, 200)
                rects = [fitz.Rect(40, 40 + 24 * len(images), 40 + width, 40 + 24 * len(images) + height)]

            for rect in rects:
                data = resolve_image(xref, rect)
                if data:
                    add_image(_bbox_tuple(rect), data[0], data[1], xref)
                # Soft-mask can carry meaningful alpha artwork in some PDFs.
                if smask:
                    mask_data = resolve_image(smask, rect)
                    if mask_data and mask_data[0] != (data[0] if data else None):
                        # Only keep mask if it looks like a real picture, not a tiny alpha map.
                        try:
                            with Image.open(io.BytesIO(mask_data[0])) as mask_image:
                                if mask_image.width >= 40 and mask_image.height >= 40:
                                    add_image(_bbox_tuple(rect), mask_data[0], mask_data[1], smask)
                        except Exception:
                            pass
    except Exception:
        pass

    # 3) Text-dict image blocks (inline / alternate encodings).
    try:
        payload = page.get_text('dict')
        for block in payload.get('blocks', []):
            if block.get('type') != 1:
                continue
            bbox = _bbox_tuple(block.get('bbox', (0, 0, 0, 0)))
            xref = int(block.get('xref') or block.get('number') or 0)
            data = resolve_image(xref, fitz.Rect(bbox))
            if not data and isinstance(block.get('image'), (bytes, bytearray)):
                data = _normalize_image_bytes(bytes(block['image']), 'png')
            if data:
                add_image(bbox, data[0], data[1], xref)
    except Exception:
        pass

    # 4) Rawdict pass for odd inline image objects.
    try:
        raw = page.get_text('rawdict')
        for block in raw.get('blocks', []):
            if block.get('type') != 1:
                continue
            bbox = _bbox_tuple(block.get('bbox', (0, 0, 0, 0)))
            xref = int(block.get('number') or block.get('xref') or 0)
            data = resolve_image(xref, fitz.Rect(bbox))
            if data:
                add_image(bbox, data[0], data[1], xref)
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
    # Keep all discovered images, including those near/inside tables.
    image_blocks = collect_page_images(document, page)

    items: list[tuple[float, float, str, Any]] = []
    for table in tables:
        items.append((table.bbox[1], table.bbox[0], 'table', table))
    for block in text_blocks:
        items.append((block.bbox[1], block.bbox[0], 'block', block))
    for block in image_blocks:
        items.append((block.bbox[1], block.bbox[0], 'block', block))

    items.sort(key=lambda entry: (round(entry[0], 1), round(entry[1], 1)))
    return [(kind, payload) for _y, _x, kind, payload in items]
