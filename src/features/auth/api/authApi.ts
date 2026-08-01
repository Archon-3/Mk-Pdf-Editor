import type { AuthUser, LoginInput, SignupInput } from '../types.ts'
import { API_BASE_URL } from '../../../shared/constants/branding.ts'

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const token = localStorage.getItem('auth_token')
  const headers = new Headers(options?.headers)

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Request failed')
  }
  
  return response.json()
}

export const authApi = {
  async getCurrentUser(): Promise<AuthUser | null> {
    const token = localStorage.getItem('auth_token')
    if (!token) return null
    
    try {
      const data = await fetchAPI('/api/auth/me')
      return data.user
    } catch {
      localStorage.removeItem('auth_token')
      return null
    }
  },

  async signup(input: SignupInput): Promise<AuthUser> {
    const data = await fetchAPI('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    
    localStorage.setItem('auth_token', data.token)
    return data.user
  },

  async login(input: LoginInput): Promise<AuthUser> {
    const data = await fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    
    localStorage.setItem('auth_token', data.token)
    return data.user
  },

  async continueWithGoogle(googleToken: string): Promise<AuthUser> {
    const data = await fetchAPI('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token: googleToken }),
    })
    
    localStorage.setItem('auth_token', data.token)
    return data.user
  },

  async logout(): Promise<void> {
    await fetchAPI('/api/auth/logout', { method: 'POST' })
    localStorage.removeItem('auth_token')
  },
}
