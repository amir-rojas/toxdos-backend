export type UserRole = 'admin' | 'cashier'

export interface LoginRequest {
  email: string
  password: string
}

export interface UserProfile {
  user_id: number
  full_name: string
  email: string
  role: UserRole
}

export interface LoginResponse {
  token: string
  user: UserProfile
}

export interface MeResponse {
  user: UserProfile
}

export interface ErrorResponse {
  error: string
}

export interface JwtPayload {
  sub: number
  email: string
  role: UserRole
  iat: number
  exp: number
}

// Internal type — includes password_hash for bcrypt.compare only
export interface UserRecord extends UserProfile {
  password_hash: string
  is_active: boolean
  created_at: Date
}

// Express Request augmentation
declare global {
  namespace Express {
    interface Request {
      user?: UserProfile
    }
  }
}
