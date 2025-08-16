import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Database, 
  HardDrive, 
  Download, 
  Info,
  CheckCircle
} from 'lucide-react'
import { storageService } from '@/lib/storage'
import { backendStorageService } from '@/lib/backendStorage'

export default function StorageStatus() {
  const [storageConfig] = useState(storageService.getStorageConfig())
  const [localFiles, setLocalFiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadLocalFiles()
  }, [])

  const loadLocalFiles = async () => {
    setIsLoading(true)
    try {
      // 首先尝试从后端获取文件列表
      const backendResult = await backendStorageService.getFileList()
      
      if (backendResult.success && backendResult.data?.files) {
        // 转换后端文件格式
        const backendFiles = backendResult.data.files.map((file: any) => ({
          id: file.name,
          name: file.name,
          size: file.size,
          type: 'application/octet-stream',
          path: `${backendResult.data.storagePath}\\${file.name}`,
          lastModified: new Date(file.modified),
          isLocal: false,
          isBackend: true
        }))
        setLocalFiles(backendFiles)
        console.log(`✅ 从后端加载了 ${backendFiles.length} 个文件`)
      } else {
        // 降级到前端存储
        console.warn('⚠️ 后端不可用，使用前端存储')
        const result = await storageService.getLocalFiles()
        if (result.success && result.files) {
          const frontendFiles = result.files.map((file: any) => ({
            ...file,
            isLocal: true,
            isBackend: false
          }))
          setLocalFiles(frontendFiles)
        }
      }
    } catch (error) {
      console.error('加载文件失败:', error)
      // 尝试前端存储作为降级
      try {
        const result = await storageService.getLocalFiles()
        if (result.success && result.files) {
          setLocalFiles(result.files.map((file: any) => ({
            ...file,
            isLocal: true,
            isBackend: false
          })))
        }
      } catch (fallbackError) {
        console.error('前端存储也失败:', fallbackError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    try {
      // 检查是否是后端文件
      const file = localFiles.find(f => f.name === fileName)
      
      if (file?.isBackend) {
        console.log('开始下载后端文件:', fileName)
        // 使用后端API下载
        const result = await backendStorageService.downloadFile(fileName)
        if (result.success && result.blob) {
          console.log('后端下载成功，创建下载链接')
          const url = URL.createObjectURL(result.blob)
          const a = document.createElement('a')
          a.href = url
          a.download = fileName
          a.style.display = 'none'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          console.log('文件下载完成:', fileName)
        } else {
          console.error('后端下载失败:', result.message)
          alert(`下载失败: ${result.message || '未知错误'}`)
        }
      } else {
        console.log('开始下载前端文件:', fileName)
        // 使用前端存储下载
        const result = await storageService.downloadFile(filePath)
        if (result.success && result.blob) {
          console.log('前端下载成功，创建下载链接')
          const url = URL.createObjectURL(result.blob)
          const a = document.createElement('a')
          a.href = url
          a.download = fileName
          a.style.display = 'none'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          console.log('文件下载完成:', fileName)
        } else {
          console.error('前端下载失败:', result)
          alert(`下载失败: ${result.message || '未知错误'}`)
        }
      }
    } catch (error) {
      console.error('下载文件失败:', error)
      alert(`下载文件时发生错误: ${error.message || '未知错误'}`)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="h-5 w-5 mr-2" />
          存储状态
        </CardTitle>
        <CardDescription>
          查看文件存储位置和管理已上传的文件
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 存储配置信息 */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>配置的存储路径：</strong> {storageConfig.localPath}</p>
              <p><strong>实际存储位置：</strong> 浏览器 IndexedDB（由于安全限制）</p>
              <p className="text-sm text-gray-600">
                由于浏览器安全限制，文件实际保存在浏览器的本地数据库中。
                如需保存到指定目录，请使用下载功能手动保存文件。
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* 存储统计 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{localFiles.length}</div>
            <div className="text-sm text-gray-600">已存储文件</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatFileSize(localFiles.reduce((total, file) => total + (file.size || 0), 0))}
            </div>
            <div className="text-sm text-gray-600">总存储大小</div>
          </div>
        </div>

        {/* 文件列表 */}
        {localFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">已存储的文件</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {localFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <HardDrive className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size || 0)} • {new Date(file.lastModified || Date.now()).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      已存储
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadFile(file.path || '', file.name)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      下载
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {localFiles.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>暂无存储的文件</p>
            <p className="text-sm">上传文件后将在此处显示</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>加载中...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}