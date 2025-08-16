import { eq, and, isNull, ne, like, sql } from 'drizzle-orm'
import { getDatabase } from '../connection'
import { folders, type Folder, type NewFolder } from '../schema'

export class FolderDao {
  private db = getDatabase()

  // 创建文件夹
  async create(folderData: NewFolder): Promise<Folder> {
    const result = await this.db.insert(folders).values(folderData).returning()
    return result[0]
  }

  // 根据ID获取文件夹
  async findById(id: string): Promise<Folder | null> {
    const result = await this.db.select().from(folders).where(eq(folders.id, id)).limit(1)
    return result[0] || null
  }

  // 获取用户的所有文件夹
  async findByUserId(userId: string): Promise<Folder[]> {
    return await this.db.select().from(folders).where(eq(folders.createdBy, userId))
  }

  // 获取根文件夹（没有父文件夹的文件夹）
  async findRootFolders(userId: string): Promise<Folder[]> {
    return await this.db.select().from(folders).where(
      and(
        eq(folders.createdBy, userId),
        isNull(folders.parentId)
      )
    )
  }

  // 获取子文件夹
  async findSubFolders(parentId: string, userId: string): Promise<Folder[]> {
    return await this.db.select().from(folders).where(
      and(
        eq(folders.parentId, parentId),
        eq(folders.createdBy, userId)
      )
    )
  }

  // 获取所有文件夹
  async findAll(): Promise<Folder[]> {
    return await this.db.select().from(folders)
  }

  // 更新文件夹
  async update(id: string, folderData: Partial<NewFolder>): Promise<Folder | null> {
    const result = await this.db
      .update(folders)
      .set({ ...folderData, updatedAt: new Date().toISOString() })
      .where(eq(folders.id, id))
      .returning()
    return result[0] || null
  }

  // 删除文件夹
  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(folders).where(eq(folders.id, id))
    return result.changes > 0
  }

  // 检查文件夹名称是否在同一父目录下重复
  async nameExistsInParent(name: string, parentId: string | null, userId: string, excludeId?: string): Promise<boolean> {
    let whereConditions = [
      eq(folders.name, name),
      eq(folders.createdBy, userId),
      parentId ? eq(folders.parentId, parentId) : isNull(folders.parentId)
    ]

    if (excludeId) {
      whereConditions.push(ne(folders.id, excludeId))
    }

    const result = await this.db.select({ id: folders.id })
      .from(folders)
      .where(and(...whereConditions))
      .limit(1)
    
    return result.length > 0
  }

  // 获取文件夹路径（从根到当前文件夹）
  async getFolderPath(folderId: string): Promise<Folder[]> {
    const path: Folder[] = []
    let currentId: string | null = folderId

    while (currentId) {
      const folder = await this.findById(currentId)
      if (!folder) break
      
      path.unshift(folder)
      currentId = folder.parentId
    }

    return path
  }

  // 检查是否为循环引用（防止将文件夹移动到自己的子文件夹中）
  async wouldCreateCycle(folderId: string, newParentId: string): Promise<boolean> {
    let currentId: string | null = newParentId

    while (currentId) {
      if (currentId === folderId) {
        return true // 发现循环引用
      }

      const folder = await this.findById(currentId)
      if (!folder) break
      
      currentId = folder.parentId
    }

    return false
  }

  // 根据父ID查找文件夹（别名方法）
  async findByParentId(parentId: string): Promise<Folder[]> {
    return await this.db.select().from(folders).where(eq(folders.parentId, parentId))
  }

  // 搜索文件夹
  async search(query: string, userId?: string): Promise<Folder[]> {
    if (userId) {
      return await this.db.select().from(folders).where(
        and(
          like(folders.name, `%${query}%`),
          eq(folders.createdBy, userId)
        )
      )
    } else {
      return await this.db.select().from(folders).where(
        like(folders.name, `%${query}%`)
      )
    }
  }

  // 获取文件夹统计信息
  async getFolderStats(folderId: string): Promise<any> {
    // 统计子文件夹数量
    const subFolderCount = await this.db.select({ count: sql`count(*)` })
      .from(folders)
      .where(eq(folders.parentId, folderId))

    return {
      subFolders: subFolderCount[0]?.count || 0,
      documents: 0 // 需要从documentDao获取
    }
  }

  // 获取用户文件夹统计
  async getUserFolderStats(userId: string): Promise<any> {
    const totalFolders = await this.db.select({ count: sql`count(*)` })
      .from(folders)
      .where(eq(folders.createdBy, userId))

    const rootFolders = await this.db.select({ count: sql`count(*)` })
      .from(folders)
      .where(and(
        eq(folders.createdBy, userId),
        isNull(folders.parentId)
      ))

    return {
      totalFolders: totalFolders[0]?.count || 0,
      rootFolders: rootFolders[0]?.count || 0
    }
  }
}

export const folderDao = new FolderDao()
