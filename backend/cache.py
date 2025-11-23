import os
import redis
import pickle

REDIS_HOST = os.getenv("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB   = int(os.getenv("REDIS_DB", 0))

r = redis.StrictRedis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    db=REDIS_DB,
    decode_responses=False
)

def make_key(*parts):
    return ":".join([str(p) for p in parts])

def set_cache(key, value, ttl_seconds=3600):
    r.set(key, pickle.dumps(value), ex=ttl_seconds)

def get_cache(key):
    raw = r.get(key)
    return pickle.loads(raw) if raw else None
