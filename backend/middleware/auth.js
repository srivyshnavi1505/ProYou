import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_production'

/**
 * Express middleware that validates a Bearer JWT.
 * On success, attaches `req.userId` and `req.userEmail`.
 * On failure, responds 401 immediately.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required. Please sign in.' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded  = jwt.verify(token, JWT_SECRET)
    req.userId     = decoded.id
    req.userEmail  = decoded.email
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session. Please sign in again.' })
  }
}
