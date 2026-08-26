import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
  role: string
  verified: boolean
  profile?: any
}

interface AuthStore {
  token: string | null
  user: User | null
  setAuth: (token: string | null, user: User | null) => void
  logout: () => void
  isAuthenticated: boolean
}

type AuthSetter = (
  state:
    | AuthStore
    | Partial<AuthStore>
    | ((state: AuthStore) => AuthStore | Partial<AuthStore>),
  replace?: boolean
) => void

const authStore = (set: AuthSetter): AuthStore => {
  // Initialize from localStorage
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  return {
    token,
    user,
    isAuthenticated: !!token,
    setAuth: (newToken: string | null, newUser: User | null) => {
      if (newToken) {
        localStorage.setItem('token', newToken)
        if (newUser) {
          localStorage.setItem('user', JSON.stringify(newUser))
        }
      }
      set({
        token: newToken,
        user: newUser,
        isAuthenticated: !!newToken,
      })
    },
    logout: () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      set({
        token: null,
        user: null,
        isAuthenticated: false,
      })
    },
  }
}

export const useAuthStore = create<AuthStore>()(authStore)
