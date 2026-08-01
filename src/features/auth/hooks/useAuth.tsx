import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react'
import { authApi } from '../api/authApi.ts'
import type { AuthUser, LoginInput, SignupInput } from '../types.ts'

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  signup: (input: SignupInput) => Promise<AuthUser>
  login: (input: LoginInput) => Promise<AuthUser>
  continueWithGoogle: (token: string) => Promise<AuthUser>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    authApi.getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      async signup(input) {
        const next = await authApi.signup(input)
        setUser(next)
        return next
      },
      async login(input) {
        const next = await authApi.login(input)
        setUser(next)
        return next
      },
      async continueWithGoogle(token) {
        const next = await authApi.continueWithGoogle(token)
        setUser(next)
        return next
      },
      async logout() {
        await authApi.logout()
        setUser(null)
      },
    }),
    [user, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
