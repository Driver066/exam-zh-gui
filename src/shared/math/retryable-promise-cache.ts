export interface RetryablePromiseCache<Key, Value> {
  get(key: Key, factory: () => Promise<Value>): Promise<Value>;
  delete(key: Key): void;
}

export function createRetryablePromiseCache<Key, Value>(): RetryablePromiseCache<Key, Value> {
  const cache = new Map<Key, Promise<Value>>();

  return {
    get(key, factory) {
      const existing = cache.get(key);
      if (existing) return existing;

      const pending = factory().catch((error: unknown) => {
        if (cache.get(key) === pending) cache.delete(key);
        throw error;
      });
      cache.set(key, pending);
      return pending;
    },
    delete(key) {
      cache.delete(key);
    },
  };
}
