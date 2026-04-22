import { Router } from 'express'
import { authenticate } from '../../shared/middleware/authenticate'
import * as controller from './expenses.controller'

const router = Router()

router.post('/', authenticate, controller.createExpense)
router.get('/', authenticate, controller.getExpenses)
router.get('/:id', authenticate, controller.getExpenseById)

export default router
