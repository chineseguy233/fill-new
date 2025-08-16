import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { FolderOpen, Check, AlertCircle } from 'lucide-react'
import { storageService } from '../lib/storage'
import { useToast } from './ui/use-toast'

interface StoragePathSelectorProps {
  onPathChange?: (path: string) => void
}

export function StoragePathSelector({ onPathChange }: StoragePathSelectorProps) {
  const [currentPath, setCurrentPath] = useState<string>('')
  const [customPath, setCustomPath] = useState<string>('')
  const [isValidPath, setIsValidPath] = useState<boolean>(true)
  const { toast } = useToast()

  useEffect(() => {
    // 获取当前存储配置
    const config = storageService.getStorageConfig()
    setCurrentPath(config.localPath || 'D:\\DOC_STORAGE')
    setCustomPath(config.localPath || 'D:\\DOC_STORAGE')
  }, [])

  const handlePathValidation = (path: string) => {
    const isValid = storageService.validatePath(path)
    setIsValidPath(isValid)
    return isValid
  }

  const handlePathChange = (path: string) => {
    setCustomPath(path)
    handlePathValidation(path)
  }

  const handleSelectPath = async () => {
    try {
      const selectedPath = await storageService.selectLocalPath()
      if (selectedPath) {
        setCustomPath(selectedPath)
        handlePathValidation(selectedPath)
      }
    } catch (error) {
      toast({
        title: "路径选择失败",
        description: "无法打开文件选择器，请手动输入路径",
        variant: "destructive"
      })
    }
  }

  const handleSavePath = async () => {
    if (!handlePathValidation(customPath)) {
      toast({
        title: "路径无效",
        description: "请输入有效的文件路径",
        variant: "destructive"
      })
      return
    }

    try {
      // 尝试创建目录
      const result = await storageService.createLocalDirectory(customPath)
      
      if (result.success) {
        // 保存配置
        storageService.saveStorageConfig({
          type: 'local',
          localPath: customPath
        })
        
        setCurrentPath(customPath)
        onPathChange?.(customPath)
        
        toast({
          title: "存储路径已更新",
          description: `文件将保存到: ${customPath}`,
        })
      } else {
        toast({
          title: "路径设置失败",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "设置失败",
        description: "无法设置存储路径，请检查路径权限",
        variant: "destructive"
      })
    }
  }

  const handleResetToDefault = () => {
    const defaultPath = 'D:\\DOC_STORAGE'
    setCustomPath(defaultPath)
    handlePathValidation(defaultPath)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          本地存储路径设置
        </CardTitle>
        <CardDescription>
          配置文档的本地存储位置。系统默认使用 D:\DOC_STORAGE 目录。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 当前路径显示 */}
        <div className="space-y-2">
          <Label>当前存储路径</Label>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <Check className="h-4 w-4 text-green-600" />
            <span className="font-mono text-sm">{currentPath}</span>
          </div>
        </div>

        {/* 路径输入 */}
        <div className="space-y-2">
          <Label htmlFor="storage-path">自定义存储路径</Label>
          <div className="flex gap-2">
            <Input
              id="storage-path"
              value={customPath}
              onChange={(e) => handlePathChange(e.target.value)}
              placeholder="D:\DOC_STORAGE"
              className={!isValidPath ? 'border-red-500' : ''}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleSelectPath}
              className="shrink-0"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              浏览
            </Button>
          </div>
          {!isValidPath && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              请输入有效的文件路径
            </div>
          )}
        </div>

        {/* 路径示例 */}
        <div className="space-y-2">
          <Label>路径格式示例</Label>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>• Windows: <code>D:\DOC_STORAGE</code> 或 <code>C:\Users\用户名\Documents\文档系统</code></div>
            <div>• macOS: <code>~/Documents/DOC_STORAGE</code></div>
            <div>• Linux: <code>/home/用户名/Documents/DOC_STORAGE</code></div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSavePath}
            disabled={!isValidPath || customPath === currentPath}
          >
            保存设置
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleResetToDefault}
          >
            恢复默认
          </Button>
        </div>

        {/* 说明信息 */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <strong>注意事项：</strong>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>确保选择的路径有足够的存储空间</li>
              <li>程序需要对该路径有读写权限</li>
              <li>更改路径不会移动已有文件，需要手动迁移</li>
              <li>建议定期备份重要文档</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}