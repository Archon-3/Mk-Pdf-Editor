from __future__ import annotations

import shutil
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional

from flask import current_app

from backend.app.services.conversion.image_to_pdf import image_to_pdf
from backend.app.services.conversion.pdf_to_image import pdf_to_image
from backend.app.services.conversion.pdf_to_word import pdf_to_word as convert_pdf_to_word
from backend.app.services.extraction.tables import extract_tables
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

    def _job_record(self, job_id: str, tool_id: str, source_path: str, output_path: str, file_name: str) -> Dict[str, Any]:
        return {
            "job_id": job_id,
            "tool_id": tool_id,
            "source_path": source_path,
            "output_path": output_path,
            "file_name": file_name,
            "status": "completed",
            "created_at": str(Path(source_path).stat().st_ctime),
            "download_url": f"/api/jobs/{job_id}/download",
        }

    def process(self, tool_id: str, file_path: str, output_dir: str | None = None, job_id: str | None = None) -> JobResult:
        validation = self.validate_tool(tool_id)
        if not validation["valid"]:
            return JobResult(success=False, error=validation["message"], status="error")

        source_path = Path(file_path)
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
            if tool_id == 'pdf-to-word':
                output_path = str(final_output_dir / f"{active_job_id}_{source_path.stem}.docx")
                output_path = convert_pdf_to_word(source_path, output_path)
            elif tool_id == 'pdf-to-image':
                images_dir = final_output_dir / f"{active_job_id}_images"
                generated = pdf_to_image(source_path, images_dir)
                output_path = generated[0] if generated else output_path
            elif tool_id == 'image-to-pdf':
                output_path = str(final_output_dir / f"{active_job_id}_{source_path.stem}.pdf")
                output_path = image_to_pdf([source_path], output_path)
            elif tool_id == 'extract-tables':
                tables_dir = final_output_dir / f"{active_job_id}_tables"
                generated = extract_tables(source_path, tables_dir)
                output_path = generated[0] if generated else output_path
            else:
                shutil.copy2(source_path, output_path)
        except Exception as exc:  # pragma: no cover - defensive guard
            return JobResult(success=False, error=f"Processing failed for {tool_id}: {exc}", status="error")

        JOB_STORE[active_job_id] = self._job_record(active_job_id, tool_id, str(source_path), output_path, source_path.name)

        return JobResult(
            success=True,
            job_id=active_job_id,
            status="completed",
            download_url=f"/api/jobs/{active_job_id}/download",
            output_path=output_path,
            metadata={"tool_id": tool_id, "source": str(source_path), "output": output_path},
        )

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

        for path_value in dict.fromkeys((record.get("source_path"), record.get("output_path"))):
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
