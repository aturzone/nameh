from fastapi import Request, HTTPException, Depends
from app.config import settings
import redis.asyncio as redis
import time

class RateLimiter:
    def __init__(self, times: int, seconds: int):
        self.times = times
        self.seconds = seconds
        self._redis = None

    @property
    def redis(self):
        if self._redis is None:
            self._redis = redis.from_url(settings.redis_url)
        return self._redis

    async def __call__(self, request: Request):
        if settings.environment == "test":
            return

        # Use IP address as the key
        key = f"rate_limit:{request.client.host}"

        current_time = int(time.time())
        pipe = self.redis.pipeline()
        pipe.zremrangebyscore(key, 0, current_time - self.seconds)
        pipe.zadd(key, {str(current_time): current_time})
        pipe.zcard(key)
        pipe.expire(key, self.seconds)
        _, _, count, _ = await pipe.execute()

        if count > self.times:
            raise HTTPException(status_code=429, detail="Too many requests")
