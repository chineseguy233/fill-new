import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  FileText, 
  Upload, 
  Search, 
  Filter,
  MoreHorizontal,
  Download,
  Star,
  Trash2,
  Eye,
  Grid3X3,
  List,
  FolderOpen
} from 'lucide-react'
import DocumentUpload from '@/components/DocumentUpload'
import FileMoveDialog from '@/components/FileMoveDialog'
import { useToast } from '@/hooks/use-toast'


export default function DocumentsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [moveFileDialog, setMoveFileDialog] = useState<{
    open: boolean
    fileId: string
    fileName: string
    currentFolderId?: string
  }>({
    open: false,
    fileId: '',
    fileName: '',
    currentFolderId: undefined
  })
  
  const { toast } = useToast()

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

  // 获取文件夹名称
  const getFolderName = (folderId: string) => {
    const folderMap: { [key: string]: string } = {
      'root': '根目录',
      'documents': '文档',
      'images': '图片',
      'projects': '项目文件',
      'archive': '归档'
    }
    return folderMap[folderId] || '未知文件夹'
  }

  // 从localStorage和后端存储加载文档
  const loadDocuments = async () => {
    setIsLoading(true)
    try {
      // 首先从后端获取真实存在的文件列表
      let backendFiles: any[] = []
      try {
        const backendModule = await import('@/lib/backendStorage')
        const backendResult = await backendModule.backendStorageService.getFileList()
        
        if (backendResult.success && backendResult.data?.files) {
          backendFiles = backendResult.data.files
          console.log('从后端加载的文件:', backendFiles.length)
        }
      } catch (backendError) {
        console.warn('后端文件加载失败:', backendError)
      }

      // 创建后端文件名映射
      const backendFileMap = new Map()
      backendFiles.forEach(file => {
        backendFileMap.set(file.name, file)
      })

      // 从localStorage加载文档信息
      const storedDocs = JSON.parse(localStorage.getItem('documents') || '[]')
      console.log('从localStorage加载的文档:', storedDocs.length)
      
      const allDocuments: any[] = []
      
      // 处理localStorage中的文档，只保留在后端存储中真实存在的文件
      storedDocs.forEach((doc: any) => {
        if (doc.files && Array.isArray(doc.files)) {
          // 检查文档的文件是否在后端存储中存在
          const existingFiles = doc.files.filter((file: any) => {
            return file.filename && backendFileMap.has(file.filename)
          })
          
          if (existingFiles.length > 0) {
            // 如果有文件存在，添加到文档列表
            allDocuments.push({
              id: doc.id,
              name: doc.title || existingFiles[0]?.name || '未命名文档',
              type: existingFiles[0] ? getFileType(existingFiles[0].name) : 'File',
              size: existingFiles[0] ? formatFileSize(existingFiles[0].size) : '0 Bytes',
              modified: new Date(doc.createdAt || Date.now()).toLocaleDateString('zh-CN'),
              author: doc.authorName || '未知用户',
              views: doc.views || 0,
              starred: doc.starred || false,
              tags: doc.tags || [],
              folderId: doc.folderId || 'root',
              folderName: getFolderName(doc.folderId || 'root'),
              description: doc.description || '',
              files: existingFiles,
              originalData: doc,
              source: 'localStorage'
            })
            
            // 从后端文件映射中移除已处理的文件
            existingFiles.forEach((file: any) => {
              if (file.filename) {
                backendFileMap.delete(file.filename)
              }
            })
          }
        }
      })

      // 添加剩余的后端文件（localStorage中没有记录的文件）
      backendFileMap.forEach((file: any, fileName: string) => {
        const docId = `backend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // 从文件名中提取原始文件名（去掉时间戳前缀）
        const originalName = fileName.includes('_') ? 
          fileName.split('_').slice(2).join('_') : fileName
        
        console.log(`添加未记录的后端文件: ${fileName} -> 显示名称: ${originalName}`)
        
        allDocuments.push({
          id: docId,
          name: originalName, // 使用原始文件名作为显示名称
          type: getFileType(originalName),
          size: formatFileSize(file.size),
          modified: new Date(file.modified).toLocaleDateString('zh-CN'),
          author: '系统导入',
          views: 0,
          starred: false,
          tags: ['后端存储'],
          folderId: 'root',
          folderName: getFolderName('root'),
          description: '从存储目录自动导入的文件',
          files: [{
            name: originalName, // 显示名称使用原始文件名
            filename: fileName, // 实际文件名用于下载
            originalName: originalName, // 保存原始文件名
            size: file.size,
            type: 'application/octet-stream',
            uploadTime: file.modified
          }],
          originalData: {
            id: docId,
            title: originalName, // 标题使用原始文件名
            files: [{
              name: originalName,
              filename: fileName,
              originalName: originalName,
              size: file.size,
              type: 'application/octet-stream'
            }],
            createdAt: file.modified,
            authorName: '系统导入',
            tags: ['后端存储'],
            folderId: 'root'
          },
          source: 'backend'
        })
      })

      console.log('最终文档总数:', allDocuments.length)
      console.log('后端文件总数:', backendFiles.length)
      setDocuments(allDocuments)
      
      // 清理localStorage中不存在的文件记录
      const validDocs = storedDocs.filter((doc: any) => {
        if (!doc.files || !Array.isArray(doc.files)) return false
        return doc.files.some((file: any) => {
          return file.filename && backendFiles.some(bf => bf.name === file.filename)
        })
      })
      
      if (validDocs.length !== storedDocs.length) {
        localStorage.setItem('documents', JSON.stringify(validDocs))
        console.log(`清理了 ${storedDocs.length - validDocs.length} 个无效的文档记录`)
      }
      
    } catch (error) {
      console.error('加载文档失败:', error)
      toast({
        title: "加载失败",
        description: "无法加载文档列表",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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

  // 组件挂载时加载文档
  useEffect(() => {
    // 记录页面访问
    recordUserActivity('visit', { page: 'documents' })
    loadDocuments()
  }, [])

  // 查看文档
  const handleViewDocument = (doc: any) => {
    try {
      // 记录查看行为
      recordUserActivity('view', { 
        documentId: doc.id, 
        documentName: doc.name,
        timestamp: new Date().toISOString()
      })

      // 增加查看次数
      const storedDocs = JSON.parse(localStorage.getItem('documents') || '[]')
      const updatedDocs = storedDocs.map((d: any) => 
        d.id === doc.originalData.id ? { ...d, views: (d.views || 0) + 1 } : d
      )
      localStorage.setItem('documents', JSON.stringify(updatedDocs))
      
      // 刷新列表
      loadDocuments()
      
      // 这里可以添加文档预览逻辑
      toast({
        title: "查看文档",
        description: `正在查看 "${doc.name}"`,
      })
    } catch (error) {
      toast({
        title: "查看失败",
        description: "无法查看文档",
        variant: "destructive",
      })
    }
  }

  // 下载文档
  const handleDownloadDocument = async (doc: any) => {
    try {
      if (!doc.files || doc.files.length === 0) {
        toast({
          title: "下载失败",
          description: "文档文件不存在",
          variant: "destructive",
        })
        return
      }

      const file = doc.files[0]
      console.log('开始下载文档:', doc.name, '文件:', file)
      
      // 记录下载行为
      recordUserActivity('download', { 
        documentId: doc.id, 
        documentName: doc.name,
        fileName: file.name,
        fileSize: file.size,
        timestamp: new Date().toISOString()
      })

      // 首先尝试从后端下载（如果文件有filename属性，说明是后端存储的文件）
      if (file.filename) {
        console.log('尝试从后端下载文件:', file.filename)
        try {
          const backendModule = await import('@/lib/backendStorage')
          const result = await backendModule.backendStorageService.downloadFile(file.filename)
          
          if (result.success && result.blob) {
            console.log('后端下载成功')
            const url = URL.createObjectURL(result.blob)
            const a = document.createElement('a')
            a.href = url
            a.download = file.originalName || file.name
            a.style.display = 'none'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            
            toast({
              title: "下载成功",
              description: `文件 "${file.originalName || file.name}" 已开始下载`,
            })
            return
          } else {
            console.warn('后端下载失败:', result.message)
          }
        } catch (backendError) {
          console.warn('后端下载异常:', backendError)
        }
      }


      // 如果所有下载方式都失败
      toast({
        title: "下载失败",
        description: "文件不存在或已损坏，请重新上传文件",
        variant: "destructive",
      })
    } catch (error) {
      console.error('下载错误:', error)
      toast({
        title: "下载失败",
        description: `下载文件时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
        variant: "destructive",
      })
    }
  }

  // 收藏/取消收藏文档
  const handleToggleStarred = (doc: any) => {
    try {
      const storedDocs = JSON.parse(localStorage.getItem('documents') || '[]')
      const updatedDocs = storedDocs.map((d: any) => 
        d.id === doc.originalData.id ? { ...d, starred: !d.starred } : d
      )
      localStorage.setItem('documents', JSON.stringify(updatedDocs))
      
      // 刷新列表
      loadDocuments()
      
      toast({
        title: doc.starred ? "取消收藏" : "收藏成功",
        description: `文档 "${doc.name}" ${doc.starred ? '已取消收藏' : '已收藏'}`,
      })
    } catch (error) {
      toast({
        title: "操作失败",
        description: "收藏操作失败",
        variant: "destructive",
      })
    }
  }

  const handleMoveFile = (fileId: string, fileName: string, currentFolderId?: string) => {
    setMoveFileDialog({
      open: true,
      fileId,
      fileName,
      currentFolderId
    })
  }

  const handleMoveComplete = () => {
    // 刷新文档列表
    loadDocuments()
    toast({
      title: "移动成功",
      description: "文件已成功移动",
    })
  }

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    try {
      // 从localStorage删除文档
      const storedDocs = JSON.parse(localStorage.getItem('documents') || '[]')
      const docToDelete = storedDocs.find((doc: any) => doc.id.toString() === fileId)
      const updatedDocs = storedDocs.filter((doc: any) => doc.id.toString() !== fileId)
      localStorage.setItem('documents', JSON.stringify(updatedDocs))
      
      // 如果是后端存储的文件，尝试从后端删除
      if (docToDelete && docToDelete.files) {
        for (const file of docToDelete.files) {
          if (file.filename) {
            try {
              const backendModule = await import('@/lib/backendStorage')
              await backendModule.backendStorageService.deleteFile(file.filename)
              console.log(`后端文件已删除: ${file.filename}`)
            } catch (error) {
              console.warn(`后端文件删除失败: ${file.filename}`, error)
            }
          }
        }
      }
      
      // 刷新文档列表
      loadDocuments()
      
      toast({
        title: "删除成功",
        description: `文件 "${fileName}" 已删除`,
      })
    } catch (error) {
      toast({
        title: "删除失败",
        description: "删除文件时发生错误",
        variant: "destructive",
      })
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">文档管理</h1>
          <p className="text-gray-600 mt-1">管理和组织您的所有文档</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              上传文档
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DocumentUpload 
              onUploadComplete={() => {
                setIsUploadDialogOpen(false)
                // 刷新文档列表
                loadDocuments()
                toast({
                  title: "上传完成",
                  description: "文档已成功上传，列表已更新",
                })
              }}
              onClose={() => setIsUploadDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="搜索文档..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">加载文档中...</p>
          </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">还没有文档</h3>
          <p className="text-gray-500 mb-4">开始上传您的第一个文档</p>
          <Button 
            onClick={() => setIsUploadDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            上传文档
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Link 
                    to={`/documents/${doc.id}`}
                    onClick={() => handleViewDocument(doc)}
                  >
                    <FileText className="h-8 w-8 text-blue-600 cursor-pointer hover:text-blue-700 transition-colors" />
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/documents/${doc.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          查看
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                        <Download className="mr-2 h-4 w-4" />
                        下载
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStarred(doc)}>
                        <Star className="mr-2 h-4 w-4" />
                        {doc.starred ? '取消收藏' : '收藏'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleMoveFile(doc.id.toString(), doc.name)}>
                        <FolderOpen className="mr-2 h-4 w-4" />
                        移动到文件夹
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              您确定要删除文件 "{doc.name}" 吗？此操作无法撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteFile(doc.id.toString(), doc.name)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-sm font-medium line-clamp-2">
                  <Link 
                    to={`/documents/${doc.id}`}
                    className="hover:text-blue-600 transition-colors cursor-pointer"
                    onClick={() => handleViewDocument(doc)}
                  >
                    {doc.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <Badge variant="secondary">{doc.type}</Badge>
                    <span>{doc.size}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>by {doc.author}</span>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{doc.views}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{doc.modified}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <Link 
                      to={`/documents/${doc.id}`}
                      onClick={() => handleViewDocument(doc)}
                    >
                      <FileText className="h-8 w-8 text-blue-600 cursor-pointer hover:text-blue-700 transition-colors" />
                    </Link>
                    <div>
                      <Link 
                        to={`/documents/${doc.id}`}
                        className="hover:text-blue-600 transition-colors"
                        onClick={() => handleViewDocument(doc)}
                      >
                        <h3 className="font-medium text-gray-900 cursor-pointer">{doc.name}</h3>
                      </Link>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Badge variant="secondary">{doc.type}</Badge>
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>by {doc.author}</span>
                        <span>•</span>
                        <span>{doc.modified}</span>
                        <span>•</span>
                        <div className="flex items-center space-x-1 text-blue-600">
                          <FolderOpen className="h-3 w-3" />
                          <span>{doc.folderName}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {doc.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Eye className="h-4 w-4" />
                      <span>{doc.views}</span>
                    </div>
                    {doc.starred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/documents/${doc.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            查看
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                          <Download className="mr-2 h-4 w-4" />
                          下载
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStarred(doc)}>
                          <Star className="mr-2 h-4 w-4" />
                          {doc.starred ? '取消收藏' : '收藏'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMoveFile(doc.id.toString(), doc.name, doc.folderId)}>
                          <FolderOpen className="mr-2 h-4 w-4" />
                          移动到文件夹
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除</AlertDialogTitle>
                              <AlertDialogDescription>
                                您确定要删除文件 "{doc.name}" 吗？此操作无法撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteFile(doc.id.toString(), doc.name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 文件移动对话框 */}
      <FileMoveDialog
        isOpen={moveFileDialog.open}
        onClose={() => setMoveFileDialog(prev => ({ ...prev, open: false }))}
        fileId={moveFileDialog.fileId}
        fileName={moveFileDialog.fileName}
        currentFolderId={moveFileDialog.currentFolderId}
        onMoveComplete={handleMoveComplete}
      />
    </div>
  )
}