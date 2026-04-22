import { Router } from 'express'
import { authenticate } from '../../shared/middleware/authenticate'
import { authorize } from '../../shared/middleware/authorize'
import * as controller from './accrued-charges.controller'

const router = Router()

// IMPORTANT: /accrue must be registered BEFORE /:id
router.post('/accrue', authenticate, authorize('admin'), controller.runAccrual)
router.get('/', authenticate, authorize('admin'), controller.getAccruedCharges)
router.get('/:id', authenticate, authorize('admin'), controller.getAccruedChargeById)

export default router
