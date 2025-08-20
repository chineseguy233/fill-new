import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  FileText, 
  Folder, 
  Activity,
  Server,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { clearAllData, getDocuments, getUserActivities, getFolders } from '@/utils/dataManager'
import { API_FILES } from '@/lib/apiBase'

interface DataStats {
  localStorage: {
    documents: number
    folders: number
    activities: number
  }
  backend: {
    files: number
  }
  isTestData: boolean
}

export default function DataManagementPage() {
  const [stats, setStats] = useState<DataStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    setIsLoading(true)
    try {
      const documents = getDocuments()
      const activities = getUserActivities()
      const folders = getFolders()
      
      // 检查是否有测试数据
      const hasTestData = documents.some(doc => 
        doc.title?.includes('测试') || 
        doc.description?.includes('测试') ||
        doc.category === '测试文档'
      )
      
      // 获取后端文件数量
      let backendFiles = 0
      try {
        const response = await fetch(`${API_FILES}/list`)
        if (response.ok) {
          const data = await response.json()
          backendFiles = data.data?.files?.length || 0
        }
      } catch (error) {
        console.warn('无法获取后端文件数量:', error)
      }
      
      setStats({
        localStorage: {
          documents: documents.length,
          folders: folders.length,
          activities: activities.length
        },
        backend: {
          files: backendFiles
        },
        isTestData: hasTestData
      })
    } catch (error) {
      console.error('加载数据统计失败:', error)
      toast({
        title: '加载失败',
        description: '无法获取数据统计信息',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearTestData = async () => {
    setIsProcessing(true)
    try {
      clearAllData()
      toast({
        title: '清理成功',
        description: '所有测试数据已清理完成'
      })
      await loadStatistics()
    } catch (error) {
      toast({
        title: '清理失败',
        description: error instanceof Error ? error.message : '清理测试数据时发生错误',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSyncRealDocuments = async () => {
    setIsProcessing(true)
    try {
      // 从后端获取真实文件并同步到前端
      const response = await fetch(`${API_FILES}/list`)
      if (!response.ok) {
        throw new Error('无法获取后端文件列表')
      }
      
      const data = await response.json()
      const files = data.data?.files || []
      
      // 转换为文档格式并保存
      const documents = files.map((file: any, index: number) => ({
        id: `real_doc_${Date.now()}_${index}`,
        title: file.originalName || file.name,
        description: `从后端同步的真实文档`,
        category: '真实文档',
        tags: ['同步', '真实'],
        files: [{
          name: file.originalName || file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          url: `/api/files/download/${file.name}`
        }],
        createdAt: file.stats?.mtime || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: 0,
        downloads: 0,
        starred: false,
        folderId: 'root',
        permissions: {
          canView: true,
          canEdit: true,
          canDelete: true,
          canShare: true
        }
      }))
      
      // 保存到localStorage
      localStorage.setItem('documents', JSON.stringify(documents))
      
      toast({
        title: '同步成功',
        description: `已同步 ${documents.length} 个真实文档`
      })
      await loadStatistics()
    } catch (error) {
      toast({
        title: '同步失败',
        description: error instanceof Error ? error.message : '同步真实文档时发生错误',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleResetToProduction = async () => {
    setIsProcessing(true)
    try {
      // 先清理所有数据
      clearAllData()
      
      // 然后同步真实文档
      await handleSyncRealDocuments()
      
      toast({
        title: '重置成功',
        description: '系统已重置为生产环境，所有测试数据已清理并同步了真实文档'
      })
      await loadStatistics()
    } catch (error) {
      toast({
        title: '重置失败',
        description: error instanceof Error ? error.message : '重置生产环境数据时发生错误',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">数据管理</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">数据管理</h1>
          <p className="text-gray-600 mt-1">
            管理系统数据，清理测试数据并同步真实文档
          </p>
        </div>
        <Button onClick={loadStatistics} variant="outline" disabled={isProcessing}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新统计
        </Button>
      </div>

      {/* 数据状态警告 */}
      {stats?.isTestData && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-800">检测到测试数据</CardTitle>
            </div>
            <CardDescription className="text-orange-700">
              系统中包含测试数据，建议清理后同步真实文档数据以获得最佳体验
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* 数据统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本地文档</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.localStorage.documents || 0}</div>
            <p className="text-xs text-muted-foreground">
              localStorage中的文档数量
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">文件夹</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.localStorage.folders || 0}</div>
            <p className="text-xs text-muted-foreground">
              用户创建的文件夹数量
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活动记录</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.localStorage.activities || 0}</div>
            <p className="text-xs text-muted-foreground">
              用户活动日志数量
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">后端文件</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.backend.files || 0}</div>
            <p className="text-xs text-muted-foreground">
              后端存储的真实文件
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 数据管理操作 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 清理测试数据 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <span>清理测试数据</span>
            </CardTitle>
            <CardDescription>
              删除所有测试文档、文件夹和活动记录，清理localStorage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">数据类型</span>
              <Badge variant={stats?.isTestData ? "destructive" : "secondary"}>
                {stats?.isTestData ? "包含测试数据" : "生产数据"}
              </Badge>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  disabled={isProcessing || !stats?.isTestData}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  清理测试数据
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认清理测试数据</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作将删除所有测试文档、文件夹和活动记录。此操作不可撤销，请确认继续。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearTestData} className="bg-red-600 hover:bg-red-700">
                    确认清理
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* 同步真实文档 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-600" />
              <span>同步真实文档</span>
            </CardTitle>
            <CardDescription>
              从后端存储同步真实上传的文档数据到前端
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">后端文件</span>
              <Badge variant="outline">
                {stats?.backend.files || 0} 个文件
              </Badge>
            </div>
            
            <Button 
              onClick={handleSyncRealDocuments}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isProcessing}
            >
              <Database className="h-4 w-4 mr-2" />
              {isProcessing ? '同步中...' : '同步真实文档'}
            </Button>
          </CardContent>
        </Card>

        {/* 重置为生产环境 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>重置为生产环境</span>
            </CardTitle>
            <CardDescription>
              一键清理测试数据并同步真实文档，完整重置为生产环境
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>此操作将：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>清理所有测试数据</li>
                <li>同步后端真实文档</li>
                <li>重置为生产环境状态</li>
              </ul>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isProcessing}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  重置为生产环境
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认重置为生产环境</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作将清理所有测试数据并同步真实文档。这是一个完整的重置操作，不可撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetToProduction} className="bg-green-600 hover:bg-green-700">
                    确认重置
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {/* 操作说明 */}
      <Card>
        <CardHeader>
          <CardTitle>操作说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-red-600 mb-2">清理测试数据</h4>
              <p className="text-gray-600">
                删除localStorage中的所有测试文档、文件夹和活动记录，为同步真实数据做准备。
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-600 mb-2">同步真实文档</h4>
              <p className="text-gray-600">
                从后端存储获取真实上传的文件，转换为文档格式并保存到前端数据库。
              </p>
            </div>
            <div>
              <h4 className="font-medium text-green-600 mb-2">重置为生产环境</h4>
              <p className="text-gray-600">
                一键完成清理和同步操作，将系统完全重置为生产环境状态。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}