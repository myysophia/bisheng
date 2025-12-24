import time
from threading import RLock
from typing import Any, Optional


class MemoryTTLCache:
    def __init__(self) -> None:
        self._store: dict[str, tuple[float, Any]] = {}
        self._lock = RLock()

    def get(self, key: str) -> Optional[Any]:
        now = time.time()
        with self._lock:
            item = self._store.get(key)
            if not item:
                return None
            expires_at, value = item
            if expires_at < now:
                self._store.pop(key, None)
                return None
            return value

    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        expires_at = time.time() + ttl_seconds
        with self._lock:
            self._store[key] = (expires_at, value)

    def clear(self, key_prefix: str) -> None:
        with self._lock:
            keys = [key for key in self._store.keys() if key.startswith(key_prefix)]
            for key in keys:
                self._store.pop(key, None)


education_cache = MemoryTTLCache()
