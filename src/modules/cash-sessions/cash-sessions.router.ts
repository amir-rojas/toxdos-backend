import { Router } from 'express'
import { authenticate } from '../../shared/middleware/authenticate'
import { authorize } from '../../shared/middleware/authorize'
import * as controller from './cash-sessions.controller'

const router = Router()

// IMPORTANT: static routes MUST be registered before dynamic /:id routes
router.get('/current', authenticate, controller.getCurrentSession)
router.get('/', authenticate, authorize('admin'), controller.getAllSessions)
router.get('/:id', authenticate, controller.getSessionById)
router.post('/', authenticate, controller.openSession)
router.post('/:id/close', authenticate, controller.closeSession)

export default router
