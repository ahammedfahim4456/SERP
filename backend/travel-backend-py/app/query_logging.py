"""ASGI middleware that records every API request before sending its response."""

import json
import logging
import time
from typing import Any

from starlette.types import ASGIApp, Message, Receive, Scope, Send

from .query_store import QueryStore

log = logging.getLogger(__name__)
MAX_BODY_CHARS = 64_000


class QueryLoggingMiddleware:
    def __init__(self, app: ASGIApp, store: QueryStore):
        self.app = app
        self.store = store

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or not scope.get("path", "").startswith("/api/"):
            await self.app(scope, receive, send)
            return

        request_chunks: list[bytes] = []
        response_messages: list[Message] = []
        started = time.perf_counter()
        status_code = 500

        async def capture_receive() -> Message:
            message = await receive()
            if message["type"] == "http.request":
                request_chunks.append(message.get("body", b""))
            return message

        async def capture_send(message: Message) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
            response_messages.append(message)

        thrown_error: Exception | None = None
        try:
            await self.app(scope, capture_receive, capture_send)
        except Exception as exc:
            thrown_error = exc
            log.exception("Unhandled API exception for %s %s", scope["method"], scope["path"])

        request_body = b"".join(request_chunks).decode("utf-8", errors="replace")
        request_body = request_body[:MAX_BODY_CHARS]
        response_body = b"".join(
            message.get("body", b"")
            for message in response_messages
            if message["type"] == "http.response.body"
        ).decode("utf-8", errors="replace")
        error_detail = self._error_detail(response_body, status_code, thrown_error)
        raw_query = scope.get("query_string", b"").decode("latin-1")

        try:
            await self.store.save_query(
                method=scope["method"],
                path=scope["path"],
                query_string=raw_query,
                request_body=request_body,
                response_status=status_code,
                error_detail=error_detail,
                duration_ms=max(0, int((time.perf_counter() - started) * 1000)),
            )
        except Exception:
            log.exception("Could not persist API query to MySQL")
            payload = json.dumps({"detail": "Query could not be saved to MySQL; request was not completed."}).encode()
            await send({
                "type": "http.response.start",
                "status": 503,
                "headers": [(b"content-type", b"application/json"), (b"content-length", str(len(payload)).encode())],
            })
            await send({"type": "http.response.body", "body": payload})
            return

        if thrown_error is not None and not response_messages:
            payload = json.dumps({"detail": "Internal server error", "error": str(thrown_error)}).encode()
            await send({
                "type": "http.response.start",
                "status": 500,
                "headers": [(b"content-type", b"application/json"), (b"content-length", str(len(payload)).encode())],
            })
            await send({"type": "http.response.body", "body": payload})
            return

        for message in response_messages:
            await send(message)

    @staticmethod
    def _error_detail(body: str, status_code: int, thrown_error: Exception | None) -> str | None:
        if status_code < 400 and thrown_error is None:
            return None
        if thrown_error is not None:
            return f"{type(thrown_error).__name__}: {thrown_error}"
        try:
            data: Any = json.loads(body)
            detail = data.get("detail", data) if isinstance(data, dict) else data
            return str(detail)[:4000]
        except (json.JSONDecodeError, TypeError):
            return body[:4000] or f"HTTP {status_code}"
