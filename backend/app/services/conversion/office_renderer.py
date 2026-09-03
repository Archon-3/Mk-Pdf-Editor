from __future__ import annotations

import shutil
import subprocess
from pathlib import Path


def render_office_to_pdf(input_path: str | Path, output_path: str | Path) -> str | None:
    """Render an Office document with LibreOffice when it is installed."""
    executable = shutil.which('soffice') or shutil.which('libreoffice')
    if not executable:
        return None

    source = Path(input_path).resolve()
    output = Path(output_path).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [executable, '--headless', '--convert-to', 'pdf', '--outdir', str(output.parent), str(source)],
        check=True,
        capture_output=True,
        text=True,
        timeout=120,
    )
    rendered = output.parent / f'{source.stem}.pdf'
    if rendered != output:
        if not rendered.exists():
            return None
        rendered.replace(output)
    return str(output) if output.exists() else None