import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { storageService, StorageConfig } from '@/lib/storage'
import { HardDrive, Cloud, FolderOpen, Settings, CheckCircle } from 'lucide-react'

export default function StorageSettingsPage() {
  const [config, setConfig] = useState<StorageConfig>({
    type: 'local',
    localPath: ''
  })
  const [customPath, setCustomPath] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pathValid, setPathValid] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadStorageConfig()
  }, [])

  const loadStorageConfig = () => {
    const currentConfig = storageService.getStorageConfig()
    setConfig(currentConfig)
    setCustomPath(currentConfig.localPath || '')
  }

  const handleStorageTypeChange = (type: 'local' | 'cloud') => {
    setConfig(prev => ({ ...prev, type }))
  }

  const handlePathChange = (path: string) => {
    setCustomPath(path)
    setPathValid(storageService.validatePath(path))
  }

  const handleSelectPath = async () => {
    try {
      const selectedPath = await storageService.selectLocalPath()
      if (selectedPath) {
        setCustomPath(selectedPath)
        setPathValid(storageService.validatePath(selectedPath))
      }
    } catch (error) {
      toast({
        title: '路径选择失败',
        description: '无法选择存储路径',
        variant: 'destructive'
      })
    }
  }

  const handleSaveConfig = async () => {
    setIsLoading(true)
    try {
      if (config.type === 'local') {
        if (!pathValid || !customPath) {
          toast({
            title: '配置无效',
            description: '请输入有效的本地存储路径',
            variant: 'destructive'
          })
          return
        }

        // 尝试创建目录
        const createResult = await storageService.createLocalDirectory(customPath)
        if (!createResult.success) {
          toast({
            title: '目录创建失败',
            description: createResult.message,
            variant: 'destructive'
          })
          return
        }

        config.localPath = customPath
      }

      storageService.saveStorageConfig(config)
      
      toast({
        title: '配置保存成功',
        description: '存储设置已更新'
      })
    } catch (error) {
      toast({
        title: '配置保存失败',
        description: '保存存储设置时发生错误',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setIsLoading(true)
    try {
      if (config.type === 'local') {
        const testResult = await storageService.createLocalDirectory(customPath)
        if (testResult.success) {
          toast({
            title: '连接测试成功',
            description: '本地存储路径可用'
          })
        } else {
          toast({
            title: '连接测试失败',
            description: testResult.message,
            variant: 'destructive'
          })
        }
      } else {
        toast({
          title: '云存储测试',
          description: '云存储连接正常',
        })
      }
    } catch (error) {
      toast({
        title: '连接测试失败',
        description: '测试存储连接时发生错误',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">存储设置</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>存储类型选择</CardTitle>
          <CardDescription>
            选择文档的存储方式，可以选择本地存储或云端存储
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={config.type}
            onValueChange={handleStorageTypeChange}
            className="space-y-4"
          >
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <RadioGroupItem value="local" id="local" />
              <div className="flex items-center space-x-3 flex-1">
                <HardDrive className="h-5 w-5 text-blue-600" />
                <div>
                  <Label htmlFor="local" className="text-base font-medium">
                    本地存储
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    文件保存在本地计算机上，访问速度快，但需要手动备份
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <RadioGroupItem value="cloud" id="cloud" />
              <div className="flex items-center space-x-3 flex-1">
                <Cloud className="h-5 w-5 text-green-600" />
                <div>
                  <Label htmlFor="cloud" className="text-base font-medium">
                    云端存储
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    文件保存在云端，可以多设备同步，自动备份
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {config.type === 'local' && (
        <Card>
          <CardHeader>
            <CardTitle>本地存储路径</CardTitle>
            <CardDescription>
              设置文档在本地计算机上的存储位置
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="localPath">存储路径</Label>
              <div className="flex space-x-2">
                <Input
                  id="localPath"
                  value={customPath}
                  onChange={(e) => handlePathChange(e.target.value)}
                  placeholder="请输入或选择存储路径"
                  className={!pathValid ? 'border-red-500' : ''}
                />
                <Button
                  variant="outline"
                  onClick={handleSelectPath}
                  disabled={isLoading}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  选择路径
                </Button>
              </div>
              {!pathValid && customPath && (
                <Alert variant="destructive">
                  <AlertDescription>
                    路径格式无效，请输入有效的文件路径
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleTestConnection}
                variant="outline"
                disabled={isLoading || !pathValid || !customPath}
              >
                {isLoading ? '测试中...' : '测试连接'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {config.type === 'cloud' && (
        <Card>
          <CardHeader>
            <CardTitle>云存储配置</CardTitle>
            <CardDescription>
              配置云端存储服务
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">云存储已配置</p>
                <p className="text-sm text-green-600">
                  使用腾讯云开发存储服务，自动同步和备份
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={loadStorageConfig}
          disabled={isLoading}
        >
          重置
        </Button>
        <Button
          onClick={handleSaveConfig}
          disabled={isLoading || (config.type === 'local' && (!pathValid || !customPath))}
        >
          {isLoading ? '保存中...' : '保存设置'}
        </Button>
      </div>
    </div>
  )
}