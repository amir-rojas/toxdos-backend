import { Router } from 'express'
import { authenticate } from '../../shared/middleware/authenticate'
import { authorize } from '../../shared/middleware/authorize'
import { loginRateLimiter } from '../../shared/middleware/rate-limit'
import * as authController from './auth.controller'

const router = Router()

router.post('/login', loginRateLimiter, authController.login)
router.get('/me', authenticate, authController.getMe)
router.get('/users', authenticate, authorize('admin'), authController.getUsers)

export default router
