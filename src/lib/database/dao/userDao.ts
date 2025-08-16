import { eq, and } from 'drizzle-orm'
import { getDatabase } from '../connection'
import { users, type User, type NewUser } from '../schema'

export class UserDao {
  private db = getDatabase()

  // 创建用户
  async create(userData: NewUser): Promise<User> {
    const result = await this.db.insert(users).values(userData).returning()
    return result[0]
  }

  // 根据ID获取用户
  async findById(id: string): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1)
    return result[0] || null
  }

  // 根据邮箱获取用户
  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1)
    return result[0] || null
  }

  // 根据用户名获取用户
  async findByUsername(username: string): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1)
    return result[0] || null
  }

  // 根据登录标识符获取用户（邮箱、用户名或手机号）
  async findByIdentifier(identifier: string): Promise<User | null> {
    const result = await this.db.select().from(users).where(
      or(
        eq(users.email, identifier),
        eq(users.username, identifier),
        eq(users.phone, identifier)
      )
    ).limit(1)
    return result[0] || null
  }

  // 获取所有用户
  async findAll(): Promise<User[]> {
    return await this.db.select().from(users)
  }

  // 更新用户
  async update(id: string, userData: Partial<NewUser>): Promise<User | null> {
    const result = await this.db
      .update(users)
      .set({ ...userData, updatedAt: new Date().toISOString() })
      .where(eq(users.id, id))
      .returning()
    return result[0] || null
  }

  // 删除用户
  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(users).where(eq(users.id, id))
    return result.changes > 0
  }

  // 验证用户凭据
  async validateCredentials(identifier: string, passwordHash: string): Promise<User | null> {
    const result = await this.db.select().from(users).where(
      and(
        or(
          eq(users.email, identifier),
          eq(users.username, identifier),
          eq(users.phone, identifier)
        ),
        eq(users.passwordHash, passwordHash)
      )
    ).limit(1)
    return result[0] || null
  }

  // 检查邮箱是否存在
  async emailExists(email: string): Promise<boolean> {
    const result = await this.db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    return result.length > 0
  }

  // 检查用户名是否存在
  async usernameExists(username: string): Promise<boolean> {
    const result = await this.db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1)
    return result.length > 0
  }

  // 检查手机号是否存在
  async phoneExists(phone: string): Promise<boolean> {
    const result = await this.db.select({ id: users.id }).from(users).where(eq(users.phone, phone)).limit(1)
    return result.length > 0
  }
}

// 导入or函数
import { or } from 'drizzle-orm'

export const userDao = new UserDao()