import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { storageService as localStorageService } from '@/lib/storage'
import { FileText, CheckCircle, Database, RefreshCw } from 'lucide-react'

export default function StorageTestPage() {
  const [localFiles, setLocalFiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // 获取本地存储的文件列表
  const loadLocalFiles = async () => {
    setIsLoading(true)
    try {
      const result = await localStorageService.getLocalFiles()
      if (result.success && result.files) {
        setLocalFiles(result.files)
        toast({
          title: "加载成功",
          description: `找到 ${result.files.length} 个本地文件`,
        })
      } else {
        setLocalFiles([])
        toast({
          title: "没有找到文件",
          description: result.message || "本地存储中没有文件",
        })
      }
    } catch (error) {
      console.error('加载本地文件失败:', error)
      toast({
        title: "加载失败",
        description: "无法加载本地文件列表",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 验证单个文件是否存在
  const verifyFile = async (filePath: string) => {
    try {
      const verification = await localStorageService.verifyFileExists(filePath)
      if (verification.exists) {
        toast({
          title: "文件验证成功",
          description: `文件存在: ${verification.fileInfo?.name}`,
        })
      } else {
        toast({
          title: "文件不存在",
          description: `文件路径: ${filePath}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "验证失败",
        description: "文件验证过程中发生错误",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">存储测试</h1>
          <p className="text-gray-600 mt-1">验证文件是否正确保存到本地存储</p>
        </div>
        <Button onClick={loadLocalFiles} disabled={isLoading}>
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          {isLoading ? '加载中...' : '刷新文件列表'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            本地存储文件列表
          </CardTitle>
          <CardDescription>
            显示保存在 IndexedDB 中的所有文件
          </CardDescription>
        </CardHeader>
        <CardContent>
          {localFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>没有找到本地文件</p>
              <p className="text-sm">请先上传一些文件</p>
            </div>
          ) : (
            <div className="space-y-4">
              {localFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        大小: {formatFileSize(file.size)} | 类型: {file.type}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-md">
                        路径: {file.path}
                      </p>
                      {file.lastModified && (
                        <p className="text-xs text-gray-400">
                          修改时间: {new Date(file.lastModified).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      已保存
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => verifyFile(file.path)}
                    >
                      验证
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>存储配置信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>存储类型:</strong> {localStorageService.getStorageConfig().type}</p>
            <p><strong>本地路径:</strong> {localStorageService.getStorageConfig().localPath}</p>
            <p><strong>数据库:</strong> IndexedDB (DocumentSystemFiles)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}