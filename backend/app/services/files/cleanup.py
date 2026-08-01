from __future__ import annotations

import os
from pathlib import Path


def cleanup_temp_files(paths: list[str | Path]) -> None:
    for item in paths:
        candidate = Path(item)
        if candidate.exists():
            candidate.unlink(missing_ok=True)
