from __future__ import annotations

from typing import Any, Dict


def build_editor_state(document: str) -> Dict[str, Any]:
    return {
        'document': document,
        'current_page': 1,
        'zoom': 100,
        'selected_elements': [],
        'pages': [],
        'elements': [],
        'undo_history': [],
        'redo_history': [],
        'dirty': False,
        'processing': False,
    }
