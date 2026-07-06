/**
 * Simple bounded LRU-ish cache with TTL.
 *
 * Guarantees:
 *  - At most `maxSize` entries exist at any time.
 *  - Expired entries are lazily evicted on `get()` and eagerly on `set()`.
 *  - When inserting beyond capacity, the oldest entry is evicted.
 *
 * This replaces the previous unbounded `new Map()` caches that would grow
 * forever as new unique usernames / queries came in.
 */
export class BoundedCache {
  /**
   * @param {number} maxSize  Maximum number of entries (default 1000)
   * @param {number} ttlMs    Time-to-live in milliseconds
   */
  constructor(maxSize = 1000, ttlMs = 6 * 60 * 60 * 1000) {
    this._map     = new Map()   // insertion-order is preserved
    this._maxSize = maxSize
    this._ttl     = ttlMs
  }

  /** Returns the cached value or `undefined` if missing / expired. */
  get(key) {
    const entry = this._map.get(key)
    if (!entry) return undefined
    if (Date.now() - entry.ts > this._ttl) {
      this._map.delete(key)
      return undefined
    }
    return entry.data
  }

  /** Stores a value, evicting the oldest entry if at capacity. */
  set(key, data) {
    // If key already exists, delete so re-insert moves it to the end
    if (this._map.has(key)) this._map.delete(key)

    // Evict oldest entries until under capacity
    while (this._map.size >= this._maxSize) {
      const oldest = this._map.keys().next().value
      this._map.delete(oldest)
    }

    this._map.set(key, { ts: Date.now(), data })
  }

  /** Check if a non-expired entry exists. */
  has(key) {
    return this.get(key) !== undefined
  }

  /** Number of entries currently stored (may include expired). */
  get size() {
    return this._map.size
  }
}
