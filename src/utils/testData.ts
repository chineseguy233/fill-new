// 测试数据生成工具
export const generateTestUserActivities = () => {
  const activities = []
  const now = new Date()
  
  // 生成过去7天的测试数据
  for (let i = 0; i < 7; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    // 每天生成一些随机活动
    const dailyVisits = Math.floor(Math.random() * 10) + 1
    const dailyViews = Math.floor(Math.random() * 20) + 5
    const dailyDownloads = Math.floor(Math.random() * 5) + 1
    const dailyUploads = Math.floor(Math.random() * 3) + 1
    
    // 访问记录
    for (let j = 0; j < dailyVisits; j++) {
      activities.push({
        id: Date.now() + Math.random(),
        type: 'visit',
        timestamp: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        data: { page: Math.random() > 0.5 ? 'dashboard' : 'documents' }
      })
    }
    
    // 查看记录
    for (let j = 0; j < dailyViews; j++) {
      activities.push({
        id: Date.now() + Math.random(),
        type: 'view',
        timestamp: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        data: { documentId: `doc_${Math.floor(Math.random() * 100)}` }
      })
    }
    
    // 下载记录
    for (let j = 0; j < dailyDownloads; j++) {
      activities.push({
        id: Date.now() + Math.random(),
        type: 'download',
        timestamp: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        data: { documentId: `doc_${Math.floor(Math.random() * 100)}` }
      })
    }
    
    // 上传记录
    for (let j = 0; j < dailyUploads; j++) {
      activities.push({
        id: Date.now() + Math.random(),
        type: 'upload',
        timestamp: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        data: { fileName: `test_file_${Math.floor(Math.random() * 100)}.pdf` }
      })
    }
  }
  
  return activities
}

// 初始化测试数据
export const initializeTestData = () => {
  // 检查是否已有用户活动数据
  const existingActivities = localStorage.getItem('userActivities')
  
  if (!existingActivities || JSON.parse(existingActivities).length === 0) {
    console.log('生成测试用户活动数据...')
    const testActivities = generateTestUserActivities()
    localStorage.setItem('userActivities', JSON.stringify(testActivities))
    console.log(`已生成 ${testActivities.length} 条测试活动记录`)
  }
  
  // 检查是否已有文档数据
  const existingDocs = localStorage.getItem('documents')
  
  if (!existingDocs || JSON.parse(existingDocs).length === 0) {
    console.log('生成测试文档数据...')
    const testDocuments = generateTestDocuments()
    localStorage.setItem('documents', JSON.stringify(testDocuments))
    console.log(`已生成 ${testDocuments.length} 个测试文档`)
  }
}

// 生成测试文档数据
export const generateTestDocuments = () => {
  const documents = []
  const fileTypes = ['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'md']
  const categories = ['工作文档', '学习资料', '项目文件', '个人文档']
  
  for (let i = 1; i <= 15; i++) {
    const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)]
    const category = categories[Math.floor(Math.random() * categories.length)]
    const createdDate = new Date()
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30))
    
    documents.push({
      id: `doc_${i}`,
      title: `测试文档 ${i}`,
      description: `这是第 ${i} 个测试文档，用于演示系统功能`,
      category,
      tags: [`标签${i}`, `测试`],
      files: [{
        name: `test_document_${i}.${fileType}`,
        size: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
        type: `application/${fileType}`,
        url: `#test_file_${i}`
      }],
      createdAt: createdDate.toISOString(),
      updatedAt: createdDate.toISOString(),
      views: Math.floor(Math.random() * 50) + 1,
      downloads: Math.floor(Math.random() * 20),
      starred: Math.random() > 0.7, // 30% 概率被收藏
      folderId: Math.random() > 0.5 ? `folder_${Math.floor(Math.random() * 5) + 1}` : null,
      permissions: {
        canView: true,
        canEdit: true,
        canDelete: true,
        canShare: true
      }
    })
  }
  
  return documents
}

// 清理测试数据
export const clearTestData = () => {
  localStorage.removeItem('userActivities')
  localStorage.removeItem('documents')
  console.log('测试数据已清理')
}