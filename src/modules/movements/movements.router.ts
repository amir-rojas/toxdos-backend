import { Router } from 'express'
import { authenticate } from '../../shared/middleware/authenticate'
import * as controller from './movements.controller'

const router = Router()

router.get('/', authenticate, controller.getMovements)
router.get('/:id', authenticate, controller.getMovementById)

export default router
