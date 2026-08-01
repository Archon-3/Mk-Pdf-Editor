from __future__ import annotations

from typing import Any, Dict


def api_response(success: bool, payload: Dict[str, Any] | None = None, *, error: Dict[str, Any] | None = None) -> Dict[str, Any]:
    response = {"success": success}
    if payload:
        response.update(payload)
    if error:
        response["error"] = error
    return response
