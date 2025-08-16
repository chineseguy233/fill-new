import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Search, 
  FileText,
  Download,
  Eye,
  MoreVertical,
  Upload,
  FolderOpen
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface DocumentItem {
  id: string
  name: string
  type: string
  size: string
  uploadDate: string
  lastModified: string
  tags: string[]
}

export default function FolderDetailPage() {
  const { folderId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  
  const folderName = location.state?.folderName || '未知文件夹'

  // 从localStorage加载该文件夹的文档数据
  useEffect(() => {
    const loadFolderDocuments = () => {
      try {
        const storedDocs = JSON.parse(localStorage.getItem('documents') || '[]')
        
        // 筛选属于当前文件夹的文档
        const folderDocs = storedDocs.filter((doc: any) => 
          (doc.folderId || 'root') === folderId
        )
        
        // 格式化文档数据
        const formattedDocs: DocumentItem[] = folderDocs.map((doc: any) => ({
          id: doc.id.toString(),
          name: doc.title || doc.files?.[0]?.name || '未命名文档',
          type: doc.files?.[0] ? getFileType(doc.files[0].name) : 'File',
          size: doc.files?.[0] ? formatFileSize(doc.files[0].size) : '0 Bytes',
          uploadDate: new Date(doc.createdAt || Date.now()).toLocaleDateString('zh-CN'),
          lastModified: new Date(doc.createdAt || Date.now()).toLocaleDateString('zh-CN'),
          tags: doc.tags || []
        }))
        
        setDocuments(formattedDocs)
      } catch (error) {
        console.error('加载文件夹文档失败:', error)
        setDocuments([])
      } finally {
        setIsLoading(false)
      }
    }

    if (folderId) {
      loadFolderDocuments()
    }
  }, [folderId])

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


  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleViewDocument = (doc: DocumentItem) => {
    navigate(`/documents/${doc.id}`)
  }

  const handleDownloadDocument = (doc: DocumentItem) => {
    toast({
      title: "下载开始",
      description: `正在下载 "${doc.name}"`,
    })
  }

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
        
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Upload className="h-4 w-4 mr-2" />
          上传文档
        </Button>
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
                <p className="text-2xl font-bold">4.3 MB</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">最近更新</p>
                <p className="text-2xl font-bold">今天</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索栏 */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="搜索文档..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 文档列表 */}
      <div className="space-y-4">
        {filteredDocuments.map((doc) => (
          <Card key={doc.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-lg">{doc.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{doc.type}</span>
                      <span>{doc.size}</span>
                      <span>上传于 {new Date(doc.uploadDate).toLocaleDateString()}</span>
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
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDocument(doc)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    查看
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownloadDocument(doc)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    下载
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
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
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Upload className="h-4 w-4 mr-2" />
            上传第一个文档
          </Button>
        </div>
      )}
    </div>
  )
}