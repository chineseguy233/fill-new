import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, login as apiLogin, register as apiRegister, logout as apiLogout, getCurrentUser, isAuthenticated } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (identifier: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (userData: any) => Promise<{ success: boolean; message: string }>
  logout: () => void
  updateUser: (updates: Partial<User>) => Promise<{ success: boolean; message: string }>
  hasPermission: (permission: keyof User['permissions']) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 检查用户登录状态
    const checkAuthStatus = () => {
      setIsLoading(true)
      try {
        const currentUser = getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('检查认证状态失败:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthStatus()

    // 监听localStorage变化，当用户信息更新时自动刷新
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser') {
        console.log('检测到用户信息变化，重新加载用户状态')
        checkAuthStatus()
      }
    }

    // 监听自定义的storage事件
    const handleCustomStorageChange = (e: Event) => {
      if (e instanceof StorageEvent && e.key === 'currentUser') {
        console.log('检测到用户信息变化，重新加载用户状态')
        checkAuthStatus()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('storage', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('storage', handleCustomStorageChange)
    }
  }, [])

  const login = async (identifier: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await apiLogin(identifier, password)
      if (result.success && result.user) {
        setUser(result.user)
      }
      return result
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, message: '登录过程中发生错误' }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: any) => {
    setIsLoading(true)
    try {
      const result = await apiRegister(userData)
      if (result.success && result.user) {
        setUser(result.user)
      }
      return result
    } catch (error) {
      console.error('注册失败:', error)
      return { success: false, message: '注册过程中发生错误' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    apiLogout()
    setUser(null)
  }

  const updateUser = async (updates: Partial<User>) => {
    if (!user) {
      return { success: false, message: '用户未登录' }
    }

    setIsLoading(true)
    try {
      // 这里需要调用后端API更新用户信息
      // 暂时使用localStorage更新
      const updatedUser = { ...user, ...updates }
      localStorage.setItem('currentUser', JSON.stringify(updatedUser))
      setUser(updatedUser)
      return { success: true, message: '更新成功' }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      return { success: false, message: '更新过程中发生错误' }
    } finally {
      setIsLoading(false)
    }
  }

  const hasPermission = (permission: keyof User['permissions']): boolean => {
    return user ? user.permissions[permission] : false
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    hasPermission
  }

  return (
    <AuthContext.Provider value={value}>
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