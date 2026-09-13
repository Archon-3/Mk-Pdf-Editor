import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth, isFirebaseConfigured } from '../../../shared/firebase/config'
import type { AuthUser, LoginInput, SignupInput } from '../types'

function mapUser(user: User): AuthUser {
  const isGoogle = user.providerData.some((p) => p.providerId === 'google.com')
  return {
    id: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    provider: isGoogle ? 'google' : 'email',
    picture: user.photoURL || undefined,
  }
}

export const authApi = {
  isConfigured: isFirebaseConfigured,

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!isFirebaseConfigured()) return null
    const auth = getFirebaseAuth()
    if (auth.currentUser) return mapUser(auth.currentUser)
    return new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (user) => {
        unsub()
        resolve(user ? mapUser(user) : null)
      })
    })
  },

  watchAuth(callback: (user: AuthUser | null) => void) {
    if (!isFirebaseConfigured()) {
      callback(null)
      return () => undefined
    }
    const auth = getFirebaseAuth()
    return onAuthStateChanged(auth, (user) => {
      callback(user ? mapUser(user) : null)
    })
  },

  async signup(input: SignupInput): Promise<AuthUser> {
    const auth = getFirebaseAuth()
    const credential = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password)
    if (input.name.trim()) {
      await updateProfile(credential.user, { displayName: input.name.trim() })
    }
    return mapUser(credential.user)
  },

  async login(input: LoginInput): Promise<AuthUser> {
    const auth = getFirebaseAuth()
    const credential = await signInWithEmailAndPassword(auth, input.email.trim(), input.password)
    return mapUser(credential.user)
  },

  async continueWithGoogle(): Promise<AuthUser> {
    const auth = getFirebaseAuth()
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const credential = await signInWithPopup(auth, provider)
    return mapUser(credential.user)
  },

  async logout(): Promise<void> {
    if (!isFirebaseConfigured()) return
    await signOut(getFirebaseAuth())
  },
}

export function firebaseAuthErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error
    ? String((error as { code?: string }).code || '')
    : ''
  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email is already registered. Try logging in.'
    case 'auth/invalid-email':
      return 'Enter a valid email address.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.'
    case 'auth/unauthorized-domain':
      return 'This domain is not allowed in Firebase Auth settings. Add localhost in Firebase Console.'
    default:
      return error instanceof Error ? error.message : 'Authentication failed. Please try again.'
  }
}
