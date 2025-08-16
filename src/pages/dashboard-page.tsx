import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import DocumentUpload from '@/components/DocumentUpload'
import { useAuth } from '@/contexts/AuthContext'
import { initializeTestData } from '@/utils/testData'
import { 
  FileText, 
  Upload, 
  Download, 
  Users, 
  TrendingUp,
  Clock,
  Star,
  Eye
} from 'lucide-react'

export default function DashboardPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [stats, setStats] = useState([
    {
      title: '总文档数',
      value: '0',
      change: '+0%',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      title: '本月上传',
      value: '0',
      change: '+0%',
      icon: Upload,
      color: 'text-green-600'
    },
    {
      title: '本月下载',
      value: '0',
      change: '+0%',
      icon: Download,
      color: 'text-purple-600'
    },
    {
      title: '活跃用户',
      value: '1',
      change: '+0%',
      icon: Users,
      color: 'text-orange-600'
    }
  ])
  const [recentDocuments, setRecentDocuments] = useState<any[]>([])
  const [starredDocuments, setStarredDocuments] = useState<any[]>([])
  const { user } = useAuth()
  
  // 检查是否为管理员
  const isAdmin = user?.role === 'admin' || user?.permissions?.canManageUsers || false

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 获取文件类型
  const getFileType = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf': return 'PDF'
      case 'doc':
      case 'docx': return 'Word'
      case 'xls':
      case 'xlsx': return 'Excel'
      case 'ppt':
      case 'pptx': return 'PowerPoint'
      case 'txt': return 'Text'
      case 'md': return 'Markdown'
      case 'zip':
      case 'rar': return 'Archive'
      default: return 'File'
    }
  }

  // 获取相对时间
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInHours < 1) return '刚刚'
    if (diffInHours < 24) return `${diffInHours}小时前`
    if (diffInDays < 7) return `${diffInDays}天前`
    return date.toLocaleDateString('zh-CN')
  }

  // 记录用户行为
  const recordUserActivity = (type: 'visit' | 'view' | 'download' | 'upload', data?: any) => {
    try {
      const activities = JSON.parse(localStorage.getItem('userActivities') || '[]')
      const newActivity = {
        id: Date.now(),
        type,
        timestamp: new Date().toISOString(),
        data: data || {}
      }
      
      activities.push(newActivity)
      
      // 清理30天前的数据
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const filteredActivities = activities.filter((activity: any) => 
        new Date(activity.timestamp) > thirtyDaysAgo
      )
      
      localStorage.setItem('userActivities', JSON.stringify(filteredActivities))
    } catch (error) {
      console.error('记录用户行为失败:', error)
    }
  }

  // 获取用户行为统计
  const getUserActivityStats = () => {
    try {
      const activities = JSON.parse(localStorage.getItem('userActivities') || '[]')
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // 今日统计
      const todayActivities = activities.filter((activity: any) => {
        const activityDate = new Date(activity.timestamp)
        return activityDate.toDateString() === today.toDateString()
      })

      // 7天统计
      const weekActivities = activities.filter((activity: any) => {
        const activityDate = new Date(activity.timestamp)
        return activityDate >= sevenDaysAgo
      })

      // 30天统计
      const monthActivities = activities.filter((activity: any) => {
        const activityDate = new Date(activity.timestamp)
        return activityDate >= thirtyDaysAgo
      })

      return {
        today: {
          visits: todayActivities.filter((a: any) => a.type === 'visit').length,
          views: todayActivities.filter((a: any) => a.type === 'view').length,
          downloads: todayActivities.filter((a: any) => a.type === 'download').length,
          uploads: todayActivities.filter((a: any) => a.type === 'upload').length
        },
        week: {
          visits: weekActivities.filter((a: any) => a.type === 'visit').length,
          views: weekActivities.filter((a: any) => a.type === 'view').length,
          downloads: weekActivities.filter((a: any) => a.type === 'download').length,
          uploads: weekActivities.filter((a: any) => a.type === 'upload').length
        },
        month: {
          visits: monthActivities.filter((a: any) => a.type === 'visit').length,
          views: monthActivities.filter((a: any) => a.type === 'view').length,
          downloads: monthActivities.filter((a: any) => a.type === 'download').length,
          uploads: monthActivities.filter((a: any) => a.type === 'upload').length
        }
      }
    } catch (error) {
      console.error('获取用户行为统计失败:', error)
      return {
        today: { visits: 0, views: 0, downloads: 0, uploads: 0 },
        week: { visits: 0, views: 0, downloads: 0, uploads: 0 },
        month: { visits: 0, views: 0, downloads: 0, uploads: 0 }
      }
    }
  }

  // 加载仪表盘数据
  const loadDashboardData = () => {
    try {
      const storedDocs = JSON.parse(localStorage.getItem('documents') || '[]')
      const activityStats = getUserActivityStats()
      
      // 计算统计数据
      const totalDocs = storedDocs.length
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      
      const thisMonthDocs = storedDocs.filter((doc: any) => {
        const docDate = new Date(doc.createdAt)
        return docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear
      }).length

      const totalViews = storedDocs.reduce((sum: number, doc: any) => sum + (doc.views || 0), 0)
      
      // 所有用户都可以看到用户行为统计
      setStats([
        {
          title: '总文档数',
          value: totalDocs.toString(),
          change: `今日访问: ${activityStats.today.visits}`,
          icon: FileText,
          color: 'text-blue-600'
        },
        {
          title: '本月上传',
          value: thisMonthDocs.toString(),
          change: `7天内: ${activityStats.week.uploads}`,
          icon: Upload,
          color: 'text-green-600'
        },
        {
          title: '总查看次数',
          value: totalViews.toString(),
          change: `今日查看: ${activityStats.today.views}`,
          icon: Eye,
          color: 'text-purple-600'
        },
        {
          title: '下载次数',
          value: activityStats.month.downloads.toString(),
          change: `今日下载: ${activityStats.today.downloads}`,
          icon: Download,
          color: 'text-orange-600'
        }
      ])

      // 获取最近文档（按修改时间排序）
      const recentDocs = storedDocs
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4)
        .map((doc: any) => ({
          id: doc.id,
          name: doc.title || doc.files?.[0]?.name || '未命名文档',
          type: doc.files?.[0] ? getFileType(doc.files[0].name) : 'File',
          size: doc.files?.[0] ? formatFileSize(doc.files[0].size) : '0 Bytes',
          modified: getRelativeTime(doc.createdAt),
          views: doc.views || 0
        }))

      setRecentDocuments(recentDocs)

      // 获取收藏文档
      const favoriteFiles = JSON.parse(localStorage.getItem('favoriteFiles') || '[]')
      const favoriteDetails = JSON.parse(localStorage.getItem('favoriteDetails') || '{}')
      
      // 从后端获取文件列表来匹配收藏的文件
      fetch('http://localhost:3001/api/files/list')
        .then(response => response.json())
        .then(data => {
          const files = data.data?.files || []
          const favoriteDocuments = favoriteFiles
            .map((filename: string) => {
              const file = files.find((f: any) => f.name === filename)
              const details = favoriteDetails[filename]
              if (file && details) {
                return {
                  id: filename,
                  name: details.originalName || file.originalName || file.name,
                  type: getFileType(details.originalName || file.originalName || file.name),
                  size: formatFileSize(file.size),
                  modified: getRelativeTime(details.addedAt),
                  views: 0,
                  filename: filename
                }
              }
              return null
            })
            .filter(Boolean)
            .slice(0, 4)
          
          setStarredDocuments(favoriteDocuments)
        })
        .catch(error => {
          console.error('获取收藏文档失败:', error)
          setStarredDocuments([])
        })

    } catch (error) {
      console.error('加载仪表盘数据失败:', error)
    }
  }

  // 组件挂载时加载数据
  useEffect(() => {
    // 初始化测试数据（如果没有数据的话）
    initializeTestData()
    
    // 记录页面访问
    recordUserActivity('visit', { page: 'dashboard' })
    
    loadDashboardData()
    
    // 设置定时器，每30秒自动更新一次数据
    const interval = setInterval(loadDashboardData, 30000)
    
    return () => clearInterval(interval)
  }, [isAdmin])

  const handleUploadComplete = () => {
    setIsUploadOpen(false)
    // 记录上传行为
    recordUserActivity('upload', { timestamp: new Date().toISOString() })
    // 上传完成后立即刷新数据
    loadDashboardData()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">仪表盘</h1>
          <p className="text-gray-600 mt-1">欢迎回来！这里是您的文档管理概览</p>
          {/* 调试信息 */}
          <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <strong>调试信息:</strong> 用户角色: {user?.role || '未知'} | 
            管理员权限: {isAdmin ? '是' : '否'} | 
            统计数据已加载: {stats.length > 0 ? '是' : '否'} |
            测试数据: {JSON.parse(localStorage.getItem('userActivities') || '[]').length} 条活动记录
          </div>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              上传文档
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogTitle className="sr-only">上传文档</DialogTitle>
            <DocumentUpload 
              onUploadComplete={handleUploadComplete}
              onClose={() => setIsUploadOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">{stat.change}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-full bg-gray-50 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              最近文档
            </CardTitle>
            <CardDescription>
              您最近访问和修改的文档
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDocuments.length > 0 ? (
                recentDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Badge variant="secondary">{doc.type}</Badge>
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>{doc.modified}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Eye className="h-4 w-4" />
                      <span>{doc.views}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无最近文档</p>
                  <p className="text-sm">上传文档后将在此显示</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              收藏文档
            </CardTitle>
            <CardDescription>
              您标记为收藏的重要文档
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {starredDocuments.length > 0 ? (
                starredDocuments.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      // 记录查看行为
                      recordUserActivity('view', { documentId: doc.id, documentName: doc.name })
                      // 跳转到文档预览页面
                      window.location.href = `/document-preview?file=${encodeURIComponent(doc.filename)}&displayName=${encodeURIComponent(doc.name)}`
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Badge variant="secondary">{doc.type}</Badge>
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>{doc.modified}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Eye className="h-4 w-4" />
                      <span>{doc.views}</span>
                      <Star className="h-4 w-4 text-yellow-500 fill-current ml-2" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无收藏文档</p>
                  <p className="text-sm">点击文档旁的星标来收藏重要文档</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}