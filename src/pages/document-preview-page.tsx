import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { backendStorageService } from '@/lib/backendStorage'
import FilePreviewer from '@/components/FilePreviewers'

export default function DocumentPreviewPage() {
  const { id, filename } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [document, setDocument] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string>('')

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
      case 'txt':
      case 'md': return 'Text'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp': return 'Image'
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv': return 'Video'
      case 'zip':
      case 'rar': return 'Archive'
      default: return 'File'
    }
  }

  // 加载文档信息
  useEffect(() => {
    const loadDocument = async () => {
      setLoading(true)
      try {
        // 从URL参数或查询参数获取文件名
        const fileParam = filename || searchParams.get('file')
        console.log('预览页面参数:', { id, filename, fileParam });
        
        // 直接使用文件名进行预览
        if (fileParam) {
          try {
            // 获取预览URL
            const previewUrl = backendStorageService.getPreviewUrl(fileParam);
            setPreviewUrl(previewUrl);
            
            // 设置文件类型
            const type = getFileType(fileParam);
            setFileType(type);
            
            // 设置文档信息
            setDocument({
              id: id || 'unknown',
              title: fileParam,
              description: `${type} 文件`,
              file: {
                filename: fileParam,
                originalName: fileParam
              }
            });
            
            console.log('直接使用文件名预览:', previewUrl);
            setLoading(false);
            return;
          } catch (error) {
            console.error('预览URL生成失败:', error);
          }
        }
        
        // 如果直接预览失败，尝试从localStorage加载文档信息
        const storedDocs = JSON.parse(localStorage.getItem('documents') || '[]')
        console.log('存储的文档数量:', storedDocs.length);
        
        // 查找匹配的文档 - 确保ID类型匹配
        const doc = storedDocs.find((d: any) => String(d.id) === String(id))
        console.log('找到的文档:', doc, '查找的ID:', id, '类型:', typeof id);
        
        if (!doc) {
          console.error('文档不存在:', id);
          toast({
            title: "文档不存在",
            description: "找不到请求的文档",
            variant: "destructive",
          })
          navigate('/documents')
          return
        }

        // 找到对应的文件
        const file = doc.files?.find((f: any) => f.filename === filename) || doc.files?.[0]
        console.log('找到的文件:', file);
        
        if (!file) {
          console.error('文件不存在:', filename);
          toast({
            title: "文件不存在",
            description: "找不到请求的文件",
            variant: "destructive",
          })
          navigate('/documents')
          return
        }

        // 设置文档信息
        setDocument({
          id: doc.id,
          title: doc.title || file.originalName || '未命名文档',
          description: doc.description || '',
          file: file
        })

        // 设置文件类型
        const type = getFileType(file.originalName || file.filename)
        setFileType(type)

        // 获取预览URL
        if (file.filename) {
          try {
            const previewResult = await backendStorageService.previewFile(file.filename)
            if (previewResult.success && previewResult.url) {
              setPreviewUrl(previewResult.url)
            } else {
              toast({
                title: "预览失败",
                description: previewResult.message || "无法生成预览链接",
                variant: "destructive",
              })
            }
          } catch (error) {
            console.error('预览错误:', error)
            toast({
              title: "预览失败",
              description: "生成预览链接时发生错误",
              variant: "destructive",
            })
          }
        }
      } catch (error) {
        console.error('加载文档失败:', error)
        toast({
          title: "加载失败",
          description: "无法加载文档信息",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadDocument()
  }, [id, filename, navigate, toast])

  // 下载文档
  const handleDownload = async () => {
    if (!document?.file?.filename) return
    
    try {
      const result = await backendStorageService.downloadFile(document.file.filename)
      
      if (result.success && result.blob) {
        const url = URL.createObjectURL(result.blob)
        const a = document.createElement('a')
        a.href = url
        a.download = document.file.originalName || document.file.filename
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        toast({
          title: "下载成功",
          description: `文件 "${document.file.originalName || document.file.filename}" 已开始下载`,
        })
      } else {
        toast({
          title: "下载失败",
          description: result.message || "无法下载文件",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('下载错误:', error)
      toast({
        title: "下载失败",
        description: "下载文件时发生错误",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/documents')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {loading ? '加载中...' : searchParams.get('displayName') || document?.file?.originalName || document?.title || '文档预览'}
            </h1>
            <p className="text-gray-600 mt-1">
              {loading ? '' : `${fileType} 文件预览`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleDownload} disabled={loading || !document?.file}>
            <Download className="h-4 w-4 mr-2" />
            下载
          </Button>
        </div>
      </div>

      {/* 预览区域 */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-[70vh]">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-500">加载预览中...</p>
              </div>
            </div>
          ) : previewUrl && document?.file ? (
            <FilePreviewer
              src={previewUrl}
              filename={document.file.originalName || document.file.filename}
              fileType={fileType}
              onDownload={handleDownload}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6">
              <div className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                无法生成预览
              </h3>
              <p className="text-gray-500 mb-6 max-w-md">
                无法生成此文件的预览链接，请尝试下载文件后在本地查看。
              </p>
              <Button onClick={handleDownload} disabled={!document?.file}>
                <Download className="h-4 w-4 mr-2" />
                下载文件
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}