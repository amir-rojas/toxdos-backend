import { Router } from 'express'
import { authenticate } from '../../shared/middleware/authenticate'
import { authorize } from '../../shared/middleware/authorize'
import * as controller from './categories.controller'

const router = Router()

router.get('/', authenticate, controller.getCategories)
router.post('/', authenticate, authorize('admin'), controller.createCategory)

export default router
