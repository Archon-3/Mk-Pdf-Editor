from __future__ import annotations

from typing import Any, Dict, List

TOOL_CATALOG: List[Dict[str, Any]] = [
    {
        "id": "merge",
        "name": "Merge PDF",
        "description": "Combine multiple PDFs into one document.",
        "category": "transform",
        "accepts": ["pdf"],
        "output": ["pdf"],
    },
    {
        "id": "split",
        "name": "Split PDF",
        "description": "Split a PDF into page ranges or individual pages.",
        "category": "transform",
        "accepts": ["pdf"],
        "output": ["pdf"],
    },
    {
        "id": "compress",
        "name": "Compress PDF",
        "description": "Reduce file size while preserving readability.",
        "category": "transform",
        "accepts": ["pdf"],
        "output": ["pdf"],
    },
    {
        "id": "rotate",
        "name": "Rotate PDF",
        "description": "Rotate all or selected pages.",
        "category": "transform",
        "accepts": ["pdf"],
        "output": ["pdf"],
    },
    {
        "id": "delete-pages",
        "name": "Delete Pages",
        "description": "Remove selected pages from a PDF.",
        "category": "transform",
        "accepts": ["pdf"],
        "output": ["pdf"],
    },
    {
        "id": "page-rearrangement",
        "name": "Page Rearrangement",
        "description": "Reorder and rotate pages.",
        "category": "transform",
        "accepts": ["pdf"],
        "output": ["pdf"],
    },
    {
        "id": "extract-images",
        "name": "Extract Images",
        "description": "Extract embedded images from PDF pages.",
        "category": "extract",
        "accepts": ["pdf"],
        "output": ["zip", "image"],
    },
    {
        "id": "extract-text",
        "name": "Extract Text",
        "description": "Export text from PDF documents.",
        "category": "extract",
        "accepts": ["pdf"],
        "output": ["txt", "docx"],
    },
    {
        "id": "extract-tables",
        "name": "Extract Tables",
        "description": "Extract rows and values from PDF tables.",
        "category": "extract",
        "accepts": ["pdf"],
        "output": ["csv", "xlsx"],
    },
    {
        "id": "pdf-to-word",
        "name": "PDF → Word",
        "description": "Convert a PDF into an editable DOCX file.",
        "category": "convert",
        "accepts": ["pdf"],
        "output": ["docx"],
    },
    {
        "id": "pdf-to-excel",
        "name": "PDF → Excel",
        "description": "Convert PDF tables and text into an editable Excel workbook.",
        "category": "convert",
        "accepts": ["pdf"],
        "output": ["xlsx"],
    },
    {
        "id": "pdf-to-powerpoint",
        "name": "PDF → PowerPoint",
        "description": "Convert PDF pages into editable PowerPoint slides.",
        "category": "convert",
        "accepts": ["pdf"],
        "output": ["pptx"],
    },
    {
        "id": "word-to-pdf",
        "name": "Word → PDF",
        "description": "Convert DOC/DOCX files to PDF.",
        "category": "convert",
        "accepts": ["word"],
        "output": ["pdf"],
    },
    {
        "id": "excel-to-pdf",
        "name": "Excel → PDF",
        "description": "Convert XLS/XLSX spreadsheets to PDF.",
        "category": "convert",
        "accepts": ["excel"],
        "output": ["pdf"],
    },
    {
        "id": "powerpoint-to-pdf",
        "name": "PowerPoint → PDF",
        "description": "Convert PPT/PPTX slides to PDF.",
        "category": "convert",
        "accepts": ["powerpoint"],
        "output": ["pdf"],
    },
    {
        "id": "image-to-pdf",
        "name": "Image → PDF",
        "description": "Combine uploaded images into a single PDF.",
        "category": "convert",
        "accepts": ["image"],
        "output": ["pdf"],
    },
    {
        "id": "pdf-to-image",
        "name": "PDF → Image",
        "description": "Render pages as JPG or PNG files.",
        "category": "convert",
        "accepts": ["pdf"],
        "output": ["image", "zip"],
    },
    {
        "id": "watermark",
        "name": "Watermark",
        "description": "Apply a text or image watermark to a PDF.",
        "category": "edit",
        "accepts": ["pdf"],
        "output": ["pdf"],
    },
    {
        "id": "redaction",
        "name": "Redaction",
        "description": "Remove sensitive areas from the PDF content.",
        "category": "edit",
        "accepts": ["pdf"],
        "output": ["pdf"],
    },
    {
        "id": "annotation",
        "name": "Annotation",
        "description": "Add comments, notes, highlights, and overlays.",
        "category": "edit",
        "accepts": ["pdf"],
        "output": ["pdf"],
    },
    {
        "id": "signature",
        "name": "Signature",
        "description": "Place a signature in the document.",
        "category": "edit",
        "accepts": ["pdf"],
        "output": ["pdf"],
    },
]

TOOL_INDEX = {item["id"]: item for item in TOOL_CATALOG}


def get_tool_meta(tool_id: str) -> Dict[str, Any] | None:
    return TOOL_INDEX.get(tool_id)


def get_supported_extensions(tool_id: str) -> List[str]:
    tool = get_tool_meta(tool_id)
    if not tool:
        return []

    mapping = {
        "pdf": ["pdf"],
        "word": ["doc", "docx"],
        "excel": ["xls", "xlsx", "csv"],
        "powerpoint": ["ppt", "pptx"],
        "image": ["jpg", "jpeg", "png", "webp", "bmp", "tiff"],
        "text": ["txt"],
    }

    accepted = []
    for file_type in tool["accepts"]:
        accepted.extend(mapping.get(file_type, []))
    return accepted
