import { API_ORIGIN, API_FILES } from './apiBase'

// 本地存储配置服务
export interface StorageConfig {
  type: 'local' | 'cloud'
  localPath?: string
  cloudProvider?: 'cloudbase' | 'other'
}

const STORAGE_CONFIG_KEY = 'document_system_storage_config'

class StorageService {
  // 获取存储配置
  getStorageConfig(): StorageConfig {
    const config = localStorage.getItem(STORAGE_CONFIG_KEY)
    return config ? JSON.parse(config) : {
      type: 'local',
      localPath: this.getDefaultLocalPath()
    }
  }

  // 保存存储配置
  saveStorageConfig(config: StorageConfig): void {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config))
  }

  // 获取默认本地路径
  private getDefaultLocalPath(): string {
    // 默认使用 D:\DOC_STORAGE 目录
    const userAgent = navigator.userAgent
    if (userAgent.includes('Windows')) {
      return 'D:\\DOC_STORAGE'
    } else if (userAgent.includes('Mac')) {
      return '~/Documents/DOC_STORAGE'
    } else {
      return '~/Documents/DOC_STORAGE'
    }
  }

  // 选择本地存储路径（模拟文件选择器）
  async selectLocalPath(): Promise<string | null> {
    // 在实际应用中，这里会调用 Electron 的文件选择器或浏览器的文件系统 API
    // 这里我们模拟一个路径选择
    const customPath = prompt('请输入本地存储路径:', this.getDefaultLocalPath())
    return customPath
  }

  // 验证路径是否有效
  validatePath(path: string): boolean {
    // 简单的路径验证
    if (!path || path.trim() === '') return false
    
    // 检查路径格式
    const windowsPathRegex = /^[a-zA-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$/
    const unixPathRegex = /^(\/|~\/)[^<>:"|?*\r\n]*$/
    
    return windowsPathRegex.test(path) || unixPathRegex.test(path)
  }

  // 创建本地存储目录（改为走后端API，后端会同时创建 system 子目录并持久化配置）
  async createLocalDirectory(path: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.validatePath(path)) {
        return { success: false, message: '路径格式无效' }
      }

      const response = await fetch(`${API_ORIGIN}/api/files/storage/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: path })
      })
      const result = await response.json()

      if (response.ok && result.success) {
        return { success: true, message: '目录创建成功' }
      }
      return { success: false, message: result.message || '目录创建失败' }
    } catch (error) {
      console.error('创建目录失败:', error)
      return { success: false, message: '目录创建失败' }
    }
  }

  // 通过后端API保存文件（附带当前用户头信息，便于记录作者与活动日志）
  async saveFileViaBackend(file: File): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const formData = new FormData()
      formData.append('files', file)
      formData.append('title', file.name)
      formData.append('description', `上传于 ${new Date().toLocaleString()}`)

      const headers: Record<string, string> = {}
      try {
        const raw = localStorage.getItem('currentUser')
        const currentUser = raw ? JSON.parse(raw) : null
        if (currentUser?.id) {
          headers['X-User-Id'] = String(currentUser.id)
          formData.append('userId', String(currentUser.id))
        }
        if (currentUser?.username || currentUser?.name) {
          // 避免中文放入请求头导致浏览器错误，放入表单字段
          formData.append('userName', String(currentUser.username || currentUser.name))
        }
      } catch {}

      const response = await fetch(`${API_FILES}/upload`, {
        method: 'POST',
        headers, // 不设置 Content-Type，浏览器会为 FormData 自动带 boundary
        body: formData
      })

      const result = await response.json()

      if (response.ok && result.success) {
        return { success: true, data: result.data }
      }
      return { success: false, message: result.message || '后端上传失败' }
    } catch (error) {
      console.error('后端API调用失败:', error)
      return { success: false, message: '无法连接到后端服务' }
    }
  }

  // 创建下载链接，让用户可以手动保存文件
  createDownloadLink(file: File, fileName: string): void {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.style.display = 'none'
    document.body.appendChild(a)
    
    // 自动触发下载
    a.click()
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
    
    console.log(`💾 文件下载已触发，文件名: ${fileName}`)
  }
}

export const storageService = new StorageService()