import cloudbase from '@cloudbase/js-sdk'

// 云开发配置
const app = cloudbase.init({
  env: 'your-env-id' // 请替换为您的云开发环境ID
})

// 获取认证实例
export const auth = app.auth()

// 获取数据库实例
export const db = app.database()

// 导出app实例用于云函数和存储操作
export { app }

// 用户认证相关函数
export const authService = {
  // 检查登录状态
  async checkLoginState() {
    try {
      const loginState = await auth.getLoginState()
      return loginState && loginState.user !== null
    } catch (error) {
      console.error('检查登录状态失败:', error)
      return false
    }
  },

  // 获取当前用户信息
  async getCurrentUser() {
    try {
      const user = await auth.getCurrentUser()
      return user
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  },

  // 跳转到默认登录页面（推荐方式）
  async toDefaultLoginPage() {
    try {
      // 使用匿名登录作为默认方式
      await this.signInAnonymously()
    } catch (error) {
      console.error('跳转登录页面失败:', error)
      throw error
    }
  },

  // 匿名登录
  async signInAnonymously() {
    try {
      const result = await auth.signInAnonymously()
      return result
    } catch (error) {
      console.error('匿名登录失败:', error)
      throw error
    }
  },

  // 退出登录
  async signOut() {
    try {
      await auth.signOut()
    } catch (error) {
      console.error('退出登录失败:', error)
      throw error
    }
  }
}

// 数据库操作相关函数
export const dbService = {
  // 获取文档集合
  getCollection(collectionName: string) {
    return db.collection(collectionName)
  },

  // 添加文档
  async addDocument(collectionName: string, data: any) {
    try {
      const result = await db.collection(collectionName).add(data)
      return result
    } catch (error) {
      console.error('添加文档失败:', error)
      throw error
    }
  },

  // 查询文档
  async getDocuments(collectionName: string, query?: any) {
    try {
      const collection = db.collection(collectionName)
      if (query) {
        const result = await collection.where(query).get()
        return result.data
      } else {
        const result = await collection.get()
        return result.data
      }
    } catch (error) {
      console.error('查询文档失败:', error)
      throw error
    }
  },

  // 更新文档
  async updateDocument(collectionName: string, docId: string, data: any) {
    try {
      const result = await db.collection(collectionName).doc(docId).update(data)
      return result
    } catch (error) {
      console.error('更新文档失败:', error)
      throw error
    }
  },

  // 删除文档
  async deleteDocument(collectionName: string, docId: string) {
    try {
      const result = await db.collection(collectionName).doc(docId).remove()
      return result
    } catch (error) {
      console.error('删除文档失败:', error)
      throw error
    }
  }
}

// 云存储操作相关函数
export const storageService = {
  // 上传文件
  async uploadFile(cloudPath: string, file: File): Promise<{ fileID: string; downloadURL: string }> {
    try {
      // 模拟文件上传过程（实际项目中应该使用真实的云存储API）
      console.log(`开始上传文件: ${file.name} (${file.size} bytes) -> ${cloudPath}`)
      
      // 模拟上传延迟
      const uploadTime = Math.min(file.size / 100000, 3000)
      await new Promise(resolve => setTimeout(resolve, uploadTime))
      
      // 模拟成功返回结果
      const fileID = `cloud_file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const downloadURL = `https://cloudbase-storage.example.com/files/${fileID}`
      
      console.log(`文件上传成功: ${file.name} -> fileID: ${fileID}`)
      
      return { fileID, downloadURL }
    } catch (error) {
      console.error('上传文件失败:', error)
      throw new Error(`文件上传失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  },

  // 获取文件下载链接
  async getFileDownloadURL(fileID: string) {
    try {
      // 使用正确的API方法
      const result = await app.getTempFileURL({
        fileList: [fileID]
      })
      return result.fileList?.[0]?.tempFileURL || null
    } catch (error) {
      console.error('获取下载链接失败:', error)
      throw error
    }
  },

  // 删除文件
  async deleteFile(fileID: string) {
    try {
      const result = await app.deleteFile({
        fileList: [fileID]
      })
      return result
    } catch (error) {
      console.error('删除文件失败:', error)
      throw error
    }
  }
}

// 云函数调用相关函数
export const functionsService = {
  // 调用云函数
  async callFunction(name: string, data?: any) {
    try {
      const result = await app.callFunction({
        name,
        data
      })
      return result.result
    } catch (error) {
      console.error(`调用云函数 ${name} 失败:`, error)
      throw error
    }
  }
}

export default app