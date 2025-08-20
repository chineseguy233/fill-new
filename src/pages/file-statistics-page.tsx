import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Eye, 
  Download, 
  FileText, 
  Search, 
  TrendingUp, 
  Calendar,
  User,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { backendStorageService } from '@/lib/backendStorage'
import { useToast } from '@/hooks/use-toast'

interface FileStatistic {
  filename: string
  originalName: string
  viewCount: number
  size: number
  uploader: string
  uploadTime: string
  lastViewed?: string
}

export default function FileStatisticsPage() {
  const [files, setFiles] = useState<FileStatistic[]>([])
  const [filteredFiles, setFilteredFiles] = useState<FileStatistic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'viewCount' | 'uploadTime' | 'size'>('viewCount')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [totalViews, setTotalViews] = useState(0)
  const [mostViewedFile, setMostViewedFile] = useState<FileStatistic | null>(null)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchFileStatistics()
  }, [])

  useEffect(() => {
    filterAndSortFiles()
  }, [files, searchTerm, sortBy, sortOrder])

  const fetchFileStatistics = async () => {
    try {
      setIsLoading(true)
      
      // 获取文件列表
      const fileListResult = await backendStorageService.getFileList()
      if (!fileListResult.success) {
        throw new Error(fileListResult.message || '获取文件列表失败')
      }

      const fileList = fileListResult.data?.files || []
      const statisticsPromises = fileList.map(async (file: any) => {
        try {
          // 获取每个文件的查看次数
          const viewResult = await backendStorageService.getFileViewCount(file.name)
          return {
            filename: file.name,
            originalName: file.originalName || file.name,
            viewCount: viewResult.success ? (viewResult.data?.viewCount || 0) : 0,
            size: file.size,
            uploader: file.uploader || '系统管理员',
            uploadTime: file.created || file.modified || new Date().toISOString(),
            lastViewed: undefined // 这里可以扩展为记录最后查看时间
          }
        } catch (error) {
          console.error(`获取文件 ${file.name} 统计失败:`, error)
          return {
            filename: file.name,
            originalName: file.originalName || file.name,
            viewCount: 0,
            size: file.size,
            uploader: file.uploader || '系统管理员',
            uploadTime: file.created || file.modified || new Date().toISOString(),
            lastViewed: undefined
          }
        }
      })

      const statistics = await Promise.all(statisticsPromises)
      setFiles(statistics)

      // 计算总查看次数
      const total = statistics.reduce((sum, file) => sum + file.viewCount, 0)
      setTotalViews(total)

      // 找到查看次数最多的文件
      const mostViewed = statistics.reduce((max, file) => 
        file.viewCount > (max?.viewCount || 0) ? file : max, null as FileStatistic | null)
      setMostViewedFile(mostViewed)

    } catch (error) {
      console.error('获取文件统计失败:', error)
      toast({
        title: "获取文件统计失败",
        description: error instanceof Error ? error.message : "请检查网络连接或稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortFiles = () => {
    let filtered = files.filter(file =>
      file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.uploader.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // 排序
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'viewCount':
          comparison = a.viewCount - b.viewCount
          break
        case 'uploadTime':
          comparison = new Date(a.uploadTime).getTime() - new Date(b.uploadTime).getTime()
          break
        case 'size':
          comparison = a.size - b.size
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredFiles(filtered)
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

  const handleRefresh = () => {
    fetchFileStatistics()
    toast({
      title: "刷新成功",
      description: "文件统计数据已更新",
    })
  }

  return (
    <div className="container mx-auto p-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">文件统计</h1>
          <p className="text-gray-600 mt-1">查看文件访问统计和使用情况</p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          刷新数据
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总文件数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{files.length}</div>
            <p className="text-xs text-muted-foreground">
              系统中的文件总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总查看次数</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">
              所有文件的查看次数总和
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最受欢迎文件</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mostViewedFile ? mostViewedFile.viewCount : 0}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {mostViewedFile ? mostViewedFile.originalName : '暂无数据'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和排序工具栏 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="搜索文件或上传者..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
            const [field, order] = value.split('-')
            setSortBy(field as any)
            setSortOrder(order as any)
          }}>
            <SelectTrigger className="w-48">
              <BarChart3 className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewCount-desc">查看次数 (高到低)</SelectItem>
              <SelectItem value="viewCount-asc">查看次数 (低到高)</SelectItem>
              <SelectItem value="uploadTime-desc">上传时间 (新到旧)</SelectItem>
              <SelectItem value="uploadTime-asc">上传时间 (旧到新)</SelectItem>
              <SelectItem value="size-desc">文件大小 (大到小)</SelectItem>
              <SelectItem value="size-asc">文件大小 (小到大)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 文件统计表格 */}
      <Card>
        <CardHeader>
          <CardTitle>文件访问统计</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>文件名</TableHead>
                    <TableHead>查看次数</TableHead>
                    <TableHead>文件大小</TableHead>
                    <TableHead>上传者</TableHead>
                    <TableHead>上传时间</TableHead>
                    <TableHead>热度</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.filename}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="font-medium truncate max-w-xs" title={file.originalName}>
                            {file.originalName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold">{file.viewCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatFileSize(file.size)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>{file.uploader}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{formatDate(file.uploadTime)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {file.viewCount === 0 && (
                          <Badge variant="secondary">未查看</Badge>
                        )}
                        {file.viewCount > 0 && file.viewCount <= 5 && (
                          <Badge variant="outline">低</Badge>
                        )}
                        {file.viewCount > 5 && file.viewCount <= 20 && (
                          <Badge variant="default">中</Badge>
                        )}
                        {file.viewCount > 20 && (
                          <Badge variant="destructive">高</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredFiles.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到文件</h3>
                  <p className="text-gray-500">
                    {searchTerm ? `没有找到与"${searchTerm}"匹配的文件` : '暂无文件统计数据'}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}