import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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
import { 
  FileText,
  Upload,
  Search,
  Grid,
  List,
  MoreVertical,
  Download,
  Trash2,
  Eye,
  Calendar,
  User,
  Move,
  Filter,
  SortAsc,
  SortDesc,
  Folder,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  Archive,
  Star
} from 'lucide-react'
import DocumentUpload from '@/components/DocumentUpload'
import { useToast } from '@/hooks/use-toast'
import { FileViewCounter } from '@/components/FileViewCounter'
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

export default function EnhancedDocumentsPage() {
  // 用户活动日志
  const logger = useUserActivityLogger()
  
  // 文件夹状态
  const [folders, setFolders] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'author'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterType, setFilterType] = useState<string>('all')
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  const [filesToMove, setFilesToMove] = useState<string[]>([])
  const [targetFolder, setTargetFolder] = useState('')
  const [favoriteFiles, setFavoriteFiles] = useState<string[]>([])
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderParentId, setNewFolderParentId] = useState('root')
  
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const initializeData = async () => {
      await fetchFolders()
      await fetchDocuments()
      loadFavorites()
    }
    initializeData()
  }, [])

  // 获取文件夹列表
  const fetchFolders = async () => {
    try {
      const response = await fetch(`${API_FOLDERS}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          // 确保文件夹数据格式正确
          const folderList = data.data.map((folder: any) => ({
            id: folder.id,
            name: folder.name,
            path: folder.path || `/${folder.name}`,
            parentId: folder.parentId,
            createdAt: folder.createdAt,
            updatedAt: folder.updatedAt
          }))
          setFolders(folderList)
        }
      }
    } catch (error) {
      console.error('获取文件夹列表失败:', error)
      toast({
        title: "获取文件夹列表失败",
        description: "请检查网络连接或稍后重试",
        variant: "destructive",
      })
    }
  }

  // 加载收藏列表
  const loadFavorites = () => {
    try {
      const favorites = JSON.parse(localStorage.getItem('favoriteFiles') || '[]')
      setFavoriteFiles(favorites)
    } catch (error) {
      console.error('加载收藏列表失败:', error)
    }
  }

  // 切换收藏状态
  const toggleFavorite = (filename: string, originalName: string) => {
    try {
      let newFavorites = [...favoriteFiles]
      const favoriteData = {
        filename,
        originalName,
        addedAt: new Date().toISOString()
      }
      
      if (favoriteFiles.includes(filename)) {
        // 取消收藏
        newFavorites = newFavorites.filter(f => f !== filename)
        // 同时从收藏详情中移除
        const favoriteDetails = JSON.parse(localStorage.getItem('favoriteDetails') || '{}')
        delete favoriteDetails[filename]
        localStorage.setItem('favoriteDetails', JSON.stringify(favoriteDetails))
        
        toast({
          title: "取消收藏",
          description: `已取消收藏 "${originalName}"`,
        })
      } else {
        // 添加收藏
        newFavorites.push(filename)
        // 同时保存收藏详情到另一个key
        const favoriteDetails = JSON.parse(localStorage.getItem('favoriteDetails') || '{}')
        favoriteDetails[filename] = favoriteData
        localStorage.setItem('favoriteDetails', JSON.stringify(favoriteDetails))
        
        toast({
          title: "添加收藏",
          description: `已收藏 "${originalName}"`,
        })
      }
      
      setFavoriteFiles(newFavorites)
      localStorage.setItem('favoriteFiles', JSON.stringify(newFavorites))
    } catch (error) {
      console.error('切换收藏状态失败:', error)
      toast({
        title: "操作失败",
        description: "收藏操作失败，请稍后重试",
        variant: "destructive",
      })
    }
  }

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_FILES}/list`)
      if (response.ok) {
        const data = await response.json()
        // 预先构建文件夹映射，避免依赖异步的 state
        let folderMap = new Map<string, any>()
        try {
          const fr = await fetch(`${API_FOLDERS}`)
          if (fr.ok) {
            const fd = await fr.json()
            const list = (fd?.data || []).map((f: any) => ({
              id: f.id,
              name: f.name,
              path: f.path || `/${f.name}`
            }))
            for (const f of list) folderMap.set(f.id, f)
          }
        } catch (e) {
          console.error('加载文件夹映射失败:', e)
        }
        // 增强文档数据，添加作者、文件夹等信息
        const enhancedFiles = await Promise.all((data.data?.files || []).map(async (file: any) => {
          // 获取文件的文件夹归属信息
          let fileFolderId = 'root'
          let fileFolder = { id: 'root', name: '根目录' }
          
          try {
            const folderResponse = await fetch(`${API_FILES}/folder/${encodeURIComponent(file.name)}`)
            if (folderResponse.ok) {
              const folderData = await folderResponse.json()
              if (folderData.success) {
                fileFolderId = folderData.data.folderId
                // 找到对应的文件夹对象
                fileFolder = folderMap.get(fileFolderId) || { id: 'root', name: '根目录' }
              }
            }
          } catch (error) {
            console.error('获取文件文件夹信息失败:', error)
          }
          
          // 提取原始文件名
          let originalName = file.name
          const parts = file.name.split('_')
          if (parts.length >= 3 && /^\d+$/.test(parts[0]) && /^[0-9a-fA-F-]{6,}$/.test(parts[1])) {
            // 去掉时间戳和UUID前缀 (格式: timestamp_uuid_originalname)
            originalName = parts.slice(2).join('_')
          } else if (parts.length >= 2 && /^[0-9a-fA-F-]{6,}$/.test(parts[0])) {
            // 去掉单段UUID前缀 (格式: uuid_originalname)
            originalName = parts.slice(1).join('_')
          }
          
          return {
            ...file,
            originalName: originalName,
            author: file.author || '系统管理员',
            folder: fileFolder,
            folderId: fileFolderId,
            tags: [], // 标签
            description: '', // 描述
            uploadTime: file.created || file.modified || new Date().toISOString()
          }
        }))
        setDocuments(enhancedFiles)
        console.log('文档列表已更新，包含文件夹归属信息')
      }
    } catch (error) {
      console.error('获取文档列表失败:', error)
      toast({
        title: "获取文档列表失败",
        description: "请检查网络连接或稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadSuccess = () => {
    setIsUploadDialogOpen(false)
    fetchDocuments()
    logger.logActivity({
      action: 'file_upload',
      resource: 'multiple_files',
      details: { uploadTime: new Date().toISOString() }
    })
    toast({
      title: "上传成功",
      description: "文件已成功上传到系统",
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
        fetchDocuments()
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
      for (const filename of selectedFiles) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
        await fetch(`${API_FILES}/delete/${filename}`, {
          method: 'DELETE',
          headers: {
            'X-User-Id': currentUser.id ? String(currentUser.id) : '',
            'X-User-Role': currentUser.role ? String(currentUser.role) : 'user'
          }
        })
      }
      setSelectedFiles([])
      fetchDocuments()
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

  // 创建文件夹
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "文件夹名称不能为空",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`${API_FOLDERS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: newFolderParentId
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "创建成功",
          description: `文件夹 "${newFolderName}" 已创建`,
        })
        setNewFolderName('')
        setNewFolderParentId('root')
        setIsCreateFolderDialogOpen(false)
        // 重新获取文件夹列表
        await fetchFolders()
        // 重新获取文档列表以更新文件夹显示
        await fetchDocuments()
      } else {
        throw new Error(data.message || '创建文件夹失败')
      }
    } catch (error) {
      console.error('创建文件夹失败:', error)
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "创建文件夹时发生错误",
        variant: "destructive",
      })
    }
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
      // 调用后端API移动文件
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
      
      // 重新获取文档列表以反映更改
      fetchDocuments()
      
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

  // 处理单个文件移动
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
      
      // 重新获取文档列表以反映更改
      fetchDocuments()
    } catch (error) {
      console.error('移动文件失败:', error)
      toast({
        title: "移动失败",
        description: error instanceof Error ? error.message : "移动文件时发生错误",
        variant: "destructive",
      })
    }
  }

  const handleDownloadDocument = (filename: string, originalName?: string) => {
    logger.logFileDownload(filename)
    const url = `${API_FILES}/download/${encodeURIComponent(filename)}${originalName ? `?originalName=${encodeURIComponent(originalName)}` : ''}`
    window.open(url, '_blank')
  }

  const handleViewDocument = (filename: string, originalName?: string) => {
    // 记录用户活动
    logger.logFileView(filename)
    // 增加查看次数
    incrementViewCount(filename)
    // 使用原始文件名作为显示名称，系统文件名作为实际文件标识
    const displayName = originalName || filename
    navigate(`/document-preview?file=${encodeURIComponent(filename)}&displayName=${encodeURIComponent(displayName)}`)
  }

  const incrementViewCount = async (filename: string) => {
    try {
      await fetch(`${API_FILES}/view/${encodeURIComponent(filename)}`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('更新查看次数失败:', error)
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
      setSelectedFiles(filteredAndSortedDocuments.map(doc => doc.name))
    } else {
      setSelectedFiles([])
    }
  }

  // 过滤和排序文档
  const filteredAndSortedDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'all' || doc.name.toLowerCase().endsWith(`.${filterType}`)
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = new Date(a.uploadTime).getTime() - new Date(b.uploadTime).getTime()
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'author':
          comparison = (a.author || '').localeCompare(b.author || '')
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

  return (
    <div className="container mx-auto p-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">文档管理</h1>
          <p className="text-gray-600 mt-1">管理您的文档和文件</p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                上传文档
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>上传文档</DialogTitle>
              </DialogHeader>
              <DocumentUpload onUploadComplete={handleUploadSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex items-center space-x-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="搜索文档..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {/* 文件类型过滤 */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有类型</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="doc">Word</SelectItem>
              <SelectItem value="docx">Word</SelectItem>
              <SelectItem value="xls">Excel</SelectItem>
              <SelectItem value="xlsx">Excel</SelectItem>
              <SelectItem value="ppt">PowerPoint</SelectItem>
              <SelectItem value="jpg">图片</SelectItem>
              <SelectItem value="png">图片</SelectItem>
            </SelectContent>
          </Select>

          {/* 排序选择 */}
          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
            const [field, order] = value.split('-')
            setSortBy(field as any)
            setSortOrder(order as any)
          }}>
            <SelectTrigger className="w-40">
              {sortOrder === 'asc' ? <SortAsc className="mr-2 h-4 w-4" /> : <SortDesc className="mr-2 h-4 w-4" />}
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">最新优先</SelectItem>
              <SelectItem value="date-asc">最旧优先</SelectItem>
              <SelectItem value="name-asc">名称 A-Z</SelectItem>
              <SelectItem value="name-desc">名称 Z-A</SelectItem>
              <SelectItem value="size-desc">大小降序</SelectItem>
              <SelectItem value="size-asc">大小升序</SelectItem>
              <SelectItem value="author-asc">作者 A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          {/* 批量操作 */}
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

          {/* 视图切换 */}
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 文档列表 */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      ) : (
        <>
          {/* 批量选择头部 */}
          {filteredAndSortedDocuments.length > 0 && (
            <div className="flex items-center space-x-2 mb-4 p-3 bg-gray-50 rounded-lg">
              <Checkbox
                checked={selectedFiles.length === filteredAndSortedDocuments.length}
                onCheckedChange={handleSelectAll}
              />
              <Label className="text-sm">
                全选 ({selectedFiles.length}/{filteredAndSortedDocuments.length})
              </Label>
            </div>
          )}

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSortedDocuments.map((doc) => (
                <Card key={doc.name} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <Checkbox
                          checked={selectedFiles.includes(doc.name)}
                          onCheckedChange={(checked) => handleSelectFile(doc.name, checked as boolean)}
                        />
                        {getFileIcon(doc.name)}
                        <CardTitle 
                          className="text-sm truncate cursor-pointer hover:text-blue-600 transition-colors"
                          title={doc.originalName || doc.name}
                          onClick={() => handleViewDocument(doc.name, doc.originalName)}
                        >
                          {doc.originalName || doc.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center space-x-1">
                        {/* 收藏按钮 */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(doc.name, doc.originalName || doc.name)}
                          className="p-1 h-auto"
                        >
                          <Star 
                            className={`h-4 w-4 ${favoriteFiles.includes(doc.name) 
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
                            <DropdownMenuItem onClick={() => handleViewDocument(doc.name, doc.originalName)}>
                              <Eye className="mr-2 h-4 w-4" />
                              预览
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleFavorite(doc.name, doc.originalName || doc.name)}>
                              <Star className="mr-2 h-4 w-4" />
                              {favoriteFiles.includes(doc.name) ? '取消收藏' : '收藏'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadDocument(doc.name, doc.originalName)}>
                              <Download className="mr-2 h-4 w-4" />
                              下载
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <Move className="mr-2 h-4 w-4" />
                                移动到
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {folders.map(folder => (
                                  <DropdownMenuItem 
                                    key={folder.id}
                                    onClick={() => handleSingleFileMove(doc.name, folder.id, folder.name)}
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
                                setFileToDelete(doc.name)
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
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-gray-600">
                        <User className="mr-1 h-3 w-3" />
                        {doc.author}
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <Calendar className="mr-1 h-3 w-3" />
                        {formatDate(doc.uploadTime)}
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <FileText className="mr-1 h-3 w-3" />
                        {formatFileSize(doc.size)}
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <Folder className="mr-1 h-3 w-3" />
                        {doc.folder?.name || '根目录'}
                      </div>
                      {favoriteFiles.includes(doc.name) && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="mr-1 h-3 w-3" />
                          已收藏
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAndSortedDocuments.map((doc) => (
                <Card key={doc.name} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <Checkbox
                          checked={selectedFiles.includes(doc.name)}
                          onCheckedChange={(checked) => handleSelectFile(doc.name, checked as boolean)}
                        />
                        {getFileIcon(doc.name)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 
                              className="font-medium truncate cursor-pointer hover:text-blue-600 transition-colors" 
                              title={doc.originalName || doc.name}
                              onClick={() => handleViewDocument(doc.name, doc.originalName)}
                            >
                              {doc.originalName || doc.name}
                            </h3>
                            {favoriteFiles.includes(doc.name) && (
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center">
                              <User className="mr-1 h-3 w-3" />
                              {doc.author}
                            </span>
                            <span className="flex items-center">
                              <Folder className="mr-1 h-3 w-3" />
                              {doc.folder?.name || '根目录'}
                            </span>
                            <FileViewCounter filename={doc.name} className="flex items-center" />
                            <span>{formatFileSize(doc.size)}</span>
                            <span>{formatDate(doc.uploadTime)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {/* 收藏按钮 */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(doc.name, doc.originalName || doc.name)}
                          className="p-2"
                        >
                          <Star 
                            className={`h-4 w-4 ${favoriteFiles.includes(doc.name) 
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
                            <DropdownMenuItem onClick={() => handleViewDocument(doc.name, doc.originalName)}>
                              <Eye className="mr-2 h-4 w-4" />
                              预览
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleFavorite(doc.name, doc.originalName || doc.name)}>
                              <Star className="mr-2 h-4 w-4" />
                              {favoriteFiles.includes(doc.name) ? '取消收藏' : '收藏'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadDocument(doc.name, doc.originalName)}>
                              <Download className="mr-2 h-4 w-4" />
                              下载
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <Move className="mr-2 h-4 w-4" />
                                移动到
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {folders.map(folder => (
                                  <DropdownMenuItem 
                                    key={folder.id}
                                    onClick={() => handleSingleFileMove(doc.name, folder.id, folder.name)}
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
                                setFileToDelete(doc.name)
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
          )}

          {filteredAndSortedDocuments.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无文档</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? '没有找到匹配的文档' : '开始上传您的第一个文档'}
              </p>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                上传文档
              </Button>
            </div>
          )}
        </>
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
                <SelectItem value="root">根目录</SelectItem>
                {folders.filter(folder => folder.id !== 'root').map(folder => (
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
