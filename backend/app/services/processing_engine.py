from __future__ import annotations

import shutil
import time
import uuid
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional

from flask import current_app

from backend.app.services.conversion.image_to_pdf import image_to_pdf
from backend.app.services.conversion.excel_to_pdf import excel_to_pdf
from backend.app.services.conversion.powerpoint_to_pdf import powerpoint_to_pdf
from backend.app.services.conversion.pdf_to_image import pdf_to_image
from backend.app.services.conversion.pdf_to_word import pdf_to_word as convert_pdf_to_word
from backend.app.services.conversion.pdf_to_excel import pdf_to_excel
from backend.app.services.conversion.pdf_to_powerpoint import pdf_to_powerpoint
from backend.app.services.conversion.word_to_pdf import word_to_pdf
from backend.app.services.extraction.images import extract_images
from backend.app.services.extraction.text import extract_text
from backend.app.services.extraction.tables import extract_tables
from backend.app.services.pdf.merger import merge_pdfs
from backend.app.services.pdf.splitter import split_pdf
from backend.app.services.tool_registry import get_tool_meta
from backend.app.utils.security import safe_filename

JOB_STORE: Dict[str, Dict[str, Any]] = {}


@dataclass
class JobResult:
    success: bool = True
    job_id: str = ""
    status: str = "queued"
    download_url: Optional[str] = None
    output_path: Optional[str] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class ProcessingEngine:
    """Minimal product-style orchestration layer for DocuForge operations."""

    def validate_tool(self, tool_id: str) -> Dict[str, Any]:
        tool = get_tool_meta(tool_id)
        if not tool:
            return {"valid": False, "code": "UNSUPPORTED_TOOL", "message": "This tool is not supported."}
        return {"valid": True, "tool": tool}

    def _ensure_dirs(self) -> tuple[Path, Path]:
        try:
            root = Path(current_app.root_path).parent
        except RuntimeError:
            root = Path(__file__).resolve().parents[2]

        upload_dir = (root / "uploads").resolve()
        output_dir = (root / "output").resolve()
        upload_dir.mkdir(parents=True, exist_ok=True)
        output_dir.mkdir(parents=True, exist_ok=True)
        return upload_dir, output_dir

    def _job_record(self, job_id: str, tool_id: str, source_path: str, output_path: str, file_name: str, source_paths: list[str] | None = None) -> Dict[str, Any]:
        return {
            "job_id": job_id,
            "tool_id": tool_id,
            "source_path": source_path,
            "source_paths": source_paths or [source_path],
            "output_path": output_path,
            "file_name": file_name,
            "status": "completed",
            "created_at": str(Path(source_path).stat().st_ctime),
            "download_url": f"/api/jobs/{job_id}/download",
        }

    def process(self, tool_id: str, file_path: str | list[str], output_dir: str | None = None, options: Dict[str, Any] | None = None, job_id: str | None = None) -> JobResult:
        validation = self.validate_tool(tool_id)
        if not validation["valid"]:
            return JobResult(success=False, error=validation["message"], status="error")

        input_paths = [Path(path) for path in file_path] if isinstance(file_path, list) else [Path(file_path)]
        source_path = input_paths[0]
        if not source_path.exists():
            return JobResult(success=False, error="The uploaded file could not be found.", status="error")

        active_job_id = job_id or uuid.uuid4().hex
        upload_dir, output_root = self._ensure_dirs()
        final_output_dir = Path(output_dir) if output_dir else output_root
        final_output_dir.mkdir(parents=True, exist_ok=True)

        safe_name = safe_filename(source_path.name)
        output_name = f"{active_job_id}_{safe_name}"
        output_path = str(final_output_dir / output_name)

        try:
            if tool_id == 'merge':
                if len(input_paths) < 2:
                    return JobResult(success=False, error='Merge requires at least two PDF files.', status='error')
                output_path = str(final_output_dir / f'{active_job_id}_{source_path.stem}.pdf')
                output_path = merge_pdfs(input_paths, output_path)
            elif tool_id == 'split':
                split_ranges = (options or {}).get('pages', '')
                ranges = [value.strip() for value in str(split_ranges).split(';') if value.strip()]
                parts = split_pdf(source_path, ranges, final_output_dir / f'{active_job_id}_parts')
                output_path = self._zip_files(parts, final_output_dir / f'{active_job_id}_{source_path.stem}_split.zip')
            elif tool_id in {'compress', 'rotate', 'delete-pages', 'page-rearrangement', 'watermark', 'redaction', 'annotation', 'signature'}:
                output_path = self._edit_pdf(tool_id, source_path, final_output_dir / f'{active_job_id}_{source_path.stem}.pdf', options or {})
            elif tool_id == 'pdf-to-word':
                output_path = str(final_output_dir / f"{active_job_id}_{source_path.stem}.docx")
                output_path = convert_pdf_to_word(source_path, output_path)
            elif tool_id == 'pdf-to-excel':
                output_path = str(final_output_dir / f'{active_job_id}_{source_path.stem}.xlsx')
                output_path = pdf_to_excel(source_path, output_path)
            elif tool_id == 'pdf-to-powerpoint':
                output_path = str(final_output_dir / f'{active_job_id}_{source_path.stem}.pptx')
                output_path = pdf_to_powerpoint(source_path, output_path)
            elif tool_id == 'word-to-pdf':
                output_path = str(final_output_dir / f'{active_job_id}_{source_path.stem}.pdf')
                output_path = word_to_pdf(source_path, output_path)
            elif tool_id == 'excel-to-pdf':
                output_path = str(final_output_dir / f'{active_job_id}_{source_path.stem}.pdf')
                output_path = excel_to_pdf(source_path, output_path)
            elif tool_id == 'powerpoint-to-pdf':
                output_path = str(final_output_dir / f'{active_job_id}_{source_path.stem}.pdf')
                output_path = powerpoint_to_pdf(source_path, output_path)
            elif tool_id == 'pdf-to-image':
                images_dir = final_output_dir / f"{active_job_id}_images"
                generated = pdf_to_image(source_path, images_dir)
                output_path = self._zip_files(generated, final_output_dir / f'{active_job_id}_{source_path.stem}_images.zip')
            elif tool_id == 'image-to-pdf':
                output_path = str(final_output_dir / f"{active_job_id}_{source_path.stem}.pdf")
                output_path = image_to_pdf(input_paths, output_path)
            elif tool_id == 'extract-images':
                images_dir = final_output_dir / f'{active_job_id}_extracted_images'
                generated = extract_images(source_path, images_dir)
                output_path = self._zip_files(generated, final_output_dir / f'{active_job_id}_{source_path.stem}_images.zip')
            elif tool_id == 'extract-text':
                output_path = str(final_output_dir / f'{active_job_id}_{source_path.stem}.txt')
                output_path = extract_text(source_path, output_path)
            elif tool_id == 'extract-tables':
                tables_dir = final_output_dir / f"{active_job_id}_tables"
                generated = extract_tables(source_path, tables_dir)
                output_path = generated[0] if generated else output_path
            else:
                shutil.copy2(source_path, output_path)
        except Exception as exc:  # pragma: no cover - defensive guard
            return JobResult(success=False, error=f"Processing failed for {tool_id}: {exc}", status="error")

        JOB_STORE[active_job_id] = self._job_record(active_job_id, tool_id, str(source_path), output_path, Path(output_path).name, [str(path) for path in input_paths])

        return JobResult(
            success=True,
            job_id=active_job_id,
            status="completed",
            download_url=f"/api/jobs/{active_job_id}/download",
            output_path=output_path,
            metadata={"tool_id": tool_id, "source": str(source_path), "output": output_path},
        )

    @staticmethod
    def _zip_files(file_paths: list[str], output_path: Path) -> str:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as archive:
            for file_path in file_paths:
                archive.write(file_path, Path(file_path).name)
        return str(output_path)

    @staticmethod
    def _edit_pdf(tool_id: str, source_path: Path, output_path: Path, options: Dict[str, Any]) -> str:
        import fitz

        with fitz.open(source_path) as document:
            if tool_id == 'rotate':
                angle = int(options.get('angle', 90))
                for page in document:
                    page.set_rotation((page.rotation + angle) % 360)
            elif tool_id == 'delete-pages' and document.page_count > 1:
                page_number = max(1, int(options.get('page', 1))) - 1
                if page_number < document.page_count:
                    document.delete_page(page_number)
            elif tool_id == 'page-rearrangement' and document.page_count > 1:
                reordered = fitz.open()
                order_text = str(options.get('order', '')).strip()
                order = [int(value.strip()) - 1 for value in order_text.split(',') if value.strip().isdigit()] if order_text else list(range(document.page_count))
                order.extend(index for index in range(document.page_count) if index not in order)
                for page_index in order:
                    if 0 <= page_index < document.page_count:
                        reordered.insert_pdf(document, from_page=page_index, to_page=page_index)
                reordered.save(output_path)
                reordered.close()
                return str(output_path)
            elif tool_id == 'watermark':
                watermark_text = str(options.get('text', 'MK PDF')).strip() or 'MK PDF'
                for page in document:
                    center = fitz.Point(page.rect.width / 2, page.rect.height / 2)
                    # rotate= only allows 0/90/180/270 — use morph for diagonal text
                    page.insert_text(
                        center,
                        watermark_text[:48],
                        fontsize=36,
                        color=(0.62, 0.62, 0.62),
                        fill_opacity=0.35,
                        morph=(center, fitz.Matrix(45)),
                        overlay=True,
                    )
            elif tool_id == 'compress':
                quality = str(options.get('quality', 'medium')).strip().lower()
                jpeg_quality = {'low': 35, 'medium': 55, 'high': 75}.get(quality, 55)
                max_edge = {'low': 1000, 'medium': 1400, 'high': 1800}.get(quality, 1400)
                try:
                    from PIL import Image
                    import io as _io

                    for page in document:
                        for image_info in page.get_images(full=True):
                            xref = image_info[0]
                            try:
                                extracted = document.extract_image(xref)
                            except Exception:
                                continue
                            image_bytes = extracted.get('image')
                            if not image_bytes:
                                continue
                            try:
                                image = Image.open(_io.BytesIO(image_bytes))
                            except Exception:
                                continue
                            if image.mode not in {'RGB', 'L'}:
                                image = image.convert('RGB')
                            width, height = image.size
                            longest = max(width, height)
                            if longest > max_edge:
                                scale = max_edge / float(longest)
                                image = image.resize(
                                    (max(1, int(width * scale)), max(1, int(height * scale))),
                                    Image.Resampling.LANCZOS,
                                )
                            buffer = _io.BytesIO()
                            image.save(buffer, format='JPEG', quality=jpeg_quality, optimize=True)
                            try:
                                page.replace_image(xref, stream=buffer.getvalue())
                            except Exception:
                                # Older PyMuPDF: rewrite stream when replace_image is unavailable
                                try:
                                    document.update_stream(xref, buffer.getvalue())
                                except Exception:
                                    continue
                    for page in document:
                        try:
                            page.clean_contents()
                        except Exception:
                            pass
                except Exception:
                    # Still rewrite/deflate below even if image pass fails
                    pass
            elif tool_id in {'annotation', 'signature'}:
                note_text = str(options.get('text', 'MK PDF note')).strip() or 'MK PDF note'
                for page in document:
                    page.add_text_annot((54, 54), note_text[:200])
            elif tool_id == 'redaction':
                search_text = str(options.get('text', '')).strip()
                for page in document:
                    if search_text:
                        for rectangle in page.search_for(search_text):
                            page.add_redact_annot(rectangle, fill=(1, 1, 1))
                        page.apply_redactions()
            # Always rewrite: compress and all edit tools benefit from garbage collection.
            document.save(
                output_path,
                garbage=4,
                deflate=True,
                deflate_images=True,
                deflate_fonts=True,
                clean=True,
            )
        return str(output_path)

    def get_status(self, job_id: str) -> Dict[str, Any]:
        record = JOB_STORE.get(job_id)
        if not record:
            return {"success": False, "error": "Job not found.", "job_id": job_id, "status": "missing"}

        return {
            "success": True,
            "job_id": job_id,
            "status": record.get("status", "completed"),
            "filename": record.get("file_name"),
            "download_url": record.get("download_url"),
        }

    def get_job(self, job_id: str) -> Dict[str, Any] | None:
        return JOB_STORE.get(job_id)

    def cleanup_job(self, job_id: str) -> None:
        record = JOB_STORE.get(job_id)
        if not record:
            return

        paths = record.get('source_paths') or [record.get('source_path')]
        for path_value in dict.fromkeys((*paths, record.get("output_path"))):
            if not path_value:
                continue

            target = Path(path_value)
            for _ in range(10):
                try:
                    if target.exists():
                        target.unlink()
                    break
                except PermissionError:
                    time.sleep(0.05)
                    continue
                except FileNotFoundError:
                    break

        JOB_STORE.pop(job_id, None)
