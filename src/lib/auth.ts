// 本地认证系统
export interface User {
  id: string
  username: string
  email: string
  phone?: string
  avatar?: string
  role: 'admin' | 'user'
  permissions: {
    canUpload: boolean
    canDownload: boolean
    canView: boolean
    canDelete: boolean
    canManageUsers: boolean
  }
  createdAt: string
}

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

// 模拟用户数据存储（实际项目中应该使用数据库）
const USERS_KEY = 'document_system_users'
const CURRENT_USER_KEY = 'document_system_current_user'

class AuthService {
  // 初始化演示用户
  private initDemoUser(): void {
    // 直接从 localStorage 获取，避免调用 getUsers() 造成递归
    const users = localStorage.getItem(USERS_KEY)
    const userList = users ? JSON.parse(users) : []
    const demoUser = userList.find((u: any) => u.email === 'demo@example.com')
    
    if (!demoUser) {
      const demoUserData = {
        id: 'demo_user_001',
        username: '演示用户',
        email: 'demo@example.com',
        role: 'admin' as const,
        permissions: {
          canUpload: true,
          canDownload: true,
          canView: true,
          canDelete: true,
          canManageUsers: true
        },
        createdAt: new Date().toISOString(),
        password: '123456'
      }
      userList.push(demoUserData)
      this.saveUsers(userList)
    } else {
      // 确保现有演示用户有管理员权限
      const demoIndex = userList.findIndex((u: any) => u.email === 'demo@example.com')
      if (demoIndex !== -1) {
        userList[demoIndex] = {
          ...userList[demoIndex],
          role: 'admin',
          permissions: {
            canUpload: true,
            canDownload: true,
            canView: true,
            canDelete: true,
            canManageUsers: true
          }
        }
        this.saveUsers(userList)
      }
    }
  }

  // 获取所有用户
  private getUsers(): User[] {
    const users = localStorage.getItem(USERS_KEY)
    const userList = users ? JSON.parse(users) : []
    
    // 确保演示用户存在
    if (userList.length === 0) {
      this.initDemoUser()
      // 重新获取用户列表，避免递归调用
      const updatedUsers = localStorage.getItem(USERS_KEY)
      return updatedUsers ? JSON.parse(updatedUsers) : []
    }
    
    return userList
  }

  // 保存用户数据
  private saveUsers(users: User[]): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }

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

    // 检查用户是否已存在
    const users = this.getUsers()
    const existingUser = users.find(user => 
      user.email === email || 
      user.username === username || 
      user.phone === phone
    )
    
    if (existingUser) {
      return { success: false, message: '用户名、邮箱或手机号已存在' }
    }

    // 创建新用户，默认为普通用户权限
    const newUser: User = {
      id: this.generateUserId(),
      username,
      email,
      phone,
      role: 'user',
      permissions: {
        canUpload: true,
        canDownload: true,
        canView: true,
        canDelete: false,
        canManageUsers: false
      },
      createdAt: new Date().toISOString()
    }

    // 保存用户（实际项目中密码应该加密存储）
    const userWithPassword = { ...newUser, password }
    users.push(userWithPassword)
    this.saveUsers(users)

    return { success: true, message: '注册成功', user: newUser }
  }

  // 用户登录
  async login(credentials: LoginCredentials): Promise<{ success: boolean; message: string; user?: User }> {
    const { identifier, password } = credentials

    if (!identifier || !password) {
      return { success: false, message: '请输入登录信息和密码' }
    }

    const users = this.getUsers()
    const user = users.find(u => 
      (u.email === identifier || 
       u.username === identifier || 
       u.phone === identifier) && 
      (u as any).password === password
    )

    if (!user) {
      return { success: false, message: '登录信息或密码错误' }
    }

    // 保存当前登录用户
    const { password: _, ...userWithoutPassword } = user as any
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword))

    return { success: true, message: '登录成功', user: userWithoutPassword }
  }

  // 获取当前用户
  getCurrentUser(): User | null {
    const user = localStorage.getItem(CURRENT_USER_KEY)
    return user ? JSON.parse(user) : null
  }

  // 检查登录状态
  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null
  }

  // 退出登录
  logout(): void {
    localStorage.removeItem(CURRENT_USER_KEY)
  }

  // 更新用户信息
  async updateUser(userId: string, updates: Partial<User>): Promise<{ success: boolean; message: string; user?: User }> {
    const users = this.getUsers()
    const userIndex = users.findIndex(u => u.id === userId)

    if (userIndex === -1) {
      return { success: false, message: '用户不存在' }
    }

    // 更新用户信息
    const updatedUser = { ...users[userIndex], ...updates }
    users[userIndex] = updatedUser

    this.saveUsers(users)

    // 如果更新的是当前用户，同时更新当前用户信息
    const currentUser = this.getCurrentUser()
    if (currentUser && currentUser.id === userId) {
      const { password: _, ...userWithoutPassword } = updatedUser as any
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword))
    }

    const { password: _, ...userWithoutPassword } = updatedUser as any
    return { success: true, message: '更新成功', user: userWithoutPassword }
  }

  // 修改密码
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!this.isValidPassword(newPassword)) {
      return { success: false, message: '新密码长度至少为6位' }
    }

    const users = this.getUsers()
    const userIndex = users.findIndex(u => u.id === userId && (u as any).password === oldPassword)

    if (userIndex === -1) {
      return { success: false, message: '原密码错误' }
    }

    // 更新密码
    (users[userIndex] as any).password = newPassword
    this.saveUsers(users)

    return { success: true, message: '密码修改成功' }
  }

  // 权限管理相关方法
  
  // 获取所有用户（管理员专用）
  async getAllUsers(): Promise<{ success: boolean; message: string; users?: User[] }> {
    const currentUser = this.getCurrentUser()
    if (!currentUser || !currentUser.permissions.canManageUsers) {
      return { success: false, message: '权限不足' }
    }

    const users = this.getUsers()
    const usersWithoutPassword = users.map(({ password, ...user }: any) => user)
    return { success: true, message: '获取成功', users: usersWithoutPassword }
  }

  // 更新用户权限（管理员专用）
  async updateUserPermissions(targetUserId: string, permissions: Partial<User['permissions']>): Promise<{ success: boolean; message: string }> {
    const currentUser = this.getCurrentUser()
    if (!currentUser || !currentUser.permissions.canManageUsers) {
      return { success: false, message: '权限不足' }
    }

    const users = this.getUsers()
    const userIndex = users.findIndex(u => u.id === targetUserId)

    if (userIndex === -1) {
      return { success: false, message: '用户不存在' }
    }

    // 更新权限
    users[userIndex].permissions = { ...users[userIndex].permissions, ...permissions }
    this.saveUsers(users)

    return { success: true, message: '权限更新成功' }
  }

  // 更新用户角色（管理员专用）
  async updateUserRole(targetUserId: string, role: 'admin' | 'user'): Promise<{ success: boolean; message: string }> {
    const currentUser = this.getCurrentUser()
    if (!currentUser || !currentUser.permissions.canManageUsers) {
      return { success: false, message: '权限不足' }
    }

    const users = this.getUsers()
    const userIndex = users.findIndex(u => u.id === targetUserId)

    if (userIndex === -1) {
      return { success: false, message: '用户不存在' }
    }

    // 更新角色和对应权限
    users[userIndex].role = role
    if (role === 'admin') {
      users[userIndex].permissions = {
        canUpload: true,
        canDownload: true,
        canView: true,
        canDelete: true,
        canManageUsers: true
      }
    } else {
      users[userIndex].permissions = {
        canUpload: true,
        canDownload: true,
        canView: true,
        canDelete: false,
        canManageUsers: false
      }
    }

    this.saveUsers(users)
    return { success: true, message: '角色更新成功' }
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

    const users = this.getUsers()
    const filteredUsers = users.filter(u => u.id !== targetUserId)

    if (users.length === filteredUsers.length) {
      return { success: false, message: '用户不存在' }
    }

    this.saveUsers(filteredUsers)
    return { success: true, message: '用户删除成功' }
  }
}

export const authService = new AuthService()