import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService, User, LoginCredentials, RegisterCredentials } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string }>
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; message: string }>
  logout: () => void
  updateUser: (updates: Partial<User>) => Promise<{ success: boolean; message: string }>
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthState()
  }, [])

  const checkAuthState = () => {
    try {
      setLoading(true)
      const currentUser = authService.getCurrentUser()
      const loginState = authService.isLoggedIn()
      
      setUser(currentUser)
      setIsLoggedIn(loginState)
    } catch (error) {
      console.error('检查认证状态失败:', error)
      setIsLoggedIn(false)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      const result = await authService.login(credentials)
      if (result.success && result.user) {
        setUser(result.user)
        setIsLoggedIn(true)
      }
      return result
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, message: '登录过程中发生错误' }
    }
  }

  const register = async (credentials: RegisterCredentials) => {
    try {
      const result = await authService.register(credentials)
      if (result.success && result.user) {
        setUser(result.user)
        setIsLoggedIn(true)
      }
      return result
    } catch (error) {
      console.error('注册失败:', error)
      return { success: false, message: '注册过程中发生错误' }
    }
  }

  const logout = () => {
    try {
      authService.logout()
      setUser(null)
      setIsLoggedIn(false)
    } catch (error) {
      console.error('退出登录失败:', error)
    }
  }

  const updateUser = async (updates: Partial<User>) => {
    if (!user) {
      return { success: false, message: '用户未登录' }
    }

    try {
      const result = await authService.updateUser(user.id, updates)
      if (result.success && result.user) {
        setUser(result.user)
      }
      return result
    } catch (error) {
      console.error('更新用户信息失败:', error)
      return { success: false, message: '更新过程中发生错误' }
    }
  }

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!user) {
      return { success: false, message: '用户未登录' }
    }

    try {
      return await authService.changePassword(user.id, oldPassword, newPassword)
    } catch (error) {
      console.error('修改密码失败:', error)
      return { success: false, message: '修改密码过程中发生错误' }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn,
      login,
      register,
      logout,
      updateUser,
      changePassword,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}