// 数据管理工具 - 替代硬编码测试数据
export interface Document {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  files: Array<{
    name: string
    size: number
    type: string
    url: string
  }>
  createdAt: string
  updatedAt: string
  views: number
  downloads: number
  starred: boolean
  folderId: string
  permissions: {
    canView: boolean
    canEdit: boolean
    canDelete: boolean
    canShare: boolean
  }
}

export interface UserActivity {
  id: string | number
  type: 'visit' | 'view' | 'download' | 'upload'
  timestamp: string
  data: any
}

export interface SearchResult {
  id: string
  type: 'document' | 'folder' | 'user'
  title: string
  description?: string
  content?: string
  author?: string
  createdAt: string
  tags?: string[]
  relevance: number
}

// 获取文档数据
export const getDocuments = (): Document[] => {
  try {
    const stored = localStorage.getItem('documents')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('获取文档数据失败:', error)
    return []
  }
}

// 保存文档数据
export const saveDocuments = (documents: Document[]): void => {
  try {
    localStorage.setItem('documents', JSON.stringify(documents))
  } catch (error) {
    console.error('保存文档数据失败:', error)
  }
}

// 获取用户活动数据
export const getUserActivities = (): UserActivity[] => {
  try {
    const stored = localStorage.getItem('userActivities')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('获取用户活动数据失败:', error)
    return []
  }
}

// 保存用户活动数据
export const saveUserActivities = (activities: UserActivity[]): void => {
  try {
    localStorage.setItem('userActivities', JSON.stringify(activities))
  } catch (error) {
    console.error('保存用户活动数据失败:', error)
  }
}

// 添加用户活动记录
export const addUserActivity = (activity: Omit<UserActivity, 'id'>): void => {
  try {
    const activities = getUserActivities()
    const newActivity: UserActivity = {
      ...activity,
      id: Date.now() + Math.random()
    }
    activities.unshift(newActivity)
    
    // 只保留最近1000条记录
    const limitedActivities = activities.slice(0, 1000)
    saveUserActivities(limitedActivities)
  } catch (error) {
    console.error('添加用户活动失败:', error)
  }
}

// 搜索文档
export const searchDocuments = (searchTerm: string): SearchResult[] => {
  try {
    const documents = getDocuments()
    const folders = getFolders()
    
    const results: SearchResult[] = []
    
    // 搜索文档
    documents.forEach(doc => {
      let relevance = 0
      const term = searchTerm.toLowerCase()
      
      if (doc.title.toLowerCase().includes(term)) relevance += 50
      if (doc.description.toLowerCase().includes(term)) relevance += 30
      if (doc.category.toLowerCase().includes(term)) relevance += 20
      if (doc.tags.some(tag => tag.toLowerCase().includes(term))) relevance += 25
      
      if (relevance > 0) {
        results.push({
          id: doc.id,
          type: 'document',
          title: doc.title,
          description: doc.description,
          content: doc.description,
          createdAt: doc.createdAt,
          tags: doc.tags,
          relevance
        })
      }
    })
    
    // 搜索文件夹
    folders.forEach(folder => {
      let relevance = 0
      const term = searchTerm.toLowerCase()
      
      if (folder.name.toLowerCase().includes(term)) relevance += 40
      
      if (relevance > 0) {
        results.push({
          id: folder.id,
          type: 'folder',
          title: folder.name,
          description: `文件夹`,
          createdAt: folder.createdAt || new Date().toISOString(),
          relevance
        })
      }
    })
    
    return results.sort((a, b) => b.relevance - a.relevance)
  } catch (error) {
    console.error('搜索失败:', error)
    return []
  }
}

// 获取文件夹数据
export const getFolders = () => {
  try {
    const stored = localStorage.getItem('folders')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('获取文件夹数据失败:', error)
    return []
  }
}

// 获取仪表盘统计数据
export const getDashboardStats = () => {
  try {
    const documents = getDocuments()
    const activities = getUserActivities()
    const folders = getFolders()
    
    // 计算今日活动
    const today = new Date().toDateString()
    const todayActivities = activities.filter(activity => 
      new Date(activity.timestamp).toDateString() === today
    )
    
    // 计算本周活动
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekActivities = activities.filter(activity => 
      new Date(activity.timestamp) >= weekAgo
    )
    
    return {
      totalDocuments: documents.length,
      totalFolders: folders.length,
      todayViews: todayActivities.filter(a => a.type === 'view').length,
      weeklyViews: weekActivities.filter(a => a.type === 'view').length,
      totalViews: documents.reduce((sum, doc) => sum + doc.views, 0),
      totalDownloads: documents.reduce((sum, doc) => sum + doc.downloads, 0),
      starredDocuments: documents.filter(doc => doc.starred).length,
      recentDocuments: documents
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5),
      recentActivities: activities.slice(0, 10)
    }
  } catch (error) {
    console.error('获取仪表盘统计失败:', error)
    return {
      totalDocuments: 0,
      totalFolders: 0,
      todayViews: 0,
      weeklyViews: 0,
      totalViews: 0,
      totalDownloads: 0,
      starredDocuments: 0,
      recentDocuments: [],
      recentActivities: []
    }
  }
}

// 清理所有数据
export const clearAllData = (): void => {
  try {
    localStorage.removeItem('documents')
    localStorage.removeItem('userActivities')
    localStorage.removeItem('folders')
    localStorage.removeItem('recent_searches')
    console.log('所有数据已清理')
  } catch (error) {
    console.error('清理数据失败:', error)
  }
}

// 初始化空数据结构（如果需要）
export const initializeEmptyData = (): void => {
  try {
    if (!localStorage.getItem('documents')) {
      localStorage.setItem('documents', JSON.stringify([]))
    }
    if (!localStorage.getItem('userActivities')) {
      localStorage.setItem('userActivities', JSON.stringify([]))
    }
    if (!localStorage.getItem('folders')) {
      localStorage.setItem('folders', JSON.stringify([]))
    }
    console.log('空数据结构已初始化')
  } catch (error) {
    console.error('初始化数据结构失败:', error)
  }
}