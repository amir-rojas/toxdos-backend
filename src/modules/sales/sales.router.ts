import { Router } from 'express'
import { authenticate } from '../../shared/middleware/authenticate'
import * as controller from './sales.controller'

const router = Router()

router.post('/', authenticate, controller.createSale)
router.get('/', authenticate, controller.getSales)
router.get('/:id', authenticate, controller.getSaleById)

export default router
