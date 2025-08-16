import { folderDao } from '../dao/folderDao'
import { documentDao } from '../dao/documentDao'
import { activityDao } from '../dao/activityDao'
import type { Folder, NewFolder } from '../schema'

export interface CreateFolderData {
  name: string
  description?: string
  parentId?: string
  color?: string
  metadata?: Record<string, any>
}

class DatabaseFolderService {
  // 生成文件夹ID
  private generateFolderId(): string {
    return 'folder_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // 创建文件夹
  async createFolder(folderData: CreateFolderData, userId: string, ipAddress?: string, userAgent?: string): Promise<{ success: boolean; message: string; folder?: Folder }> {
    try {
      const { name, description, parentId, color, metadata = {} } = folderData

      // 验证父文件夹是否存在（如果指定了parentId）
      if (parentId) {
        const parentFolder = await folderDao.findById(parentId)
        if (!parentFolder) {
          return { success: false, message: '父文件夹不存在' }
        }
        if (parentFolder.createdBy !== userId) {
          return { success: false, message: '无权限在该文件夹下创建子文件夹' }
        }
      }

      // 检查同级文件夹名称是否重复
      const nameExists = await folderDao.nameExistsInParent(name, parentId || null, userId)
      if (nameExists) {
        return { success: false, message: '文件夹名称已存在' }
      }

      // 创建文件夹数据
      const newFolderData: NewFolder = {
        id: this.generateFolderId(),
        name,
        description,
        parentId: parentId || null,
        createdBy: userId,
        color,
        metadata
      }

      const folder = await folderDao.create(newFolderData)

      // 记录创建活动
      await activityDao.logCreate(userId, 'folder', folder.id, folder.name, ipAddress, userAgent)

      return { success: true, message: '文件夹创建成功', folder }

    } catch (error) {
      console.error('创建文件夹失败:', error)
      return { success: false, message: '创建文件夹失败，请稍后重试' }
    }
  }

  // 获取用户的根文件夹
  async getRootFolders(userId: string): Promise<{ success: boolean; folders: Folder[] }> {
    try {
      const folders = await folderDao.findRootFolders(userId)
      return { success: true, folders }
    } catch (error) {
      console.error('获取根文件夹失败:', error)
      return { success: false, folders: [] }
    }
  }

  // 获取子文件夹
  async getSubFolders(parentId: string, userId: string): Promise<{ success: boolean; folders: Folder[] }> {
    try {
      // 验证父文件夹权限
      const parentFolder = await folderDao.findById(parentId)
      if (!parentFolder || parentFolder.createdBy !== userId) {
        return { success: false, folders: [] }
      }

      const folders = await folderDao.findByParentId(parentId)
      return { success: true, folders }
    } catch (error) {
      console.error('获取子文件夹失败:', error)
      return { success: false, folders: [] }
    }
  }

  // 获取用户所有文件夹
  async getUserFolders(userId: string): Promise<{ success: boolean; folders: Folder[] }> {
    try {
      const folders = await folderDao.findByUserId(userId)
      return { success: true, folders }
    } catch (error) {
      console.error('获取用户文件夹失败:', error)
      return { success: false, folders: [] }
    }
  }

  // 获取文件夹详情（包含子文件夹和文档）
  async getFolderDetails(folderId: string, userId: string): Promise<{ success: boolean; folder?: Folder; subFolders: Folder[]; documents: any[] }> {
    try {
      const folder = await folderDao.findById(folderId)
      if (!folder || folder.createdBy !== userId) {
        return { success: false, subFolders: [], documents: [] }
      }

      const subFolders = await folderDao.findByParentId(folderId)
      const documents = await documentDao.findByFolderId(folderId)

      return { success: true, folder, subFolders, documents }
    } catch (error) {
      console.error('获取文件夹详情失败:', error)
      return { success: false, subFolders: [], documents: [] }
    }
  }

  // 搜索文件夹
  async searchFolders(query: string, userId?: string): Promise<{ success: boolean; folders: Folder[] }> {
    try {
      const folders = await folderDao.search(query, userId)
      return { success: true, folders }
    } catch (error) {
      console.error('搜索文件夹失败:', error)
      return { success: false, folders: [] }
    }
  }

  // 更新文件夹
  async updateFolder(folderId: string, updates: { name?: string; description?: string; color?: string; metadata?: Record<string, any> }, userId: string): Promise<{ success: boolean; message: string; folder?: Folder }> {
    try {
      const folder = await folderDao.findById(folderId)
      if (!folder) {
        return { success: false, message: '文件夹不存在' }
      }

      // 检查权限
      if (folder.createdBy !== userId) {
        return { success: false, message: '无权限修改该文件夹' }
      }

      // 如果更新名称，检查是否重复
      if (updates.name && updates.name !== folder.name) {
        const nameExists = await folderDao.nameExistsInParent(updates.name, folder.parentId, userId, folderId)
        if (nameExists) {
          return { success: false, message: '文件夹名称已存在' }
        }
      }

      const updatedFolder = await folderDao.update(folderId, updates)
      if (!updatedFolder) {
        return { success: false, message: '更新失败' }
      }

      return { success: true, message: '文件夹更新成功', folder: updatedFolder }

    } catch (error) {
      console.error('更新文件夹失败:', error)
      return { success: false, message: '更新失败，请稍后重试' }
    }
  }

  // 移动文件夹
  async moveFolder(folderId: string, targetParentId: string | null, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const folder = await folderDao.findById(folderId)
      if (!folder) {
        return { success: false, message: '文件夹不存在' }
      }

      // 检查权限
      if (folder.createdBy !== userId) {
        return { success: false, message: '无权限移动该文件夹' }
      }

      // 验证目标父文件夹
      if (targetParentId) {
        const targetParent = await folderDao.findById(targetParentId)
        if (!targetParent || targetParent.createdBy !== userId) {
          return { success: false, message: '目标文件夹不存在或无权限' }
        }

        // 检查是否会形成循环引用
        if (await this.wouldCreateCycle(folderId, targetParentId)) {
          return { success: false, message: '不能将文件夹移动到其子文件夹中' }
        }
      }

      // 检查目标位置是否有同名文件夹
      const nameExists = await folderDao.nameExistsInParent(folder.name, targetParentId, userId, folderId)
      if (nameExists) {
        return { success: false, message: '目标位置已存在同名文件夹' }
      }

      // 更新文件夹的父ID
      await folderDao.update(folderId, { parentId: targetParentId })

      return { success: true, message: '文件夹移动成功' }

    } catch (error) {
      console.error('移动文件夹失败:', error)
      return { success: false, message: '移动失败，请稍后重试' }
    }
  }

  // 检查是否会形成循环引用
  private async wouldCreateCycle(folderId: string, targetParentId: string): Promise<boolean> {
    let currentId: string | null = targetParentId
    while (currentId) {
      if (currentId === folderId) {
        return true
      }
      const folder = await folderDao.findById(currentId)
      currentId = folder?.parentId ?? null
    }
    return false
  }

  // 删除文件夹（递归删除子文件夹和文档）
  async deleteFolder(folderId: string, userId: string, ipAddress?: string, userAgent?: string): Promise<{ success: boolean; message: string; deletedCount?: { folders: number; documents: number } }> {
    try {
      const folder = await folderDao.findById(folderId)
      if (!folder) {
        return { success: false, message: '文件夹不存在' }
      }

      // 检查权限
      if (folder.createdBy !== userId) {
        return { success: false, message: '无权限删除该文件夹' }
      }

      // 递归删除所有子内容
      const deletedCount = await this.recursiveDelete(folderId, userId)

      // 记录删除活动
      await activityDao.logDelete(userId, 'folder', folderId, folder.name, ipAddress, userAgent)

      return { 
        success: true, 
        message: `文件夹删除成功，共删除 ${deletedCount.folders} 个文件夹和 ${deletedCount.documents} 个文档`,
        deletedCount
      }

    } catch (error) {
      console.error('删除文件夹失败:', error)
      return { success: false, message: '删除失败，请稍后重试' }
    }
  }

  // 递归删除文件夹及其内容
  private async recursiveDelete(folderId: string, userId: string): Promise<{ folders: number; documents: number }> {
    let deletedFolders = 0
    let deletedDocuments = 0

    // 获取子文件夹
    const subFolders = await folderDao.findByParentId(folderId)
    for (const subFolder of subFolders) {
      const subResult = await this.recursiveDelete(subFolder.id, userId)
      deletedFolders += subResult.folders
      deletedDocuments += subResult.documents
    }

    // 删除文件夹中的文档
    const documents = await documentDao.findByFolderId(folderId)
    for (const document of documents) {
      await documentDao.delete(document.id)
      deletedDocuments++
    }

    // 删除文件夹本身
    await folderDao.delete(folderId)
    deletedFolders++

    return { folders: deletedFolders, documents: deletedDocuments }
  }

  // 获取文件夹路径（面包屑导航）
  async getFolderPath(folderId: string, userId: string): Promise<{ success: boolean; path: Folder[] }> {
    try {
      const path: Folder[] = []
      let currentId: string | null = folderId

      while (currentId) {
        const folder = await folderDao.findById(currentId)
        if (!folder || folder.createdBy !== userId) {
          break
        }
        path.unshift(folder)
        currentId = folder.parentId || null
      }

      return { success: true, path }
    } catch (error) {
      console.error('获取文件夹路径失败:', error)
      return { success: false, path: [] }
    }
  }

  // 获取文件夹统计信息
  async getFolderStats(folderId: string, userId: string): Promise<{ success: boolean; stats?: any }> {
    try {
      const folder = await folderDao.findById(folderId)
      if (!folder || folder.createdBy !== userId) {
        return { success: false }
      }

      const stats = await folderDao.getFolderStats(folderId)
      return { success: true, stats }
    } catch (error) {
      console.error('获取文件夹统计失败:', error)
      return { success: false }
    }
  }

  // 获取用户文件夹统计
  async getUserFolderStats(userId: string): Promise<{ success: boolean; stats?: any }> {
    try {
      const stats = await folderDao.getUserFolderStats(userId)
      return { success: true, stats }
    } catch (error) {
      console.error('获取用户文件夹统计失败:', error)
      return { success: false }
    }
  }

  // 从localStorage迁移文件夹数据
  async migrateFromLocalStorage(userId: string): Promise<{ success: boolean; message: string; migrated: number }> {
    try {
      let migratedCount = 0

      // 迁移文件夹数据
      const localFolders = localStorage.getItem('folders')
      if (localFolders) {
        const folders = JSON.parse(localFolders)
        
        // 按层级排序，先创建父文件夹
        const sortedFolders = this.sortFoldersByHierarchy(folders)
        
        for (const localFolder of sortedFolders) {
          // 检查文件夹是否已存在
          const existingFolder = await folderDao.findById(localFolder.id)
          if (!existingFolder) {
            const newFolder: NewFolder = {
              id: localFolder.id || this.generateFolderId(),
              name: localFolder.name,
              description: localFolder.description,
              parentId: localFolder.parentId || null,
              createdBy: userId,
              color: localFolder.color,
              metadata: localFolder.metadata || {}
            }
            await folderDao.create(newFolder)
            migratedCount++
          }
        }
      }

      return { success: true, message: `成功迁移 ${migratedCount} 个文件夹`, migrated: migratedCount }

    } catch (error) {
      console.error('文件夹数据迁移失败:', error)
      return { success: false, message: '文件夹数据迁移失败', migrated: 0 }
    }
  }

  // 按层级排序文件夹（父文件夹在前）
  private sortFoldersByHierarchy(folders: any[]): any[] {
    const folderMap = new Map(folders.map(f => [f.id, f]))
    const sorted: any[] = []
    const visited = new Set<string>()

    const addFolder = (folder: any) => {
      if (visited.has(folder.id)) return
      
      // 先添加父文件夹
      if (folder.parentId && folderMap.has(folder.parentId)) {
        addFolder(folderMap.get(folder.parentId))
      }
      
      if (!visited.has(folder.id)) {
        sorted.push(folder)
        visited.add(folder.id)
      }
    }

    folders.forEach(folder => addFolder(folder))
    return sorted
  }

  // 复制文件夹
  async copyFolder(folderId: string, targetParentId: string | null, userId: string, newName?: string): Promise<{ success: boolean; message: string; folder?: Folder }> {
    try {
      const sourceFolder = await folderDao.findById(folderId)
      if (!sourceFolder || sourceFolder.createdBy !== userId) {
        return { success: false, message: '源文件夹不存在或无权限' }
      }

      // 验证目标父文件夹
      if (targetParentId) {
        const targetParent = await folderDao.findById(targetParentId)
        if (!targetParent || targetParent.createdBy !== userId) {
          return { success: false, message: '目标文件夹不存在或无权限' }
        }
      }

      const copyName = newName || `${sourceFolder.name} - 副本`

      // 检查目标位置是否有同名文件夹
      const nameExists = await folderDao.nameExistsInParent(copyName, targetParentId, userId)
      if (nameExists) {
        return { success: false, message: '目标位置已存在同名文件夹' }
      }

      // 创建文件夹副本
      const newFolderData: NewFolder = {
        id: this.generateFolderId(),
        name: copyName,
        description: sourceFolder.description,
        parentId: targetParentId,
        createdBy: userId,
        color: sourceFolder.color,
        metadata: { ...(sourceFolder.metadata || {}), copiedFrom: sourceFolder.id }
      }

      const newFolder = await folderDao.create(newFolderData)

      // TODO: 递归复制子文件夹和文档

      return { success: true, message: '文件夹复制成功', folder: newFolder }

    } catch (error) {
      console.error('复制文件夹失败:', error)
      return { success: false, message: '复制失败，请稍后重试' }
    }
  }
}

export const databaseFolderService = new DatabaseFolderService()