import { Router } from 'express'
import { authenticate } from '../../shared/middleware/authenticate'
import { authorize } from '../../shared/middleware/authorize'
import * as controller from './finances.controller'

const router = Router()

router.get('/summary', authenticate, authorize('admin'), controller.getSummary)

export default router
