import { Router } from 'express'
import { authenticate } from '../../shared/middleware/authenticate'
import * as controller from './dashboard.controller'

const router = Router()

router.get('/summary', authenticate, controller.getSummary)

export default router
