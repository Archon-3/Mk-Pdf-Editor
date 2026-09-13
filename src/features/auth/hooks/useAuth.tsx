import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react'
import { authApi, firebaseAuthErrorMessage } from '../api/authApi.ts'
import { rememberAuthUser } from '../../../shared/api/client'
import type { AuthUser, LoginInput, SignupInput } from '../types.ts'

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  firebaseReady: boolean
  signup: (input: SignupInput) => Promise<AuthUser>
  login: (input: LoginInput) => Promise<AuthUser>
  continueWithGoogle: () => Promise<AuthUser>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const firebaseReady = authApi.isConfigured()

  useEffect(() => {
    if (!firebaseReady) {
      setUser(null)
      setIsLoading(false)
      return
    }
    const unsub = authApi.watchAuth((next) => {
      setUser(next)
      rememberAuthUser(next ? { id: next.id, email: next.email } : null)
      setIsLoading(false)
    })
    return unsub
  }, [firebaseReady])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      firebaseReady,
      async signup(input) {
        try {
          const next = await authApi.signup(input)
          setUser(next)
          rememberAuthUser({ id: next.id, email: next.email })
          return next
        } catch (error) {
          throw new Error(firebaseAuthErrorMessage(error))
        }
      },
      async login(input) {
        try {
          const next = await authApi.login(input)
          setUser(next)
          rememberAuthUser({ id: next.id, email: next.email })
          return next
        } catch (error) {
          throw new Error(firebaseAuthErrorMessage(error))
        }
      },
      async continueWithGoogle() {
        try {
          const next = await authApi.continueWithGoogle()
          setUser(next)
          rememberAuthUser({ id: next.id, email: next.email })
          return next
        } catch (error) {
          throw new Error(firebaseAuthErrorMessage(error))
        }
      },
      async logout() {
        await authApi.logout()
        rememberAuthUser(null)
        setUser(null)
      },
    }),
    [user, isLoading, firebaseReady],
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
