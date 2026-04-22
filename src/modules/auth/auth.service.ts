import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { AppError } from '../../shared/errors'
import * as authRepository from './auth.repository'
import type { LoginRequest, LoginResponse, UserProfile } from './auth.types'

export class AuthError extends AppError {
  constructor(message: string, statusCode: number) {
    super(message, statusCode, statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN')
  }
}

export async function login(dto: LoginRequest): Promise<LoginResponse> {
  const user = await authRepository.findByEmail(dto.email)

  if (!user) {
    throw new AuthError('Invalid credentials', 401)
  }

  if (!user.is_active) {
    throw new AuthError('Account is inactive', 403)
  }

  const passwordMatch = await bcrypt.compare(dto.password, user.password_hash)
  if (!passwordMatch) {
    throw new AuthError('Invalid credentials', 401)
  }

  const secret = process.env['JWT_SECRET'] as string
  const token = jwt.sign(
    { sub: user.user_id, email: user.email, role: user.role },
    secret,
    { algorithm: 'HS256', expiresIn: '8h' }
  )

  return {
    token,
    user: {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    },
  }
}

export async function getMe(userId: number): Promise<UserProfile> {
  const user = await authRepository.findById(userId)

  if (!user) {
    throw new AuthError('User not found', 401)
  }

  if (!user.is_active) {
    throw new AuthError('Account is inactive', 403)
  }

  return { user_id: user.user_id, full_name: user.full_name, email: user.email, role: user.role }
}
