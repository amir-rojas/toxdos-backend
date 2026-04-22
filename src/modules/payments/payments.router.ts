import { Router } from 'express'
import { authenticate } from '../../shared/middleware/authenticate'
import * as controller from './payments.controller'

const router = Router()

router.post('/', authenticate, controller.createPayment)
router.get('/', authenticate, controller.getPayments)
router.get('/:id', authenticate, controller.getPaymentById)

export default router
