import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft,
  Search, 
  FileText,
  Download,
  Eye,
  MoreVertical,
  Upload,
  FolderOpen,
  Star,
  Move,
  Trash2,
  Folder,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  Archive
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import DocumentUpload from '@/components/DocumentUpload'
import { useUserActivityLogger } from '@/components/UserActivityLogger'
import { API_FILES, API_FOLDERS } from '@/lib/apiBase'

// 文件类型图标映射
const getFileIcon = (filename: string, size = 'h-8 w-8') => {
  const ext = filename.split('.').pop()?.toLowerCase()
  const iconClass = `${size} text-blue-500`
  
  switch (ext) {
    case 'pdf':
      return <FileText className={iconClass} style={{ color: '#dc2626' }} />
    case 'doc':
    case 'docx':
      return <FileText className={iconClass} style={{ color: '#2563eb' }} />
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet className={iconClass} style={{ color: '#16a34a' }} />
    case 'ppt':
    case 'pptx':
      return <FileText className={iconClass} style={{ color: '#ea580c' }} />
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
      return <FileImage className={iconClass} style={{ color: '#7c3aed' }} />
    case 'mp4':
    case 'avi':
    case 'mov':
      return <FileVideo className={iconClass} style={{ color: '#dc2626' }} />
    case 'mp3':
    case 'wav':
    case 'flac':
      return <FileAudio className={iconClass} style={{ color: '#059669' }} />
    case 'zip':
    case 'rar':
    case '7z':
      return <Archive className={iconClass} style={{ color: '#6b7280' }} />
    default:
      return <FileText className={iconClass} />
  }
}

interface DocumentItem {
  id: string
  name: string
  originalName: string
  type: string
  size: number
  uploadDate: string
  lastModified: string
  tags: string[]
  filename: string
  folderId: string
}

export default function FolderDetailPage() {
  const { folderId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const logger = useUserActivityLogger()
  
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [favoriteFiles, setFavoriteFiles] = useState<string[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  const [filesToMove, setFilesToMove] = useState<string[]>([])
  const [targetFolder, setTargetFolder] = useState('')
  
  const folderName = location.state?.folderName || '未知文件夹'

  useEffect(() => {
    const initializeData = async () => {
      await fetchFolders()
      await fetchFolderDocuments()
      loadFavorites()
    }
    initializeData()
  }, [folderId])

  // 获取文件夹列表
  const fetchFolders = async () => {
    try {
      const response = await fetch(`${API_FOLDERS}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setFolders(data.data)
        }
      }
    } catch (error) {
      console.error('获取文件夹列表失败:', error)
    }
  }

  // 获取该文件夹的文档
  const fetchFolderDocuments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_FILES}/list`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.files) {
          // 获取所有文件的文件夹归属信息
          const filesWithFolders = await Promise.all(
            data.data.files.map(async (file: any) => {
              try {
                const folderResponse = await fetch(`${API_FILES}/folder/${encodeURIComponent(file.name)}`)
                if (folderResponse.ok) {
                  const folderData = await folderResponse.json()
                  if (folderData.success) {
                    return {
                      ...file,
                      folderId: folderData.data.folderId
                    }
                  }
                }
                return {
                  ...file,
                  folderId: 'root'
                }
              } catch (error) {
                console.error('获取文件文件夹信息失败:', error)
                return {
                  ...file,
                  folderId: 'root'
                }
              }
            })
          )

          // 筛选属于当前文件夹的文档
          const folderFiles = filesWithFolders.filter((file: any) => file.folderId === folderId)
          
          // 格式化文档数据
          const formattedDocs: DocumentItem[] = folderFiles.map((file: any) => ({
            id: file.name,
            name: file.originalName || file.name,
            originalName: file.originalName || file.name,
            filename: file.name,
            type: getFileType(file.name),
            size: file.size || 0,
            uploadDate: file.created || file.modified || new Date().toISOString(),
            lastModified: file.modified || file.created || new Date().toISOString(),
            tags: [],
            folderId: file.folderId
          }))
          
          setDocuments(formattedDocs)
        }
      }
    } catch (error) {
      console.error('获取文件夹文档失败:', error)
      toast({
        title: "获取文档列表失败",
        description: "请检查网络连接或稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 加载收藏列表 - 每个用户独立收藏
  const loadFavorites = () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      if (currentUser.id) {
        const userFavoriteKey = `favorites_${currentUser.id}`
        const favorites = JSON.parse(localStorage.getItem(userFavoriteKey) || '[]')
        setFavoriteFiles(favorites)
      }
    } catch (error) {
      console.error('加载收藏列表失败:', error)
    }
  }

  // 切换收藏状态 - 每个用户独立收藏
  const toggleFavorite = (filename: string, originalName: string) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      if (!currentUser.id) {
        toast({
          title: "请先登录",
          description: "需要登录后才能收藏文件",
          variant: "destructive",
        })
        return
      }

      const userFavoriteKey = `favorites_${currentUser.id}`
      let newFavorites = [...favoriteFiles]
      
      if (favoriteFiles.includes(filename)) {
        newFavorites = newFavorites.filter(f => f !== filename)
        toast({
          title: "取消收藏",
          description: `已取消收藏 "${originalName}"`,
        })
      } else {
        newFavorites.push(filename)
        toast({
          title: "添加收藏",
          description: `已收藏 "${originalName}"`,
        })
      }
      
      setFavoriteFiles(newFavorites)
      localStorage.setItem(userFavoriteKey, JSON.stringify(newFavorites))
    } catch (error) {
      console.error('切换收藏状态失败:', error)
      toast({
        title: "操作失败",
        description: "收藏操作失败，请稍后重试",
        variant: "destructive",
      })
    }
  }

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
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'Image'
      case 'mp4':
      case 'avi':
      case 'mov': return 'Video'
      case 'mp3':
      case 'wav': return 'Audio'
      default: return 'File'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleViewDocument = (doc: DocumentItem) => {
    logger.logFileView(doc.filename)
    navigate(`/document-preview?file=${encodeURIComponent(doc.filename)}&displayName=${encodeURIComponent(doc.originalName)}&fromFolder=${encodeURIComponent(folderId || '')}&folderName=${encodeURIComponent(folderName)}`)
  }

  const handleDownloadDocument = (filename: string, originalName: string) => {
    logger.logFileDownload(filename)
    window.open(`${API_FILES}/download/${filename}`, '_blank')
    toast({
      title: "下载开始",
      description: `正在下载 "${originalName}"`,
    })
  }

  const handleDeleteDocument = async (filename: string) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      const response = await fetch(`${API_FILES}/delete/${filename}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': currentUser.id ? String(currentUser.id) : '',
          'X-User-Role': currentUser.role ? String(currentUser.role) : 'user'
        }
      })
      if (response.ok) {
        logger.logFileDelete(filename)
        fetchFolderDocuments()
        toast({
          title: "删除成功",
          description: `文件 "${filename}" 已被删除`,
        })
      } else {
        throw new Error('删除失败')
      }
    } catch (error) {
      console.error('删除文档失败:', error)
      toast({
        title: "删除失败",
        description: "无法删除文件，请稍后重试",
        variant: "destructive",
      })
    }
  }

  const handleBatchDelete = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      for (const filename of selectedFiles) {
        await fetch(`${API_FILES}/delete/${filename}`, {
          method: 'DELETE',
          headers: {
            'X-User-Id': currentUser.id ? String(currentUser.id) : '',
            'X-User-Role': currentUser.role ? String(currentUser.role) : 'user'
          }
        })
      }
      setSelectedFiles([])
      fetchFolderDocuments()
      toast({
        title: "批量删除成功",
        description: `已删除 ${selectedFiles.length} 个文件`,
      })
    } catch (error) {
      console.error('批量删除失败:', error)
      toast({
        title: "批量删除失败",
        description: "部分文件删除失败，请稍后重试",
        variant: "destructive",
      })
    }
    setIsDeleteDialogOpen(false)
  }

  const handleMoveFiles = async () => {
    if (!targetFolder) {
      toast({
        title: "请选择目标文件夹",
        variant: "destructive",
      })
      return
    }
    
    try {
      for (const filename of filesToMove) {
        const response = await fetch(`${API_FILES}/move/${encodeURIComponent(filename)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            folderId: targetFolder
          })
        })
        
        if (!response.ok) {
          throw new Error(`移动文件 ${filename} 失败`)
        }
      }
      
      const targetFolderObj = folders.find(f => f.id === targetFolder)
      toast({
        title: "移动成功",
        description: `已将 ${filesToMove.length} 个文件移动到 "${targetFolderObj?.name}"`,
      })
      
      fetchFolderDocuments()
      
      setFilesToMove([])
      setSelectedFiles([])
      setIsMoveDialogOpen(false)
      setTargetFolder('')
    } catch (error) {
      console.error('移动文件失败:', error)
      toast({
        title: "移动失败",
        description: error instanceof Error ? error.message : "移动文件时发生错误",
        variant: "destructive",
      })
    }
  }

  const handleSingleFileMove = async (filename: string, folderId: string, folderName: string) => {
    try {
      const response = await fetch(`${API_FILES}/move/${encodeURIComponent(filename)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId: folderId
        })
      })
      
      if (!response.ok) {
        throw new Error(`移动文件失败`)
      }
      
      toast({
        title: "移动成功",
        description: `文件已移动到 "${folderName}"`,
      })
      
      fetchFolderDocuments()
    } catch (error) {
      console.error('移动文件失败:', error)
      toast({
        title: "移动失败",
        description: error instanceof Error ? error.message : "移动文件时发生错误",
        variant: "destructive",
      })
    }
  }

  const handleSelectFile = (filename: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles([...selectedFiles, filename])
    } else {
      setSelectedFiles(selectedFiles.filter(f => f !== filename))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(filteredDocuments.map(doc => doc.filename))
    } else {
      setSelectedFiles([])
    }
  }

  const handleUploadSuccess = () => {
    setIsUploadDialogOpen(false)
    fetchFolderDocuments()
    toast({
      title: "上传成功",
      description: "文件已成功上传到文件夹",
    })
  }

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和返回按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/folders')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回文件夹
          </Button>
          <div className="flex items-center space-x-2">
            <FolderOpen className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold">{folderName}</h1>
          </div>
        </div>
        
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              上传文档
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>上传文档到 {folderName}</DialogTitle>
            </DialogHeader>
            <DocumentUpload onUploadComplete={handleUploadSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">文档总数</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">总大小</p>
                <p className="text-2xl font-bold">
                  {formatFileSize(documents.reduce((total, doc) => total + doc.size, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">收藏文档</p>
                <p className="text-2xl font-bold">
                  {documents.filter(doc => favoriteFiles.includes(doc.filename)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索栏和批量操作 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="搜索文档..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center space-x-2">
          {selectedFiles.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilesToMove(selectedFiles)
                  setIsMoveDialogOpen(true)
                }}
              >
                <Move className="mr-2 h-4 w-4" />
                移动 ({selectedFiles.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除 ({selectedFiles.length})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 批量选择头部 */}
      {filteredDocuments.length > 0 && (
        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
          <Checkbox
            checked={selectedFiles.length === filteredDocuments.length}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm">
            全选 ({selectedFiles.length}/{filteredDocuments.length})
          </span>
        </div>
      )}

      {/* 文档列表 */}
      <div className="space-y-4">
        {filteredDocuments.map((doc) => (
          <Card key={doc.filename} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <Checkbox
                    checked={selectedFiles.includes(doc.filename)}
                    onCheckedChange={(checked) => handleSelectFile(doc.filename, checked as boolean)}
                  />
                  {getFileIcon(doc.name)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 
                        className="font-medium text-lg truncate cursor-pointer hover:text-blue-600 transition-colors" 
                        title={doc.originalName}
                        onClick={() => handleViewDocument(doc)}
                      >
                        {doc.originalName}
                      </h3>
                      {favoriteFiles.includes(doc.filename) && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span>{doc.type}</span>
                      <span>{formatFileSize(doc.size)}</span>
                      <span>上传于 {formatDate(doc.uploadDate)}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      {doc.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(doc.filename, doc.originalName)}
                    className="p-2"
                  >
                    <Star 
                      className={`h-4 w-4 ${favoriteFiles.includes(doc.filename) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-400 hover:text-yellow-400'
                      }`} 
                    />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                        <Eye className="mr-2 h-4 w-4" />
                        预览
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleFavorite(doc.filename, doc.originalName)}>
                        <Star className="mr-2 h-4 w-4" />
                        {favoriteFiles.includes(doc.filename) ? '取消收藏' : '收藏'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadDocument(doc.filename, doc.originalName)}>
                        <Download className="mr-2 h-4 w-4" />
                        下载
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Move className="mr-2 h-4 w-4" />
                          移动到
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {folders.filter(folder => folder.id !== folderId).map(folder => (
                            <DropdownMenuItem 
                              key={folder.id}
                              onClick={() => handleSingleFileMove(doc.filename, folder.id, folder.name)}
                            >
                              <Folder className="mr-2 h-4 w-4" />
                              {folder.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => {
                          setFileToDelete(doc.filename)
                          setIsDeleteDialogOpen(true)
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 空状态 */}
      {filteredDocuments.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            未找到匹配的文档
          </h3>
          <p className="text-gray-600">
            尝试使用不同的关键词搜索
          </p>
        </div>
      )}

      {filteredDocuments.length === 0 && !searchTerm && (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            文件夹为空
          </h3>
          <p className="text-gray-600 mb-4">
            这个文件夹还没有任何文档
          </p>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsUploadDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            上传第一个文档
          </Button>
        </div>
      )}

      {/* 移动文件对话框 */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>移动文件</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>选择目标文件夹：</p>
            <Select value={targetFolder} onValueChange={setTargetFolder}>
              <SelectTrigger>
                <SelectValue placeholder="选择文件夹" />
              </SelectTrigger>
              <SelectContent>
                {folders.filter(folder => folder.id !== folderId).map(folder => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleMoveFiles}>
                移动
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {fileToDelete 
                ? `确定要删除文件 "${fileToDelete}" 吗？此操作无法撤销。`
                : `确定要删除选中的 ${selectedFiles.length} 个文件吗？此操作无法撤销。`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setFileToDelete(null)
              setIsDeleteDialogOpen(false)
            }}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (fileToDelete) {
                  handleDeleteDocument(fileToDelete)
                  setFileToDelete(null)
                } else {
                  handleBatchDelete()
                }
                setIsDeleteDialogOpen(false)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
