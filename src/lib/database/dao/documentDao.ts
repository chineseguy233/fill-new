import { eq, and, like, desc, isNull, ne, or, sql } from 'drizzle-orm'
import { getDatabase } from '../connection'
import { documents, type Document, type NewDocument } from '../schema'

export class DocumentDao {
  private db = getDatabase()

  // 创建文档
  async create(documentData: NewDocument): Promise<Document> {
    const result = await this.db.insert(documents).values(documentData).returning()
    return result[0]
  }

  // 根据ID获取文档
  async findById(id: string): Promise<Document | null> {
    const result = await this.db.select().from(documents).where(eq(documents.id, id)).limit(1)
    return result[0] || null
  }

  // 获取用户的所有文档
  async findByUserId(userId: string): Promise<Document[]> {
    return await this.db.select().from(documents).where(eq(documents.uploadedBy, userId))
  }

  // 获取文件夹中的文档
  async findByFolderId(folderId: string): Promise<Document[]> {
    return await this.db.select().from(documents).where(eq(documents.folderId, folderId))
  }

  // 获取根目录文档（没有文件夹的文档）
  async findRootDocuments(userId: string): Promise<Document[]> {
    return await this.db.select().from(documents).where(
      and(
        eq(documents.uploadedBy, userId),
        isNull(documents.folderId)
      )
    )
  }

  // 搜索文档
  async search(query: string, userId?: string): Promise<Document[]> {
    let whereClause = or(
      like(documents.name, `%${query}%`),
      like(documents.originalName, `%${query}%`)
    )
    
    if (userId) {
      whereClause = and(whereClause, eq(documents.uploadedBy, userId))
    }
    
    return await this.db.select().from(documents).where(whereClause)
  }

  // 根据校验和查找文档
  async findByChecksum(checksum: string): Promise<Document[]> {
    return await this.db.select().from(documents).where(eq(documents.checksum, checksum))
  }

  // 获取用户存储统计
  async getUserStorageStats(userId: string): Promise<{
    totalDocuments: number
    totalSize: number
    typeStats: { type: string; count: number; size: number }[]
  }> {
    const userDocs = await this.db.select().from(documents).where(eq(documents.uploadedBy, userId))
    
    const totalDocuments = userDocs.length
    const totalSize = userDocs.reduce((sum, doc) => sum + doc.size, 0)
    
    // 按类型统计
    const typeMap = new Map<string, { count: number; size: number }>()
    userDocs.forEach(doc => {
      const existing = typeMap.get(doc.type) || { count: 0, size: 0 }
      typeMap.set(doc.type, {
        count: existing.count + 1,
        size: existing.size + doc.size
      })
    })
    
    const typeStats = Array.from(typeMap.entries()).map(([type, stats]) => ({
      type,
      count: stats.count,
      size: stats.size
    }))
    
    return { totalDocuments, totalSize, typeStats }
  }

  // 获取系统存储统计
  async getSystemStorageStats(): Promise<{
    totalDocuments: number
    totalSize: number
    totalUsers: number
    typeStats: { type: string; count: number; size: number }[]
  }> {
    const allDocs = await this.db.select().from(documents)
    
    const totalDocuments = allDocs.length
    const totalSize = allDocs.reduce((sum, doc) => sum + doc.size, 0)
    const totalUsers = new Set(allDocs.map(doc => doc.uploadedBy)).size
    
    // 按类型统计
    const typeMap = new Map<string, { count: number; size: number }>()
    allDocs.forEach(doc => {
      const existing = typeMap.get(doc.type) || { count: 0, size: 0 }
      typeMap.set(doc.type, {
        count: existing.count + 1,
        size: existing.size + doc.size
      })
    })
    
    const typeStats = Array.from(typeMap.entries()).map(([type, stats]) => ({
      type,
      count: stats.count,
      size: stats.size
    }))
    
    return { totalDocuments, totalSize, totalUsers, typeStats }
  }

  // 更新文档
  async update(id: string, documentData: Partial<NewDocument>): Promise<Document | null> {
    const result = await this.db
      .update(documents)
      .set({ ...documentData, updatedAt: new Date().toISOString() })
      .where(eq(documents.id, id))
      .returning()
    return result[0] || null
  }

  // 删除文档
  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(documents).where(eq(documents.id, id))
    return result.changes > 0
  }

  // 检查文档名称是否在同一文件夹下重复
  async nameExistsInFolder(name: string, folderId: string | null, userId: string, excludeId?: string): Promise<boolean> {
    let whereClause = and(
      eq(documents.name, name),
      eq(documents.uploadedBy, userId),
      folderId ? eq(documents.folderId, folderId) : isNull(documents.folderId)
    )
    
    if (excludeId) {
      whereClause = and(whereClause, ne(documents.id, excludeId))
    }
    
    const result = await this.db.select({ id: documents.id }).from(documents).where(whereClause).limit(1)
    return result.length > 0
  }

  // 获取最近上传的文档
  async findRecentDocuments(userId?: string, limit: number = 10): Promise<Document[]> {
    if (userId) {
      return await this.db.select().from(documents)
        .where(eq(documents.uploadedBy, userId))
        .orderBy(desc(documents.createdAt))
        .limit(limit)
    } else {
      return await this.db.select().from(documents)
        .orderBy(desc(documents.createdAt))
        .limit(limit)
    }
  }

  // 按文件类型获取文档
  async findByType(type: string, userId?: string): Promise<Document[]> {
    if (userId) {
      return await this.db.select().from(documents).where(
        and(eq(documents.type, type), eq(documents.uploadedBy, userId))
      )
    } else {
      return await this.db.select().from(documents).where(eq(documents.type, type))
    }
  }

  // 获取大文件列表
  async findLargeFiles(minSize: number = 10 * 1024 * 1024, userId?: string): Promise<Document[]> {
    if (userId) {
      return await this.db.select().from(documents).where(
        and(sql`${documents.size} >= ${minSize}`, eq(documents.uploadedBy, userId))
      ).orderBy(desc(documents.size))
    } else {
      return await this.db.select().from(documents).where(
        sql`${documents.size} >= ${minSize}`
      ).orderBy(desc(documents.size))
    }
  }

  // 获取重复文件
  async findDuplicateFiles(userId?: string): Promise<Document[][]> {
    let allDocs: Document[]
    
    if (userId) {
      allDocs = await this.db.select().from(documents).where(eq(documents.uploadedBy, userId))
    } else {
      allDocs = await this.db.select().from(documents)
    }
    
    // 按校验和分组
    const checksumMap = new Map<string, Document[]>()
    allDocs.forEach(doc => {
      if (!checksumMap.has(doc.checksum)) {
        checksumMap.set(doc.checksum, [])
      }
      checksumMap.get(doc.checksum)!.push(doc)
    })
    
    // 只返回有重复的组
    return Array.from(checksumMap.values()).filter(group => group.length > 1)
  }

  // 清理孤立文档（文件夹被删除但文档还在）
  async findOrphanedDocuments(): Promise<Document[]> {
    // 这里需要联表查询，暂时返回空数组
    // 实际实现需要 LEFT JOIN folders 来找到 folderId 不为 null 但对应文件夹不存在的文档
    return []
  }

  // 批量删除文档
  async batchDelete(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0
    
    const result = await this.db.delete(documents).where(
      sql`${documents.id} IN (${ids.map(id => `'${id}'`).join(',')})`
    )
    
    return result.changes
  }

  // 批量更新文档
  async batchUpdate(updates: { id: string; data: Partial<NewDocument> }[]): Promise<number> {
    let updatedCount = 0
    
    for (const update of updates) {
      const result = await this.update(update.id, update.data)
      if (result) updatedCount++
    }
    
    return updatedCount
  }
}

export const documentDao = new DocumentDao()