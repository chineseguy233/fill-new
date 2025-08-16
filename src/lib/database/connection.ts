import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'
import { eq } from 'drizzle-orm'
import path from 'path'
import fs from 'fs'

// 数据库文件路径
const DB_PATH = path.join(process.cwd(), 'data', 'document-system.db')
const UPLOADS_PATH = process.platform === 'win32' ? 'D:\\DOC_STORAGE' : path.join(process.cwd(), 'uploads')

// 确保数据目录存在
const ensureDirectories = () => {
  const dataDir = path.dirname(DB_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  
  // 创建上传目录结构
  const uploadDirs = [
    UPLOADS_PATH,
    path.join(UPLOADS_PATH, 'documents'),
    path.join(UPLOADS_PATH, 'images'),
    path.join(UPLOADS_PATH, 'videos'),
    path.join(UPLOADS_PATH, 'audio'),
    path.join(UPLOADS_PATH, 'others'),
    path.join(UPLOADS_PATH, 'thumbnails')
  ]
  
  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
}

// 创建数据库连接
let db: ReturnType<typeof drizzle> | null = null

export const getDatabase = () => {
  if (!db) {
    ensureDirectories()
    
    const sqlite = new Database(DB_PATH)
    
    // 启用外键约束
    sqlite.pragma('foreign_keys = ON')
    
    // 设置WAL模式以提高并发性能
    sqlite.pragma('journal_mode = WAL')
    
    // 创建drizzle实例
    db = drizzle(sqlite, { schema })
    
    console.log('数据库连接已建立:', DB_PATH)
  }
  
  return db
}

// 运行数据库迁移
export const runMigrations = async () => {
  const database = getDatabase()
  const migrationsPath = path.join(process.cwd(), 'drizzle')
  
  try {
    if (fs.existsSync(migrationsPath)) {
      await migrate(database, { migrationsFolder: migrationsPath })
      console.log('数据库迁移完成')
    } else {
      console.log('未找到迁移文件，跳过迁移')
    }
  } catch (error) {
    console.error('数据库迁移失败:', error)
    throw error
  }
}

// 初始化数据库
export const initializeDatabase = async () => {
  try {
    const database = getDatabase()
    await runMigrations()
    
    // 创建默认管理员用户
    await createDefaultAdmin(database)
    
    // 创建默认系统配置
    await createDefaultConfig(database)
    
    console.log('数据库初始化完成')
  } catch (error) {
    console.error('数据库初始化失败:', error)
    throw error
  }
}

// 创建默认管理员用户
const createDefaultAdmin = async (database: ReturnType<typeof drizzle>) => {
  try {
    const existingAdmin = await database
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, 'admin@example.com'))
      .limit(1)
    
    if (existingAdmin.length === 0) {
      const adminUser: schema.NewUser = {
        id: 'admin_' + Date.now(),
        username: '系统管理员',
        email: 'admin@example.com',
        role: 'admin',
        passwordHash: await hashPassword('admin123'), // 实际项目中应该使用更安全的密码
        permissions: {
          canUpload: true,
          canDownload: true,
          canView: true,
          canDelete: true,
          canManageUsers: true
        }
      }
      
      await database.insert(schema.users).values(adminUser)
      console.log('默认管理员用户已创建')
    }
  } catch (error) {
    console.error('创建默认管理员失败:', error)
  }
}

// 创建默认系统配置
const createDefaultConfig = async (database: ReturnType<typeof drizzle>) => {
  try {
    const defaultConfigs: schema.NewSystemConfig[] = [
      {
        key: 'max_file_size',
        value: 100 * 1024 * 1024, // 100MB
        description: '最大文件上传大小（字节）'
      },
      {
        key: 'allowed_file_types',
        value: [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain', 'text/csv',
          'video/mp4', 'video/avi', 'video/mov',
          'audio/mp3', 'audio/wav', 'audio/aac'
        ],
        description: '允许上传的文件类型'
      },
      {
        key: 'storage_path',
        value: process.platform === 'win32' ? 'D:\\DOC_STORAGE' : UPLOADS_PATH,
        description: '文件存储路径'
      },
      {
        key: 'enable_thumbnails',
        value: true,
        description: '是否启用缩略图生成'
      },
      {
        key: 'enable_file_versioning',
        value: false,
        description: '是否启用文件版本控制'
      }
    ]
    
    for (const config of defaultConfigs) {
      const existing = await database
        .select()
        .from(schema.systemConfig)
        .where(eq(schema.systemConfig.key, config.key))
        .limit(1)
      
      if (existing.length === 0) {
        await database.insert(schema.systemConfig).values(config)
      }
    }
    
    console.log('默认系统配置已创建')
  } catch (error) {
    console.error('创建默认配置失败:', error)
  }
}

// 简单的密码哈希函数（实际项目中应使用bcrypt等）
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export { UPLOADS_PATH }
export default getDatabase