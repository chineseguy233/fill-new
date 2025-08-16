import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react'
import { storageService, dbService } from '@/lib/cloudbase'
import { storageService as localStorageService } from '@/lib/storage'
import { backendStorageService } from '@/lib/backendStorage'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import SimpleFolderSelector from '@/components/SimpleFolderSelector'

interface UploadFile {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  cloudPath?: string
  fileID?: string
  error?: string
}

interface DocumentUploadProps {
  onUploadComplete?: (files: UploadFile[]) => void
  onClose?: () => void
}

export default function DocumentUpload({ onUploadComplete, onClose }: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMountedRef = useRef(true)
  const { user } = useAuth()
  const { toast } = useToast()

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    const newFiles: UploadFile[] = selectedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending'
    }))
    setFiles(prev => [...prev, ...newFiles])
  }

  // 移除文件
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id))
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 上传单个文件到云存储
  const uploadSingleFileToCloud = async (uploadFile: UploadFile): Promise<UploadFile> => {
    try {
      // 更新状态为上传中
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading' as const, progress: 0 }
          : f
      ))

      const timestamp = Date.now()
      const fileName = `${timestamp}_${uploadFile.file.name}`

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        if (!isMountedRef.current) {
          clearInterval(progressInterval)
          return
        }
        setFiles(prev => prev.map(f => {
          if (f.id === uploadFile.id && f.progress < 90) {
            return { ...f, progress: f.progress + 10 }
          }
          return f
        }))
      }, 200)

      // 云存储模式 - 上传到云端
      const cloudPath = `shared-documents/${fileName}`
      const result = await storageService.uploadFile(cloudPath, uploadFile.file)
      
      clearInterval(progressInterval)

      // 更新进度到100%
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              progress: 100, 
              status: 'success' as const,
              cloudPath,
              fileID: result.fileID
            }
          : f
      ))

      return {
        ...uploadFile,
        progress: 100,
        status: 'success',
        cloudPath,
        fileID: result.fileID
      }
    } catch (error) {
      console.error('云存储文件上传失败:', error)
      
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'string' ? error : 
                          '云存储文件上传失败，请重试'
      
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'error' as const,
              error: errorMessage
            }
          : f
      ))

      throw new Error(errorMessage)
    }
  }

  // 保存文档信息到数据库 - 为每个文件创建独立的文档记录
  const saveDocumentInfo = async (uploadedFiles: UploadFile[]) => {
    try {
      console.log('开始保存文档信息，上传的文件:', uploadedFiles)
      
      // 获取存储配置
      const storageConfig = localStorageService.getStorageConfig()
      
      // 为每个上传的文件创建独立的文档记录
      const documents = uploadedFiles.map((uploadedFile, index) => {
        // 从后端文件名中提取原始文件名（去掉时间戳前缀）
        const originalName = uploadedFile.cloudPath && uploadedFile.cloudPath.includes('_') ? 
          uploadedFile.cloudPath.split('_').slice(2).join('_') : uploadedFile.file.name
        
        return {
          id: `doc_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          title: originalName, // 使用原始文件名作为标题
          description: description || `上传于 ${new Date().toLocaleString()}`,
          tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
          folderId: selectedFolderId || 'root',
          files: [{
            name: originalName, // 显示名称使用原始文件名
            filename: uploadedFile.cloudPath, // 后端存储的文件名（用于下载）
            originalName: originalName, // 原始文件名
            size: uploadedFile.file.size,
            type: uploadedFile.file.type,
            cloudPath: uploadedFile.cloudPath,
            fileID: uploadedFile.fileID,
            uploadTime: new Date().toISOString()
          }],
          author: user?.id || 'anonymous',
          authorName: user?.username || '匿名用户',
          isPublic: true,
          visibility: 'public',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          views: 0,
          starred: false,
          status: 'active'
        }
      })

      console.log('准备保存的文档数据:', documents)
      
      // 始终保存到localStorage作为基础存储
      try {
        const existingDocs = JSON.parse(localStorage.getItem('documents') || '[]')
        console.log('现有文档数量:', existingDocs.length)
        
        // 添加所有新文档
        const updatedDocs = [...existingDocs, ...documents]
        localStorage.setItem('documents', JSON.stringify(updatedDocs))
        
        console.log(`文档信息已保存到localStorage，新增 ${documents.length} 个文档，总数量: ${updatedDocs.length}`)
      } catch (localStorageError) {
        console.error('localStorage保存失败:', localStorageError)
        throw new Error(`本地存储保存失败: ${localStorageError instanceof Error ? localStorageError.message : '未知错误'}`)
      }
      
      // 根据存储配置决定是否保存到云数据库
      if (storageConfig.type === 'cloud') {
        try {
          // 逐个保存到云数据库
          for (const doc of documents) {
            await dbService.addDocument('documents', doc)
          }
          console.log('所有文档信息已保存到云数据库')
        } catch (cloudError) {
          console.warn('云数据库保存失败，但已保存到本地存储:', cloudError)
        }
      } else {
        console.log('本地存储模式，跳过云数据库保存')
      }
      
      toast({
        title: "上传成功",
        description: `${documents.length} 个文档已成功上传并保存`,
      })
      
      console.log('文档保存完成，返回文档数据')
      return documents
    } catch (error) {
      console.error('保存文档信息失败:', error)
      const errorMessage = error instanceof Error ? error.message : '保存文档信息失败'
      
      // 显示详细的错误信息
      toast({
        title: "添加文档失败",
        description: `保存文档信息时发生错误: ${errorMessage}`,
        variant: "destructive",
      })
      
      // 不重新抛出错误，让上传流程继续
      return null
    }
  }

  // 开始上传
  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "请选择文件",
        description: "请至少选择一个文件进行上传",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // 获取用户的存储配置
      const storageConfig = localStorageService.getStorageConfig()
      console.log('当前存储配置:', storageConfig)

      if (storageConfig.type === 'local') {
        // 用户选择了本地存储，使用后端文件系统
        console.log('用户选择本地存储，使用后端文件系统')
        
        const isBackendAvailable = await backendStorageService.checkHealth()
        
        if (isBackendAvailable) {
          // 使用后端API上传到本地文件系统
          await handleBackendUpload()
        } else {
          // 后端不可用，显示错误
          toast({
            title: "上传失败",
            description: "本地存储服务不可用，请检查后端服务器状态",
            variant: "destructive",
          })
          return
        }
      } else if (storageConfig.type === 'cloud') {
        // 用户选择了云存储，使用云存储服务
        console.log('用户选择云存储，使用云存储服务')
        await handleCloudUpload()
      } else {
        // 默认情况，检查后端可用性
        const isBackendAvailable = await backendStorageService.checkHealth()
        
        if (isBackendAvailable) {
          await handleBackendUpload()
        } else {
          toast({
            title: "上传失败",
            description: "存储服务不可用，请检查服务器状态或配置存储设置",
            variant: "destructive",
          })
          return
        }
      }
    } catch (error) {
      console.error('上传过程中发生错误:', error)
      toast({
        title: "上传失败",
        description: "上传过程中发生错误，请重试",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // 后端上传处理
  const handleBackendUpload = async () => {
    try {
      // 更新所有文件状态为上传中
      setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const, progress: 0 })))

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        if (!isMountedRef.current) {
          clearInterval(progressInterval)
          return
        }
        setFiles(prev => prev.map(f => {
          if (f.status === 'uploading' && f.progress < 90) {
            return { ...f, progress: f.progress + 10 }
          }
          return f
        }))
      }, 300)

      // 准备文件和元数据
      const filesToUpload = files.map(f => f.file)
      const metadata = {
        title: title || files[0]?.file.name || '未命名文档',
        description,
        tags,
        folderId: selectedFolderId || 'root'
      }

      // 调用后端API上传
      const result = await backendStorageService.uploadFiles(filesToUpload, metadata)
      
      clearInterval(progressInterval)

      if (result.success) {
        // 更新文件状态为成功
        const updatedFiles = files.map((f, index) => {
          const backendFile = result.data?.files?.[index]
          return { 
            ...f, 
            status: 'success' as const, 
            progress: 100,
            cloudPath: backendFile?.filename || `${Date.now()}_${f.file.name}`,
            fileID: backendFile?.filename || result.data?.document?.id
          }
        })
        
        setFiles(updatedFiles)

        toast({
          title: "上传成功",
          description: `${filesToUpload.length} 个文件已成功保存到本地文件系统`,
        })

        // 保存文档信息到本地数据库
        const savedDoc = await saveDocumentInfo(updatedFiles)
        
        if (savedDoc) {
          // 通知父组件
          onUploadComplete?.(updatedFiles)
          
          // 重置表单
          resetForm()
        }
      } else {
        // 上传失败
        setFiles(prev => prev.map(f => ({ 
          ...f, 
          status: 'error' as const,
          error: result.message
        })))

        toast({
          title: "上传失败",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('后端上传失败:', error)
      toast({
        title: "上传失败",
        description: "后端服务异常，请检查服务器状态",
        variant: "destructive",
      })
    }
  }

  // 云存储上传处理
  const handleCloudUpload = async () => {
    try {
      toast({
        title: "使用云存储",
        description: "正在上传文件到云端存储服务",
      })

      // 并发上传所有文件到云存储
      const uploadPromises = files.map(file => uploadSingleFileToCloud(file))
      const uploadedFiles = await Promise.allSettled(uploadPromises)
      
      // 获取成功上传的文件
      const successfulUploads = uploadedFiles
        .filter((result): result is PromiseFulfilledResult<UploadFile> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value)

      if (successfulUploads.length > 0) {
        // 保存文档信息到数据库
        const savedDoc = await saveDocumentInfo(successfulUploads)
        
        if (savedDoc) {
          // 通知父组件上传完成
          onUploadComplete?.(successfulUploads)
          
          // 重置表单
          resetForm()
        }
      }

      const failedUploads = uploadedFiles.filter(result => result.status === 'rejected')
      if (failedUploads.length > 0) {
        toast({
          title: "部分文件上传失败",
          description: `${failedUploads.length} 个文件上传失败，请重试`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('云存储上传失败:', error)
      toast({
        title: "云存储上传失败",
        description: "云存储服务异常，请检查网络连接或切换到本地存储",
        variant: "destructive",
      })
    }
  }


  // 重置表单
  const resetForm = () => {
    setFiles([])
    setTitle('')
    setDescription('')
    setTags('')
    setSelectedFolderId('')
    
    // 安全地重置文件输入
    try {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.warn('重置文件输入失败:', error)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          上传文档
        </CardTitle>
        <CardDescription>
          选择文件并填写文档信息，支持多文件同时上传
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 文档信息 */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">文档标题</Label>
            <Input
              id="title"
              placeholder="输入文档标题（可选）"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">文档描述</Label>
            <Textarea
              id="description"
              placeholder="输入文档描述（可选）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">标签</Label>
            <Input
              id="tags"
              placeholder="输入标签，用逗号分隔（可选）"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          
          <SimpleFolderSelector
            selectedFolderId={selectedFolderId}
            onFolderChange={setSelectedFolderId}
          />
        </div>

        {/* 文件选择 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>选择文件</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              选择文件
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.zip,.rar"
          />

          {/* 文件列表 */}
          {files.length > 0 && (
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <File className="h-8 w-8 text-blue-600 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.file.size)}
                    </p>
                    
                    {file.status === 'uploading' && (
                      <div className="mt-2">
                        <Progress value={file.progress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">
                          上传中... {file.progress}%
                        </p>
                      </div>
                    )}
                    
                    {file.status === 'error' && (
                      <p className="text-xs text-red-500 mt-1">
                        {file.error || '上传失败'}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {file.status === 'pending' && (
                      <Badge variant="secondary">等待上传</Badge>
                    )}
                    {file.status === 'uploading' && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    )}
                    {file.status === 'success' && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    
                    {!isUploading && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(file.id)}
                        className="h-6 w-6"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-3">
          {onClose && (
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              取消
            </Button>
          )}
          <Button 
            onClick={handleUpload} 
            disabled={files.length === 0 || isUploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                开始上传
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}