import { userDao } from '../dao/userDao'
import { activityDao } from '../dao/activityDao'
import type { User, NewUser } from '../schema'

export interface LoginCredentials {
  identifier: string // 可以是邮箱、用户名或手机号
  password: string
}

export interface RegisterCredentials {
  username: string
  email: string
  password: string
  confirmPassword: string
  phone: string
}

class DatabaseAuthService {
  // 生成用户ID
  private generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // 验证邮箱格式
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 验证密码强度
  private isValidPassword(password: string): boolean {
    return password.length >= 6
  }

  // 验证手机号格式
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(phone)
  }

  // 密码哈希函数
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // 用户注册
  async register(credentials: RegisterCredentials): Promise<{ success: boolean; message: string; user?: User }> {
    const { username, email, password, confirmPassword, phone } = credentials

    // 验证输入
    if (!username || !email || !password || !phone) {
      return { success: false, message: '请填写所有必填字段' }
    }

    if (!this.isValidEmail(email)) {
      return { success: false, message: '请输入有效的邮箱地址' }
    }

    if (!this.isValidPhone(phone)) {
      return { success: false, message: '请输入有效的手机号码' }
    }

    if (!this.isValidPassword(password)) {
      return { success: false, message: '密码长度至少为6位' }
    }

    if (password !== confirmPassword) {
      return { success: false, message: '两次输入的密码不一致' }
    }

    try {
      // 检查用户是否已存在
      if (await userDao.emailExists(email)) {
        return { success: false, message: '邮箱已存在' }
      }

      if (await userDao.usernameExists(username)) {
        return { success: false, message: '用户名已存在' }
      }

      if (await userDao.phoneExists(phone)) {
        return { success: false, message: '手机号已存在' }
      }

      // 创建新用户
      const passwordHash = await this.hashPassword(password)
      const newUser: NewUser = {
        id: this.generateUserId(),
        username,
        email,
        phone,
        role: 'user',
        passwordHash,
        permissions: {
          canUpload: true,
          canDownload: true,
          canView: true,
          canDelete: false,
          canManageUsers: false
        }
      }

      const user = await userDao.create(newUser)
      
      // 记录注册活动
      await activityDao.create({
        id: 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        userId: user.id,
        action: 'register',
        targetType: 'user',
        targetId: user.id,
        details: { username, email }
      })

      // 返回用户信息（不包含密码哈希）
      const { passwordHash: _, ...userWithoutPassword } = user
      return { success: true, message: '注册成功', user: userWithoutPassword as User }

    } catch (error) {
      console.error('注册失败:', error)
      return { success: false, message: '注册失败，请稍后重试' }
    }
  }

  // 用户登录
  async login(credentials: LoginCredentials, ipAddress?: string, userAgent?: string): Promise<{ success: boolean; message: string; user?: User }> {
    const { identifier, password } = credentials

    if (!identifier || !password) {
      return { success: false, message: '请输入登录信息和密码' }
    }

    try {
      const passwordHash = await this.hashPassword(password)
      const user = await userDao.validateCredentials(identifier, passwordHash)

      if (!user) {
        return { success: false, message: '登录信息或密码错误' }
      }

      // 记录登录活动
      await activityDao.logLogin(user.id, ipAddress, userAgent)

      // 保存当前登录用户到localStorage（保持兼容性）
      const { passwordHash: _, ...userWithoutPassword } = user
      localStorage.setItem('document_system_current_user', JSON.stringify(userWithoutPassword))

      return { success: true, message: '登录成功', user: userWithoutPassword as User }

    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, message: '登录失败，请稍后重试' }
    }
  }

  // 获取当前用户
  getCurrentUser(): User | null {
    try {
      const user = localStorage.getItem('document_system_current_user')
      return user ? JSON.parse(user) : null
    } catch (error) {
      console.error('获取当前用户失败:', error)
      return null
    }
  }

  // 检查登录状态
  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null
  }

  // 退出登录
  logout(): void {
    localStorage.removeItem('document_system_current_user')
  }

  // 更新用户信息
  async updateUser(userId: string, updates: Partial<User>): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const updatedUser = await userDao.update(userId, updates)

      if (!updatedUser) {
        return { success: false, message: '用户不存在' }
      }

      // 如果更新的是当前用户，同时更新localStorage
      const currentUser = this.getCurrentUser()
      if (currentUser && currentUser.id === userId) {
        const { passwordHash: _, ...userWithoutPassword } = updatedUser
        localStorage.setItem('document_system_current_user', JSON.stringify(userWithoutPassword))
      }

      const { passwordHash: _, ...userWithoutPassword } = updatedUser
      return { success: true, message: '更新成功', user: userWithoutPassword as User }

    } catch (error) {
      console.error('更新用户失败:', error)
      return { success: false, message: '更新失败，请稍后重试' }
    }
  }

  // 修改密码
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!this.isValidPassword(newPassword)) {
      return { success: false, message: '新密码长度至少为6位' }
    }

    try {
      const oldPasswordHash = await this.hashPassword(oldPassword)
      const user = await userDao.findById(userId)

      if (!user || user.passwordHash !== oldPasswordHash) {
        return { success: false, message: '原密码错误' }
      }

      const newPasswordHash = await this.hashPassword(newPassword)
      await userDao.update(userId, { passwordHash: newPasswordHash })

      return { success: true, message: '密码修改成功' }

    } catch (error) {
      console.error('修改密码失败:', error)
      return { success: false, message: '修改密码失败，请稍后重试' }
    }
  }

  // 权限管理相关方法

  // 获取所有用户（管理员专用）
  async getAllUsers(): Promise<{ success: boolean; message: string; users?: User[] }> {
    const currentUser = this.getCurrentUser()
    if (!currentUser || !currentUser.permissions.canManageUsers) {
      return { success: false, message: '权限不足' }
    }

    try {
      const users = await userDao.findAll()
      const usersWithoutPassword = users.map(({ passwordHash, ...user }) => user as User)
      return { success: true, message: '获取成功', users: usersWithoutPassword }

    } catch (error) {
      console.error('获取用户列表失败:', error)
      return { success: false, message: '获取用户列表失败' }
    }
  }

  // 更新用户权限（管理员专用）
  async updateUserPermissions(targetUserId: string, permissions: Partial<User['permissions']>): Promise<{ success: boolean; message: string }> {
    const currentUser = this.getCurrentUser()
    if (!currentUser || !currentUser.permissions.canManageUsers) {
      return { success: false, message: '权限不足' }
    }

    try {
      const targetUser = await userDao.findById(targetUserId)
      if (!targetUser) {
        return { success: false, message: '用户不存在' }
      }

      const updatedPermissions = { ...targetUser.permissions, ...permissions }
      await userDao.update(targetUserId, { permissions: updatedPermissions })

      return { success: true, message: '权限更新成功' }

    } catch (error) {
      console.error('更新权限失败:', error)
      return { success: false, message: '更新权限失败' }
    }
  }

  // 更新用户角色（管理员专用）
  async updateUserRole(targetUserId: string, role: 'admin' | 'user'): Promise<{ success: boolean; message: string }> {
    const currentUser = this.getCurrentUser()
    if (!currentUser || !currentUser.permissions.canManageUsers) {
      return { success: false, message: '权限不足' }
    }

    try {
      const permissions = role === 'admin' ? {
        canUpload: true,
        canDownload: true,
        canView: true,
        canDelete: true,
        canManageUsers: true
      } : {
        canUpload: true,
        canDownload: true,
        canView: true,
        canDelete: false,
        canManageUsers: false
      }

      await userDao.update(targetUserId, { role, permissions })
      return { success: true, message: '角色更新成功' }

    } catch (error) {
      console.error('更新角色失败:', error)
      return { success: false, message: '更新角色失败' }
    }
  }

  // 检查用户权限
  hasPermission(permission: keyof User['permissions']): boolean {
    const currentUser = this.getCurrentUser()
    return currentUser ? currentUser.permissions[permission] : false
  }

  // 删除用户（管理员专用）
  async deleteUser(targetUserId: string): Promise<{ success: boolean; message: string }> {
    const currentUser = this.getCurrentUser()
    if (!currentUser || !currentUser.permissions.canManageUsers) {
      return { success: false, message: '权限不足' }
    }

    if (currentUser.id === targetUserId) {
      return { success: false, message: '不能删除自己的账号' }
    }

    try {
      const success = await userDao.delete(targetUserId)
      if (!success) {
        return { success: false, message: '用户不存在' }
      }

      return { success: true, message: '用户删除成功' }

    } catch (error) {
      console.error('删除用户失败:', error)
      return { success: false, message: '删除用户失败' }
    }
  }

  // 从localStorage迁移数据到数据库
  async migrateFromLocalStorage(): Promise<{ success: boolean; message: string; migrated: number }> {
    try {
      let migratedCount = 0

      // 迁移用户数据
      const localUsers = localStorage.getItem('document_system_users')
      if (localUsers) {
        const users = JSON.parse(localUsers)
        for (const localUser of users) {
          // 检查用户是否已存在
          const existingUser = await userDao.findByEmail(localUser.email)
          if (!existingUser) {
            const newUser: NewUser = {
              id: localUser.id || this.generateUserId(),
              username: localUser.username,
              email: localUser.email,
              phone: localUser.phone,
              avatar: localUser.avatar,
              role: localUser.role || 'user',
              passwordHash: localUser.password ? await this.hashPassword(localUser.password) : localUser.passwordHash,
              permissions: localUser.permissions || {
                canUpload: true,
                canDownload: true,
                canView: true,
                canDelete: false,
                canManageUsers: false
              }
            }
            await userDao.create(newUser)
            migratedCount++
          }
        }
      }

      return { success: true, message: `成功迁移 ${migratedCount} 个用户`, migrated: migratedCount }

    } catch (error) {
      console.error('数据迁移失败:', error)
      return { success: false, message: '数据迁移失败', migrated: 0 }
    }
  }

  // 清理localStorage数据（迁移完成后）
  cleanupLocalStorage(): void {
    localStorage.removeItem('document_system_users')
    // 保留当前用户信息以维持登录状态
  }
}

export const databaseAuthService = new DatabaseAuthService()
