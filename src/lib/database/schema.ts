import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// 用户表
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  avatar: text('avatar'),
  role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
  passwordHash: text('password_hash').notNull(),
  permissions: text('permissions', { mode: 'json' }).$type<{
    canUpload: boolean
    canDownload: boolean
    canView: boolean
    canDelete: boolean
    canManageUsers: boolean
  }>().notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
})

// 文件夹表
export const folders = sqliteTable('folders', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  parentId: text('parent_id'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: text('created_by').notNull().references(() => users.id),
  color: text('color'),
  metadata: text('metadata', { mode: 'json' })
})

// 文档表
export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  originalName: text('original_name').notNull(),
  size: integer('size').notNull(),
  type: text('type').notNull(),
  mimeType: text('mime_type').notNull(),
  folderId: text('folder_id').references(() => folders.id),
  uploadedBy: text('uploaded_by').notNull().references(() => users.id),
  filePath: text('file_path').notNull(), // 文件在服务器上的路径
  thumbnailPath: text('thumbnail_path'), // 缩略图路径
  fileData: blob('file_data'), // 小文件(<1MB)的二进制数据
  tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
  metadata: text('metadata', { mode: 'json' }).$type<{
    width?: number
    height?: number
    duration?: number
    pages?: number
    author?: string
    createdDate?: string
  }>().default({}),
  checksum: text('checksum').notNull(), // 文件校验和
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
})

// 用户活动表
export const userActivities = sqliteTable('user_activities', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  action: text('action').notNull(), // 'upload', 'download', 'delete', 'view', 'create_folder', etc.
  targetType: text('target_type', { enum: ['document', 'folder', 'user'] }).notNull(),
  targetId: text('target_id').notNull(),
  details: text('details', { mode: 'json' }).$type<Record<string, any>>().default({}),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
})

// 文件版本表（可选，用于版本控制）
export const documentVersions = sqliteTable('document_versions', {
  id: text('id').primaryKey(),
  documentId: text('document_id').notNull().references(() => documents.id),
  version: integer('version').notNull(),
  filePath: text('file_path').notNull(),
  size: integer('size').notNull(),
  checksum: text('checksum').notNull(),
  uploadedBy: text('uploaded_by').notNull().references(() => users.id),
  changeNote: text('change_note'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
})

// 系统配置表
export const systemConfig = sqliteTable('system_config', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).$type<any>().notNull(),
  description: text('description'),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
})

// 导出类型
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Folder = typeof folders.$inferSelect
export type NewFolder = typeof folders.$inferInsert
export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
export type UserActivity = typeof userActivities.$inferSelect
export type NewUserActivity = typeof userActivities.$inferInsert
export type DocumentVersion = typeof documentVersions.$inferSelect
export type NewDocumentVersion = typeof documentVersions.$inferInsert
export type SystemConfig = typeof systemConfig.$inferSelect
export type NewSystemConfig = typeof systemConfig.$inferInsert