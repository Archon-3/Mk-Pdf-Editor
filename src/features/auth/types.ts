export type AuthUser = {
  id: string
  name: string
  email: string
  provider: 'email' | 'google'
  picture?: string
}

export type SignupInput = {
  name: string
  email: string
  password: string
}

export type LoginInput = {
  email: string
  password: string
}
