import { documentDao } from '../dao/documentDao'
import { folderDao } from '../dao/folderDao'
import { activityDao } from '../dao/activityDao'
import type { Document, NewDocument } from '../schema'
import path from 'path'
import fs from 'fs'
import { UPLOADS_PATH } from '../connection'

export interface UploadDocumentData {
  name: string
  originalName: string
  file: File
  folderId?: string
  tags?: string[]
  metadata?: Record<string, any>
}

class DatabaseDocumentService {
  // 生成文档ID
  private generateDocumentId(): string {
    return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // 计算文件校验和
  private async calculateChecksum(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // 获取文件存储路径
  private getStoragePath(file: File): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    
    const typeFolder = this.getTypeFolder(file.type)
    const fileName = `${Date.now()}_${file.name}`
    
    return path.join(UPLOADS_PATH, typeFolder, String(year), month, fileName)
  }

  // 根据MIME类型获取存储文件夹
  private getTypeFolder(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'images'
    if (mimeType.startsWith('video/')) return 'videos'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.includes('pdf')) return 'documents'
    if (mimeType.includes('word') || mimeType.includes('excel') || mimeType.includes('powerpoint')) return 'documents'
    return 'others'
  }

  // 确保目录存在
  private ensureDirectoryExists(filePath: string): void {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  // 保存文件到磁盘
  private async saveFileToDisk(file: File, filePath: string): Promise<void> {
    this.ensureDirectoryExists(filePath)
    
    const buffer = await file.arrayBuffer()
    fs.writeFileSync(filePath, Buffer.from(buffer))
  }

  // 上传文档
  async uploadDocument(uploadData: UploadDocumentData, userId: string, ipAddress?: string, userAgent?: string): Promise<{ success: boolean; message: string; document?: Document }> {
    try {
      const { name, originalName, file, folderId, tags = [], metadata = {} } = uploadData

      // 验证文件夹是否存在（如果指定了folderId）
      if (folderId) {
        const folder = await folderDao.findById(folderId)
        if (!folder) {
          return { success: false, message: '指定的文件夹不存在' }
        }
        if (folder.createdBy !== userId) {
          return { success: false, message: '无权限访问该文件夹' }
        }
      }

      // 检查文件名是否重复
      const nameExists = await documentDao.nameExistsInFolder(name, folderId || null, userId)
      if (nameExists) {
        return { success: false, message: '文件名已存在' }
      }

      // 计算文件校验和
      const checksum = await this.calculateChecksum(file)

      // 检查是否有重复文件
      const duplicates = await documentDao.findByChecksum(checksum)
      if (duplicates.length > 0) {
        return { success: false, message: '文件已存在（重复文件）' }
      }

      // 获取存储路径
      const filePath = this.getStoragePath(file)

      // 保存文件到磁盘
      await this.saveFileToDisk(file, filePath)

      // 创建文档记录
      const documentData: NewDocument = {
        id: this.generateDocumentId(),
        name,
        originalName,
        size: file.size,
        type: file.type,
        mimeType: file.type,
        folderId: folderId || null,
        uploadedBy: userId,
        filePath,
        tags,
        metadata,
        checksum
      }

      // 如果是小文件（<1MB），也存储到数据库中
      if (file.size < 1024 * 1024) {
        documentData.fileData = await file.arrayBuffer()
      }

      const document = await documentDao.create(documentData)

      // 记录上传活动
      await activityDao.logUpload(userId, document.id, document.name, ipAddress, userAgent)

      return { success: true, message: '文件上传成功', document }

    } catch (error) {
      console.error('上传文档失败:', error)
      return { success: false, message: '文件上传失败，请稍后重试' }
    }
  }

  // 获取用户文档
  async getUserDocuments(userId: string): Promise<{ success: boolean; documents: Document[] }> {
    try {
      const documents = await documentDao.findByUserId(userId)
      return { success: true, documents }
    } catch (error) {
      console.error('获取用户文档失败:', error)
      return { success: false, documents: [] }
    }
  }

  // 获取文件夹中的文档
  async getFolderDocuments(folderId: string, userId: string): Promise<{ success: boolean; documents: Document[] }> {
    try {
      // 验证文件夹权限
      const folder = await folderDao.findById(folderId)
      if (!folder || folder.createdBy !== userId) {
        return { success: false, documents: [] }
      }

      const documents = await documentDao.findByFolderId(folderId)
      return { success: true, documents }
    } catch (error) {
      console.error('获取文件夹文档失败:', error)
      return { success: false, documents: [] }
    }
  }

  // 获取根目录文档
  async getRootDocuments(userId: string): Promise<{ success: boolean; documents: Document[] }> {
    try {
      const documents = await documentDao.findRootDocuments(userId)
      return { success: true, documents }
    } catch (error) {
      console.error('获取根目录文档失败:', error)
      return { success: false, documents: [] }
    }
  }

  // 搜索文档
  async searchDocuments(query: string, userId?: string): Promise<{ success: boolean; documents: Document[] }> {
    try {
      const documents = await documentDao.search(query, userId)
      return { success: true, documents }
    } catch (error) {
      console.error('搜索文档失败:', error)
      return { success: false, documents: [] }
    }
  }

  // 下载文档
  async downloadDocument(documentId: string, userId: string, ipAddress?: string, userAgent?: string): Promise<{ success: boolean; message: string; blob?: Blob; fileName?: string }> {
    try {
      const document = await documentDao.findById(documentId)
      if (!document) {
        return { success: false, message: '文档不存在' }
      }

      // 检查权限（文档所有者或管理员）
      if (document.uploadedBy !== userId) {
        // TODO: 检查是否为管理员
        return { success: false, message: '无权限下载该文档' }
      }

      let blob: Blob

      // 优先从数据库获取小文件
      if (document.fileData) {
        blob = new Blob([new Uint8Array(document.fileData as ArrayBuffer)], { type: document.mimeType })
      } else {
        // 从磁盘读取文件
        if (!fs.existsSync(document.filePath)) {
          return { success: false, message: '文件不存在' }
        }

        const buffer = fs.readFileSync(document.filePath)
        blob = new Blob([buffer], { type: document.mimeType })
      }

      // 记录下载活动
      await activityDao.logDownload(userId, document.id, document.name, ipAddress, userAgent)

      return { 
        success: true, 
        message: '下载成功', 
        blob, 
        fileName: document.originalName 
      }

    } catch (error) {
      console.error('下载文档失败:', error)
      return { success: false, message: '下载失败，请稍后重试' }
    }
  }

  // 删除文档
  async deleteDocument(documentId: string, userId: string, ipAddress?: string, userAgent?: string): Promise<{ success: boolean; message: string }> {
    try {
      const document = await documentDao.findById(documentId)
      if (!document) {
        return { success: false, message: '文档不存在' }
      }

      // 检查权限
      if (document.uploadedBy !== userId) {
        // TODO: 检查是否为管理员
        return { success: false, message: '无权限删除该文档' }
      }

      // 删除磁盘文件
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath)
      }

      // 删除数据库记录
      await documentDao.delete(documentId)

      // 记录删除活动
      await activityDao.logDelete(userId, 'document', documentId, document.name, ipAddress, userAgent)

      return { success: true, message: '文档删除成功' }

    } catch (error) {
      console.error('删除文档失败:', error)
      return { success: false, message: '删除失败，请稍后重试' }
    }
  }

  // 移动文档到文件夹
  async moveDocument(documentId: string, targetFolderId: string | null, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const document = await documentDao.findById(documentId)
      if (!document) {
        return { success: false, message: '文档不存在' }
      }

      // 检查权限
      if (document.uploadedBy !== userId) {
        return { success: false, message: '无权限移动该文档' }
      }

      // 验证目标文件夹
      if (targetFolderId) {
        const targetFolder = await folderDao.findById(targetFolderId)
        if (!targetFolder || targetFolder.createdBy !== userId) {
          return { success: false, message: '目标文件夹不存在或无权限' }
        }
      }

      // 检查目标位置是否有同名文件
      const nameExists = await documentDao.nameExistsInFolder(document.name, targetFolderId, userId, documentId)
      if (nameExists) {
        return { success: false, message: '目标位置已存在同名文件' }
      }

      // 更新文档的文件夹ID
      await documentDao.update(documentId, { folderId: targetFolderId })

      return { success: true, message: '文档移动成功' }

    } catch (error) {
      console.error('移动文档失败:', error)
      return { success: false, message: '移动失败，请稍后重试' }
    }
  }

  // 更新文档信息
  async updateDocument(documentId: string, updates: { name?: string; tags?: string[]; metadata?: Record<string, any> }, userId: string): Promise<{ success: boolean; message: string; document?: Document }> {
    try {
      const document = await documentDao.findById(documentId)
      if (!document) {
        return { success: false, message: '文档不存在' }
      }

      // 检查权限
      if (document.uploadedBy !== userId) {
        return { success: false, message: '无权限修改该文档' }
      }

      // 如果更新名称，检查是否重复
      if (updates.name && updates.name !== document.name) {
        const nameExists = await documentDao.nameExistsInFolder(updates.name, document.folderId, userId, documentId)
        if (nameExists) {
          return { success: false, message: '文件名已存在' }
        }
      }

      const updatedDocument = await documentDao.update(documentId, updates)
      if (!updatedDocument) {
        return { success: false, message: '更新失败' }
      }

      return { success: true, message: '文档更新成功', document: updatedDocument }

    } catch (error) {
      console.error('更新文档失败:', error)
      return { success: false, message: '更新失败，请稍后重试' }
    }
  }

  // 获取用户存储统计
  async getUserStorageStats(userId: string): Promise<{ success: boolean; stats?: any }> {
    try {
      const stats = await documentDao.getUserStorageStats(userId)
      return { success: true, stats }
    } catch (error) {
      console.error('获取存储统计失败:', error)
      return { success: false }
    }
  }

  // 获取系统存储统计（管理员）
  async getSystemStorageStats(): Promise<{ success: boolean; stats?: any }> {
    try {
      const stats = await documentDao.getSystemStorageStats()
      return { success: true, stats }
    } catch (error) {
      console.error('获取系统统计失败:', error)
      return { success: false }
    }
  }

  // 从localStorage迁移文档数据
  async migrateFromLocalStorage(userId: string): Promise<{ success: boolean; message: string; migrated: number }> {
    try {
      let migratedCount = 0

      // 迁移文档数据
      const localDocuments = localStorage.getItem('documents')
      if (localDocuments) {
        const documents = JSON.parse(localDocuments)
        for (const localDoc of documents) {
          // 检查文档是否已存在
          const existingDoc = await documentDao.findById(localDoc.id)
          if (!existingDoc) {
            const newDoc: NewDocument = {
              id: localDoc.id || this.generateDocumentId(),
              name: localDoc.name,
              originalName: localDoc.originalName || localDoc.name,
              size: localDoc.size || 0,
              type: localDoc.type || 'application/octet-stream',
              mimeType: localDoc.mimeType || localDoc.type || 'application/octet-stream',
              folderId: localDoc.folderId || null,
              uploadedBy: userId,
              filePath: localDoc.filePath || '',
              tags: localDoc.tags || [],
              metadata: localDoc.metadata || {},
              checksum: localDoc.checksum || 'migrated_' + Date.now()
            }
            await documentDao.create(newDoc)
            migratedCount++
          }
        }
      }

      return { success: true, message: `成功迁移 ${migratedCount} 个文档`, migrated: migratedCount }

    } catch (error) {
      console.error('文档数据迁移失败:', error)
      return { success: false, message: '文档数据迁移失败', migrated: 0 }
    }
  }
}

export const databaseDocumentService = new DatabaseDocumentService()