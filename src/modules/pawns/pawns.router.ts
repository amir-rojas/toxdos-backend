import { Router } from 'express'
import { authenticate } from '../../shared/middleware/authenticate'
import * as controller from './pawns.controller'

const router = Router()

router.post('/', authenticate, controller.createPawn)
router.get('/', authenticate, controller.getPawns)
router.get('/:id/debt', authenticate, controller.getPawnDebt)
router.get('/:id', authenticate, controller.getPawnById)
router.patch('/:id/forfeit', authenticate, controller.forfeitPawn)

export default router
