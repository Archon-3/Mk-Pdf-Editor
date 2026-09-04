from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
import uuid
from functools import lru_cache
from pathlib import Path


FORMAT_FILTERS = {
    'pdf': 'pdf',
    'html': 'html:HTML',
    'docx': 'docx:MS Word 2007 XML',
    'doc': 'doc',
    'xlsx': 'xlsx:Calc MS Excel 2007 XML',
    'xls': 'xls',
    'pptx': 'pptx:Impress MS PowerPoint 2007 XML',
    'ppt': 'ppt',
}


def _candidate_paths() -> list[Path]:
    paths: list[Path] = []
    env_path = os.environ.get('LIBREOFFICE_PATH') or os.environ.get('SOFFICE_PATH')
    if env_path:
        paths.append(Path(env_path))

    program_files = [
        os.environ.get('PROGRAMFILES', r'C:\Program Files'),
        os.environ.get('PROGRAMFILES(X86)', r'C:\Program Files (x86)'),
        os.environ.get('LOCALAPPDATA', ''),
    ]
    for root in program_files:
        if not root:
            continue
        base = Path(root)
        # Prefer .com on Windows for reliable headless conversion.
        paths.extend([
            base / 'LibreOffice' / 'program' / 'soffice.com',
            base / 'LibreOffice' / 'program' / 'soffice.exe',
        ])
        paths.extend(base.glob('LibreOffice */program/soffice.com'))
        paths.extend(base.glob('LibreOffice */program/soffice.exe'))

    paths.extend([
        Path('/usr/bin/soffice'),
        Path('/usr/bin/libreoffice'),
        Path('/Applications/LibreOffice.app/Contents/MacOS/soffice'),
    ])
    return paths


@lru_cache(maxsize=1)
def find_libreoffice() -> str | None:
    for name in ('soffice', 'libreoffice'):
        found = shutil.which(name)
        if found:
            return found

    for candidate in _candidate_paths():
        if candidate.is_file():
            return str(candidate)
    return None


def has_libreoffice() -> bool:
    return find_libreoffice() is not None


def convert_with_libreoffice(
    input_path: str | Path,
    output_path: str | Path,
    target_format: str = 'pdf',
) -> str | None:
    """Convert a document with LibreOffice, preserving colors and layout."""
    executable = find_libreoffice()
    if not executable:
        return None

    source = Path(input_path).resolve()
    output = Path(output_path).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    target_format = target_format.lower().lstrip('.')
    convert_filter = FORMAT_FILTERS.get(target_format, target_format)

    with tempfile.TemporaryDirectory(prefix='lo-profile-') as profile_dir:
        profile_uri = Path(profile_dir).as_uri()
        command = [
            executable,
            '--headless',
            '--nologo',
            '--nolockcheck',
            '--nodefault',
            '--norestore',
            f'-env:UserInstallation={profile_uri}',
            '--convert-to',
            convert_filter,
            '--outdir',
            str(output.parent),
            str(source),
        ]
        # LibreOffice may write using the source stem into outdir.
        expected = output.parent / f'{source.stem}.{target_format}'
        # Avoid collisions when another file with the same stem exists.
        unique_source = source
        if expected.exists() and expected.resolve() != output.resolve():
            unique_source = output.parent / f'{uuid.uuid4().hex}_{source.name}'
            shutil.copy2(source, unique_source)
            expected = output.parent / f'{unique_source.stem}.{target_format}'
            command[-1] = str(unique_source)

        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=180,
            check=False,
        )
        if unique_source != source and unique_source.exists():
            unique_source.unlink(missing_ok=True)

        if completed.returncode != 0 and not expected.exists():
            return None

        rendered = expected if expected.exists() else (output.parent / f'{source.stem}.{target_format}')
        if not rendered.exists():
            return None
        if rendered.resolve() != output.resolve():
            if output.exists():
                output.unlink()
            rendered.replace(output)
        return str(output) if output.exists() else None


def render_office_to_pdf(input_path: str | Path, output_path: str | Path) -> str | None:
    """Render an Office document to PDF with LibreOffice when installed."""
    return convert_with_libreoffice(input_path, output_path, 'pdf')
