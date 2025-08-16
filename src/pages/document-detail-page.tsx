import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { 
  FileText, 
  Download, 
  Star, 
  Share2, 
  Edit,
  ArrowLeft,
  Eye,
  Calendar,
  User,
  MessageSquare,
  Send
} from 'lucide-react'

export default function DocumentDetailPage() {
  const { id } = useParams()
  const [documentData, setDocumentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
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

  // 从localStorage加载文档数据
  useEffect(() => {
    const loadDocument = () => {
      try {
        const storedDocs = JSON.parse(localStorage.getItem('documents') || '[]')
        const document = storedDocs.find((doc: any) => doc.id.toString() === id)
        
        if (document) {
          const formattedDoc = {
            id: document.id,
            name: document.title || document.files?.[0]?.name || '未命名文档',
            type: document.files?.[0] ? getFileType(document.files[0].name) : 'File',
            size: document.files?.[0] ? formatFileSize(document.files[0].size) : '0 Bytes',
            created: new Date(document.createdAt || Date.now()).toLocaleDateString('zh-CN'),
            modified: new Date(document.createdAt || Date.now()).toLocaleDateString('zh-CN'),
            author: document.authorName || '未知用户',
            views: document.views || 0,
            starred: document.starred || false,
            tags: document.tags || [],
            description: document.description || '暂无描述',
            version: '1.0',
            status: '已上传',
            files: document.files || [],
            originalData: document
          }
          setDocumentData(formattedDoc)
        } else {
          setDocumentData(null)
        }
      } catch (error) {
        console.error('加载文档失败:', error)
        setDocumentData(null)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadDocument()
    }
  }, [id])

  const handleAddComment = () => {
    if (newComment.trim()) {
      console.log('添加评论:', newComment)
      setNewComment('')
      toast({
        title: "评论已添加",
        description: "您的评论已成功添加",
      })
    }
  }

  // 下载文档
  const handleDownloadDocument = async () => {
    if (!documentData || !documentData.files || documentData.files.length === 0) {
      toast({
        title: "下载失败",
        description: "文档文件不存在",
        variant: "destructive",
      })
      return
    }

    try {
      const file = documentData.files[0]
      console.log('开始下载文件:', file)
      
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
      
      // 如果后端下载失败，尝试从前端存储下载
      if (file.fileID) {
        console.log('尝试从前端存储下载文件:', file.fileID)
        try {
          const storageModule = await import('@/lib/storage')
          const result = await storageModule.storageService.downloadFile(file.fileID)
          
          if (result.success && result.blob) {
            console.log('前端存储下载成功')
            const url = URL.createObjectURL(result.blob)
            const a = document.createElement('a')
            a.href = url
            a.download = file.name
            a.style.display = 'none'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            
            toast({
              title: "下载成功",
              description: `文件 "${file.name}" 已开始下载`,
            })
            return
          } else {
            console.warn('前端存储下载失败:', result.message)
          }
        } catch (localError) {
          console.warn('前端存储下载异常:', localError)
        }
      }
      
      // 最后尝试从IndexedDB下载
      console.log('尝试从IndexedDB下载文件')
      const request = indexedDB.open('DocumentStorage', 1)
      
      request.onerror = () => {
        toast({
          title: "下载失败",
          description: "无法访问本地存储",
          variant: "destructive",
        })
      }
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // 检查对象存储是否存在
        let storeName = 'files'
        if (db.objectStoreNames.contains('files')) {
          storeName = 'files'
        } else if (db.objectStoreNames.contains('documents')) {
          storeName = 'documents'
        } else {
          toast({
            title: "下载失败",
            description: "文件存储不存在，请重新上传文件",
            variant: "destructive",
          })
          return
        }
        
        const transaction = db.transaction([storeName], 'readonly')
        const store = transaction.objectStore(storeName)
        
        // 尝试使用不同的键来查找文件
        const keys = [file.fileID, file.filename, file.cloudPath, file.name, documentData.id]
        let currentKeyIndex = 0
        
        const tryNextKey = () => {
          if (currentKeyIndex >= keys.length) {
            toast({
              title: "下载失败",
              description: "文件内容不存在，请重新上传文件",
              variant: "destructive",
            })
            return
          }
          
          const key = keys[currentKeyIndex]
          if (!key) {
            currentKeyIndex++
            tryNextKey()
            return
          }
          
          const getRequest = store.get(key)
          
          getRequest.onerror = () => {
            currentKeyIndex++
            tryNextKey()
          }
          
          getRequest.onsuccess = () => {
            const result = getRequest.result
            if (result && (result.content || result.file)) {
              console.log('IndexedDB下载成功')
              const content = result.content || result.file
              const blob = new Blob([content], { type: file.type || 'application/octet-stream' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = file.name
              a.style.display = 'none'
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
              
              toast({
                title: "下载成功",
                description: `文件 "${file.name}" 已开始下载`,
              })
            } else {
              currentKeyIndex++
              tryNextKey()
            }
          }
        }
        
        tryNextKey()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' })
        }
      }
    } catch (error) {
      console.error('下载错误:', error)
      toast({
        title: "下载失败",
        description: `下载文件时发生错误: ${error.message || '未知错误'}`,
        variant: "destructive",
      })
    }
  }

  // 收藏/取消收藏
  const handleToggleStarred = () => {
    if (!documentData) return

    try {
      const storedDocs = JSON.parse(localStorage.getItem('documents') || '[]')
      const updatedDocs = storedDocs.map((d: any) => 
        d.id === documentData.originalData.id ? { ...d, starred: !d.starred } : d
      )
      localStorage.setItem('documents', JSON.stringify(updatedDocs))
      
      // 更新当前显示的数据
      setDocumentData((prev: any) => ({ ...prev, starred: !prev.starred }))
      
      toast({
        title: documentData.starred ? "取消收藏" : "收藏成功",
        description: `文档 "${documentData.name}" ${documentData.starred ? '已取消收藏' : '已收藏'}`,
      })
    } catch (error) {
      toast({
        title: "操作失败",
        description: "收藏操作失败",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">加载文档中...</p>
        </div>
      </div>
    )
  }

  if (!documentData) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">文档不存在</h3>
        <p className="text-gray-500 mb-4">请检查文档ID是否正确</p>
        <Button asChild>
          <Link to="/documents">返回文档列表</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/documents">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回文档列表
          </Link>
        </Button>
      </div>

      {/* Document Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <FileText className="h-12 w-12 text-blue-600" />
              <div>
                <CardTitle className="text-2xl">{documentData.name}</CardTitle>
                <CardDescription className="mt-2">
                  {documentData.description}
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-3">
                  {documentData.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                  <Badge variant="outline">{documentData.status}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleToggleStarred}>
                <Star className={`h-4 w-4 mr-2 ${documentData.starred ? 'fill-current text-yellow-500' : ''}`} />
                {documentData.starred ? '已收藏' : '收藏'}
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                分享
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleDownloadDocument}>
                <Download className="h-4 w-4 mr-2" />
                下载
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>文档预览</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg p-8 text-center min-h-[500px] flex items-center justify-center">
                <div className="text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg font-medium">{documentData.type} 文档预览</p>
                  <p className="text-sm mt-2">点击下载按钮查看完整文档</p>
                  <p className="text-xs mt-1 text-gray-400">文件名: {documentData.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                评论 (0)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-500 text-sm">暂无评论，成为第一个评论的人吧！</p>
              </div>

              <Separator className="my-4" />

              {/* Add Comment */}
              <div className="space-y-3">
                <Textarea
                  placeholder="添加评论..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    发送评论
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document Info Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>文档信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">文件大小</span>
                <span className="text-sm font-medium">{documentData.size}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">文件类型</span>
                <Badge variant="secondary">{documentData.type}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">版本</span>
                <span className="text-sm font-medium">v{documentData.version}</span>
              </div>
              <Separator />
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">{documentData.author}</p>
                  <p className="text-xs text-gray-500">创建者</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">{documentData.created}</p>
                  <p className="text-xs text-gray-500">创建时间</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">{documentData.modified}</p>
                  <p className="text-xs text-gray-500">最后修改</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">{documentData.views} 次</p>
                  <p className="text-xs text-gray-500">查看次数</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>文件信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documentData.files && documentData.files.length > 0 ? (
                  documentData.files.map((file: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                      <FileText className="h-6 w-6 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">无文件信息</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}