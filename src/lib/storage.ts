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

  // 创建本地存储目录（模拟）
  async createLocalDirectory(path: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.validatePath(path)) {
        return { success: false, message: '路径格式无效' }
      }

      // 在实际应用中，这里会创建真实的目录
      // 这里我们模拟目录创建
      console.log(`模拟创建目录: ${path}`)
      
      return { success: true, message: '目录创建成功' }
    } catch (error) {
      return { success: false, message: '目录创建失败' }
    }
  }

  // 通过后端API保存文件
  async saveFileViaBackend(file: File): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const formData = new FormData()
      formData.append('files', file)
      formData.append('title', file.name)
      formData.append('description', `上传于 ${new Date().toLocaleString()}`)
      
      const response = await fetch('http://localhost:3001/api/files/upload', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        return {
          success: true,
          data: result.data
        }
      } else {
        return {
          success: false,
          message: result.message || '后端上传失败'
        }
      }
    } catch (error) {
      console.error('后端API调用失败:', error)
      return {
        success: false,
        message: '无法连接到后端服务'
      }
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