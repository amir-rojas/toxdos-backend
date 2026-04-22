import { Router } from 'express'
import { authenticate } from '../../shared/middleware/authenticate'
import * as controller from './customers.controller'

const router = Router()

router.post('/', authenticate, controller.createCustomer)
router.get('/', authenticate, controller.getCustomers)
router.get('/:id', authenticate, controller.getCustomerById)
router.put('/:id', authenticate, controller.updateCustomer)

export default router
