import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search,
  FileText,
  Download,
  Eye,
  MoreVertical,
  Calendar,
  User,
  Filter,
  X,
  Clock,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  Archive
} from 'lucide-react'
import { backendStorageService } from '@/lib/backendStorage'
import { useToast } from '@/hooks/use-toast'

// 文件类型图标映射
const getFileIcon = (filename: string, size = 'h-6 w-6') => {
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

interface SearchResult {
  filename: string
  originalName: string
  size: number
  uploader: string
  uploadTime: string
  viewCount?: number
  folderId?: string
  folderName?: string
}

interface SearchFilters {
  fileType: string
  uploader: string
  dateRange: string
  sizeRange: string
}

export default function FileSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [filters, setFilters] = useState<SearchFilters>({
    fileType: 'all',
    uploader: 'all',
    dateRange: 'all',
    sizeRange: 'all'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [availableUploaders, setAvailableUploaders] = useState<string[]>([])
  
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    // 从localStorage加载搜索历史
    const history = JSON.parse(localStorage.getItem('fileSearchHistory') || '[]')
    setSearchHistory(history)
    
    // 如果URL中有搜索参数，自动执行搜索
    const query = searchParams.get('q')
    if (query) {
      setSearchTerm(query)
      performSearch(query)
    }
  }, [])

  useEffect(() => {
    loadAvailableUploaders()
  }, [])

  const loadAvailableUploaders = async () => {
    try {
      const result = await backendStorageService.getFileList()
      if (result.success && result.data?.files) {
        const uploaders = [...new Set(result.data.files.map((file: any) => file.uploader || '系统管理员'))]
        setAvailableUploaders(uploaders)
      }
    } catch (error) {
      console.error('加载上传者列表失败:', error)
    }
  }

  const performSearch = async (query: string = searchTerm) => {
    if (!query.trim()) {
      toast({
        title: "请输入搜索关键词",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    try {
      // 获取所有文件列表
      const result = await backendStorageService.getFileList()
      if (!result.success) {
        throw new Error(result.message || '获取文件列表失败')
      }

      const allFiles = result.data?.files || []
      
      // 在前端进行搜索过滤
      let filteredFiles = allFiles.filter((file: any) => {
        const searchLower = query.toLowerCase()
        const nameMatch = (file.originalName || file.name).toLowerCase().includes(searchLower)
        const uploaderMatch = (file.uploader || '').toLowerCase().includes(searchLower)
        
        return nameMatch || uploaderMatch
      })

      // 应用过滤器
      filteredFiles = applyFilters(filteredFiles)

      // 获取每个文件的查看次数
      const searchResultsPromises = filteredFiles.map(async (file: any) => {
        try {
          const viewResult = await backendStorageService.getFileViewCount(file.name)
          return {
            filename: file.name,
            originalName: file.originalName || file.name,
            size: file.size,
            uploader: file.uploader || '系统管理员',
            uploadTime: file.created || file.modified || new Date().toISOString(),
            viewCount: viewResult.success ? (viewResult.data?.viewCount || 0) : 0,
            folderId: file.folderId,
            folderName: file.folderName || '根目录'
          }
        } catch (error) {
          return {
            filename: file.name,
            originalName: file.originalName || file.name,
            size: file.size,
            uploader: file.uploader || '系统管理员',
            uploadTime: file.created || file.modified || new Date().toISOString(),
            viewCount: 0,
            folderId: file.folderId,
            folderName: file.folderName || '根目录'
          }
        }
      })

      const searchResults = await Promise.all(searchResultsPromises)
      setSearchResults(searchResults)

      // 保存搜索历史
      saveSearchHistory(query)

      // 更新URL参数
      setSearchParams({ q: query })

    } catch (error) {
      console.error('搜索失败:', error)
      toast({
        title: "搜索失败",
        description: error instanceof Error ? error.message : "请检查网络连接或稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const applyFilters = (files: any[]) => {
    return files.filter(file => {
      // 文件类型过滤
      if (filters.fileType !== 'all') {
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (ext !== filters.fileType) return false
      }

      // 上传者过滤
      if (filters.uploader !== 'all') {
        if ((file.uploader || '系统管理员') !== filters.uploader) return false
      }

      // 日期范围过滤
      if (filters.dateRange !== 'all') {
        const fileDate = new Date(file.created || file.modified)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24))
        
        switch (filters.dateRange) {
          case 'today':
            if (daysDiff > 0) return false
            break
          case 'week':
            if (daysDiff > 7) return false
            break
          case 'month':
            if (daysDiff > 30) return false
            break
          case 'year':
            if (daysDiff > 365) return false
            break
        }
      }

      // 文件大小过滤
      if (filters.sizeRange !== 'all') {
        const sizeInMB = file.size / (1024 * 1024)
        switch (filters.sizeRange) {
          case 'small':
            if (sizeInMB > 1) return false
            break
          case 'medium':
            if (sizeInMB <= 1 || sizeInMB > 10) return false
            break
          case 'large':
            if (sizeInMB <= 10) return false
            break
        }
      }

      return true
    })
  }

  const saveSearchHistory = (query: string) => {
    const history = JSON.parse(localStorage.getItem('fileSearchHistory') || '[]')
    const newHistory = [query, ...history.filter((item: string) => item !== query)].slice(0, 10)
    localStorage.setItem('fileSearchHistory', JSON.stringify(newHistory))
    setSearchHistory(newHistory)
  }

  const clearSearchHistory = () => {
    localStorage.removeItem('fileSearchHistory')
    setSearchHistory([])
    toast({
      title: "搜索历史已清除",
    })
  }

  const handleViewDocument = (filename: string, originalName?: string) => {
    // 记录查看次数
    backendStorageService.recordFileView(filename)
    // 导航到预览页面
    const displayName = originalName || filename
    navigate(`/document-preview?file=${encodeURIComponent(filename)}&displayName=${encodeURIComponent(displayName)}`)
  }

  const handleDownloadDocument = async (filename: string) => {
    try {
      const result = await backendStorageService.downloadFile(filename)
      
      if (result.success && result.blob) {
        const url = URL.createObjectURL(result.blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        toast({
          title: "下载成功",
          description: `文件 "${filename}" 已开始下载`,
        })
      } else {
        throw new Error(result.message || '下载失败')
      }
    } catch (error) {
      console.error('下载文件失败:', error)
      toast({
        title: "下载失败",
        description: "无法下载文件，请稍后重试",
        variant: "destructive",
      })
    }
  }

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">文件搜索</h1>
        <p className="text-gray-600">快速查找您需要的文档和文件</p>
      </div>

      {/* 搜索框 */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="输入文件名、上传者或关键词..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  performSearch()
                }
              }}
              className="pl-10 text-lg h-12"
            />
          </div>
          <Button 
            onClick={() => performSearch()} 
            disabled={isSearching}
            className="h-12 px-8"
          >
            {isSearching ? '搜索中...' : '搜索'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="h-12"
          >
            <Filter className="h-4 w-4 mr-2" />
            过滤器
          </Button>
        </div>

        {/* 搜索历史 */}
        {searchHistory.length > 0 && !hasSearched && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm text-gray-600">搜索历史</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearchHistory}
                className="text-xs"
              >
                清除历史
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((item, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-gray-200"
                  onClick={() => {
                    setSearchTerm(item)
                    performSearch(item)
                  }}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 过滤器面板 */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">搜索过滤器</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">文件类型</Label>
                <Select value={filters.fileType} onValueChange={(value) => setFilters({...filters, fileType: value})}>
                  <SelectTrigger>
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
              </div>

              <div>
                <Label className="text-sm font-medium">上传者</Label>
                <Select value={filters.uploader} onValueChange={(value) => setFilters({...filters, uploader: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有用户</SelectItem>
                    {availableUploaders.map(uploader => (
                      <SelectItem key={uploader} value={uploader}>{uploader}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">上传时间</Label>
                <Select value={filters.dateRange} onValueChange={(value) => setFilters({...filters, dateRange: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">任何时间</SelectItem>
                    <SelectItem value="today">今天</SelectItem>
                    <SelectItem value="week">最近一周</SelectItem>
                    <SelectItem value="month">最近一月</SelectItem>
                    <SelectItem value="year">最近一年</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">文件大小</Label>
                <Select value={filters.sizeRange} onValueChange={(value) => setFilters({...filters, sizeRange: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">任何大小</SelectItem>
                    <SelectItem value="small">小于 1MB</SelectItem>
                    <SelectItem value="medium">1MB - 10MB</SelectItem>
                    <SelectItem value="large">大于 10MB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-4 space-x-2">
              <Button
                variant="outline"
                onClick={() => setFilters({
                  fileType: 'all',
                  uploader: 'all',
                  dateRange: 'all',
                  sizeRange: 'all'
                })}
              >
                重置过滤器
              </Button>
              <Button onClick={() => performSearch()}>
                应用过滤器
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 搜索结果 */}
      {hasSearched && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              搜索结果 ({searchResults.length} 个文件)
            </h2>
            {searchTerm && (
              <Badge variant="outline" className="text-sm">
                关键词: "{searchTerm}"
              </Badge>
            )}
          </div>

          {isSearching ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">搜索中...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((file) => (
                <Card key={file.filename} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <Checkbox
                          checked={selectedFiles.includes(file.filename)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedFiles([...selectedFiles, file.filename])
                            } else {
                              setSelectedFiles(selectedFiles.filter(f => f !== file.filename))
                            }
                          }}
                        />
                        {getFileIcon(file.filename)}
                        <div className="flex-1 min-w-0">
                          <p 
                            className="font-medium truncate cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => handleViewDocument(file.filename, file.originalName)}
                          >
                            {file.originalName}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 space-x-4 mt-1">
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {file.uploader}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(file.uploadTime)}
                            </span>
                            <span>{formatFileSize(file.size)}</span>
                            {file.viewCount !== undefined && (
                              <span className="flex items-center">
                                <Eye className="h-3 w-3 mr-1" />
                                {file.viewCount} 次查看
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDocument(file.filename, file.originalName)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadDocument(file.filename)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDocument(file.filename, file.originalName)}>
                              <Eye className="mr-2 h-4 w-4" />
                              预览
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadDocument(file.filename)}>
                              <Download className="mr-2 h-4 w-4" />
                              下载
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到匹配的文件</h3>
              <p className="text-gray-500 mb-4">
                尝试使用不同的关键词或调整搜索过滤器
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setHasSearched(false)
                  setSearchResults([])
                  setSearchParams({})
                }}
              >
                <X className="mr-2 h-4 w-4" />
                清除搜索
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 未搜索时的提示 */}
      {!hasSearched && (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">开始搜索文件</h3>
          <p className="text-gray-500 mb-6">
            输入文件名、上传者或关键词来查找您需要的文档
          </p>
          <div className="text-sm text-gray-400">
            <p>搜索技巧：</p>
            <ul className="mt-2 space-y-1">
              <li>• 使用文件名的部分内容进行搜索</li>
              <li>• 搜索上传者姓名</li>
              <li>• 使用过滤器缩小搜索范围</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}