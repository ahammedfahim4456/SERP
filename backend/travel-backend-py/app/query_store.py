"""Persistent MySQL storage for incoming API queries."""

import ssl
from datetime import datetime, timezone

import aiomysql

from .config import Settings


class QueryStore:
    def __init__(self, settings: Settings | None):
        self.settings = settings
        self.pool = None

    @classmethod
    def from_settings(cls, settings: Settings | None = None) -> "QueryStore":
        return cls(settings)

    def _connection_settings(self) -> dict:
        settings = self.settings
        if settings is None:
            raise RuntimeError("MySQL settings were not loaded before startup")
        missing = [
            name for name, value in (
                ("MYSQL_HOST", settings.mysql_host),
                ("MYSQL_USER", settings.mysql_user),
                ("MYSQL_PASSWORD", settings.mysql_password),
                ("MYSQL_DATABASE", settings.mysql_database),
            ) if not value
        ]
        if missing:
            raise RuntimeError(
                "MySQL is required to persist API queries. Set these values in backend/.env: "
                + ", ".join(missing)
            )

        connection_settings = {
            "user": settings.mysql_user,
            "password": settings.mysql_password,
            "host": settings.mysql_host,
            "port": settings.mysql_port,
            "db": settings.mysql_database,
            "charset": "utf8mb4",
            "autocommit": False,
            "minsize": 1,
            "maxsize": 10,
        }
        if settings.mysql_ssl:
            # Use the runtime's trusted CA store and verify the server certificate.
            connection_settings["ssl"] = ssl.create_default_context()
        return connection_settings

    async def initialize(self) -> None:
        self.pool = await aiomysql.create_pool(**self._connection_settings())
        try:
            async with self.pool.acquire() as connection:
                async with connection.cursor() as cursor:
                    await cursor.execute(
                        """CREATE TABLE IF NOT EXISTS api_query_log (
                            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                            method VARCHAR(10) NOT NULL,
                            path VARCHAR(512) NOT NULL,
                            query_string MEDIUMTEXT NOT NULL,
                            request_body MEDIUMTEXT NOT NULL,
                            response_status INT NOT NULL,
                            error_detail TEXT NULL,
                            duration_ms INT NOT NULL,
                            created_at DATETIME(6) NOT NULL
                        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"""
                    )
                await connection.commit()
        except Exception:
            self.pool.close()
            await self.pool.wait_closed()
            self.pool = None
            raise

    async def save_query(
        self,
        *,
        method: str,
        path: str,
        query_string: str,
        request_body: str,
        response_status: int,
        error_detail: str | None,
        duration_ms: int,
    ) -> None:
        if self.pool is None:
            raise RuntimeError("MySQL query store has not been initialized")
        async with self.pool.acquire() as connection:
            try:
                async with connection.cursor() as cursor:
                    await cursor.execute(
                        """INSERT INTO api_query_log
                        (method, path, query_string, request_body, response_status,
                         error_detail, duration_ms, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                        (
                            method,
                            path,
                            query_string,
                            request_body,
                            response_status,
                            error_detail,
                            duration_ms,
                            datetime.now(timezone.utc).replace(tzinfo=None),
                        ),
                    )
                await connection.commit()
            except Exception:
                await connection.rollback()
                raise

    async def close(self) -> None:
        if self.pool is not None:
            self.pool.close()
            await self.pool.wait_closed()
            self.pool = None
