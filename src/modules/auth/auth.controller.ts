import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../../shared/errors'
import * as authService from './auth.service'
import * as authRepository from './auth.repository'
import type { LoginRequest } from './auth.types'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function handleError(err: unknown, res: Response, next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }
  next(err)
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as Partial<LoginRequest>

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' })
      return
    }

    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: 'Invalid email format' })
      return
    }

    const result = await authService.login({ email, password })
    res.status(200).json(result)
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function getUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await authRepository.findAllActive()
    res.status(200).json({ data: users.map(({ user_id, full_name, role }) => ({ user_id, full_name, role })) })
  } catch (err) {
    next(err)
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.user_id
    const user = await authService.getMe(userId)
    res.status(200).json({ user })
  } catch (err) {
    handleError(err, res, next)
  }
}
