import type { Request, Response } from 'express'
import rateLimit, { type AugmentedRequest, type Options } from 'express-rate-limit'

export const WINDOW_MS = 15 * 60 * 1000
export const MAX_REQUESTS = 10
export const ERROR_MESSAGE = 'Too many login attempts. Try again later.'

export function keyGenerator(req: Request): string {
  const raw = req.ip
  if (!raw) return 'unknown'
  const stripped = raw.startsWith('::ffff:') ? raw.slice(7) : raw
  if (!stripped.includes(':')) return stripped
  const hextets = stripped.split(':')
  return hextets.slice(0, 4).join(':')
}

const handler: Options['handler'] = (req, res) => {
  const resetTime = (req as AugmentedRequest).rateLimit?.resetTime
  const retryAfterSeconds = resetTime
    ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
    : Math.ceil(WINDOW_MS / 1000)
  res.setHeader('Retry-After', String(retryAfterSeconds))
  res.status(429).json({ error: ERROR_MESSAGE })
}

export const loginRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: MAX_REQUESTS,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator,
  handler,
})
