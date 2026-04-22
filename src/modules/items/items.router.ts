import { Router } from 'express'
import { authenticate } from '../../shared/middleware/authenticate'
import * as controller from './items.controller'

const router = Router()

router.get('/', authenticate, controller.getItems)
router.get('/:id', authenticate, controller.getItemById)

export default router
