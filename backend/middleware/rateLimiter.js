/**
 * Centralised rate-limit definitions for ProYou.
 *
 * Strategy:
 *  - globalLimit     : catch-all IP limit on every request
 *  - authLimit       : tight limit on login/register/forgot-password (brute-force prevention)
 *  - aiLimit         : per-USER limit on /api/ai/* (Groq quota protection)
 *  - publicLimit     : light limit for unauthenticated data endpoints
 *                      (/api/github/:username, /api/leetcode/:username, /api/facts/random)
 *
 * All limits use the default in-memory store (suitable for single-instance;
 * swap to redis-rate-limit store for multi-process/cluster deployments).
 */

import rateLimit from 'express-rate-limit'

/** Reusable JSON response for 429 so every limit returns the same shape */
const handler = (req, res) =>
  res.status(429).json({ message: 'Too many requests — please slow down and try again later.' })

/** Catch-all: 300 req / 15 min per IP */
export const globalLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
})

/** Auth endpoints: 20 req / 15 min per IP (brute-force protection) */
export const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
})

/**
 * AI endpoints: 30 req / hour per USER.
 * Mounted after requireAuth, so req.userId is always present.
 * Per-user keying is the stronger choice here since we're guarding a
 * cost budget (Groq tokens), not just generic abuse — a single user
 * burning quota from multiple IPs shouldn't bypass the limit.
 */
export const aiLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip,
  handler,
})

/**
 * Public data endpoints: 60 req / 10 min per IP.
 * Covers /api/github/:username, /api/leetcode/:username, /api/facts/random.
 * In-memory cache means most hits never reach the upstream API, but
 * this still stops abusive scraping.
 */
export const publicLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
})
