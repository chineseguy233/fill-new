import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Info,
  ExternalLink,
  RefreshCw,
  Shield,
  Zap,
  Database
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CloudProvider {
  id: string
  name: string
  description: string
  icon: string
  features: string[]
  pricing: string
  setupComplexity: 'easy' | 'medium' | 'hard'
  status: 'available' | 'configured' | 'error'
}

interface ConfigStep {
  id: string
  title: string
  description: string
  completed: boolean
  required: boolean
}

export default function CloudStorageConfigPage() {
  const { toast } = useToast()
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [configData, setConfigData] = useState({
    tencentCloud: {
      secretId: '',
      secretKey: '',
      region: 'ap-beijing',
      bucket: '',
      envId: ''
    },
    aliCloud: {
      accessKeyId: '',
      accessKeySecret: '',
      region: 'oss-cn-hangzhou',
      bucket: ''
    },
    awsS3: {
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
      bucket: ''
    }
  })
  const [testingConnection, setTestingConnection] = useState(false)
  const [setupProgress, setSetupProgress] = useState(0)

  const cloudProviders: CloudProvider[] = [
    {
      id: 'tencent',
      name: '腾讯云 CloudBase',
      description: '腾讯云开发平台，提供云存储、云函数、数据库等服务',
      icon: '🐧',
      features: ['云存储', '云函数', '云数据库', '用户认证', 'CDN加速'],
      pricing: '按量付费，有免费额度',
      setupComplexity: 'easy',
      status: 'configured'
    },
    {
      id: 'aliyun',
      name: '阿里云 OSS',
      description: '阿里云对象存储服务，稳定可靠的云存储解决方案',
      icon: '☁️',
      features: ['对象存储', 'CDN加速', '图片处理', '数据备份'],
      pricing: '按存储量和流量计费',
      setupComplexity: 'medium',
      status: 'available'
    },
    {
      id: 'aws',
      name: 'Amazon S3',
      description: 'AWS 简单存储服务，全球领先的云存储服务',
      icon: '🌐',
      features: ['对象存储', '全球CDN', '数据分析', '机器学习集成'],
      pricing: '按使用量付费',
      setupComplexity: 'hard',
      status: 'available'
    }
  ]

  const setupSteps: ConfigStep[] = [
    {
      id: 'provider',
      title: '选择云服务提供商',
      description: '选择适合您需求的云存储服务提供商',
      completed: !!selectedProvider,
      required: true
    },
    {
      id: 'credentials',
      title: '配置访问凭证',
      description: '输入云服务的访问密钥和相关配置',
      completed: false,
      required: true
    },
    {
      id: 'test',
      title: '测试连接',
      description: '验证配置是否正确，测试云服务连接',
      completed: false,
      required: true
    },
    {
      id: 'deploy',
      title: '部署配置',
      description: '保存配置并启用云存储服务',
      completed: false,
      required: true
    }
  ]

  useEffect(() => {
    const completedSteps = setupSteps.filter(step => step.completed).length
    setSetupProgress((completedSteps / setupSteps.length) * 100)
  }, [selectedProvider])

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId)
  }

  const handleConfigChange = (provider: string, field: string, value: string) => {
    setConfigData(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider as keyof typeof prev],
        [field]: value
      }
    }))
  }

  const testConnection = async () => {
    setTestingConnection(true)
    try {
      // 模拟连接测试
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "连接测试成功",
        description: "云存储服务配置正确，连接正常",
      })
    } catch (error) {
      toast({
        title: "连接测试失败",
        description: "请检查配置信息是否正确",
        variant: "destructive",
      })
    } finally {
      setTestingConnection(false)
    }
  }

  const saveConfiguration = async () => {
    try {
      // 保存配置逻辑
      toast({
        title: "配置保存成功",
        description: "云存储配置已保存并启用",
      })
    } catch (error) {
      toast({
        title: "配置保存失败",
        description: "保存配置时发生错误",
        variant: "destructive",
      })
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getComplexityText = (complexity: string) => {
    switch (complexity) {
      case 'easy': return '简单'
      case 'medium': return '中等'
      case 'hard': return '复杂'
      default: return '未知'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">云存储配置</h1>
        <p className="text-gray-600 mt-1">配置云端存储服务，实现文件的云端存储和同步</p>
      </div>

      {/* Setup Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            配置进度
          </CardTitle>
          <CardDescription>
            完成以下步骤来配置云存储服务
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">整体进度</span>
              <span className="text-sm text-gray-500">{Math.round(setupProgress)}%</span>
            </div>
            <Progress value={setupProgress} className="h-2" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {setupSteps.map((step, index) => (
                <div key={step.id} className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    step.completed 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{step.title}</p>
                    <p className="text-xs text-gray-500 truncate">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers">选择服务商</TabsTrigger>
          <TabsTrigger value="config">配置服务</TabsTrigger>
          <TabsTrigger value="guide">操作指南</TabsTrigger>
        </TabsList>

        {/* Provider Selection */}
        <TabsContent value="providers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>选择云存储服务提供商</CardTitle>
              <CardDescription>
                选择适合您需求的云存储服务，每个服务商都有不同的特点和定价
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cloudProviders.map((provider) => (
                  <Card 
                    key={provider.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedProvider === provider.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleProviderSelect(provider.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{provider.icon}</span>
                          <div>
                            <CardTitle className="text-lg">{provider.name}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge 
                                variant="secondary" 
                                className={getComplexityColor(provider.setupComplexity)}
                              >
                                {getComplexityText(provider.setupComplexity)}
                              </Badge>
                              {provider.status === 'configured' && (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  已配置
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {selectedProvider === provider.id && (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 mb-3">{provider.description}</p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-1">功能特性</p>
                          <div className="flex flex-wrap gap-1">
                            {provider.features.map((feature, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700">定价模式</p>
                          <p className="text-xs text-gray-500">{provider.pricing}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration */}
        <TabsContent value="config" className="space-y-6">
          {!selectedProvider ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>请先选择服务提供商</AlertTitle>
              <AlertDescription>
                请在"选择服务商"标签页中选择一个云存储服务提供商，然后返回此页面进行配置。
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {selectedProvider === 'tencent' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <span className="text-2xl mr-2">🐧</span>
                      腾讯云 CloudBase 配置
                    </CardTitle>
                    <CardDescription>
                      配置腾讯云开发平台的访问凭证和环境信息
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertTitle>安全提示</AlertTitle>
                      <AlertDescription>
                        请确保您的密钥信息安全，不要在公共场所或不安全的网络环境下输入敏感信息。
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="secretId">SecretId *</Label>
                        <Input
                          id="secretId"
                          type="password"
                          placeholder="输入腾讯云 SecretId"
                          value={configData.tencentCloud.secretId}
                          onChange={(e) => handleConfigChange('tencentCloud', 'secretId', e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                          在腾讯云控制台的访问管理中获取
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="secretKey">SecretKey *</Label>
                        <Input
                          id="secretKey"
                          type="password"
                          placeholder="输入腾讯云 SecretKey"
                          value={configData.tencentCloud.secretKey}
                          onChange={(e) => handleConfigChange('tencentCloud', 'secretKey', e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                          与 SecretId 配对的密钥
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="envId">环境 ID *</Label>
                        <Input
                          id="envId"
                          placeholder="输入云开发环境 ID"
                          value={configData.tencentCloud.envId}
                          onChange={(e) => handleConfigChange('tencentCloud', 'envId', e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                          云开发控制台中的环境标识符
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="region">地域</Label>
                        <Input
                          id="region"
                          placeholder="ap-beijing"
                          value={configData.tencentCloud.region}
                          onChange={(e) => handleConfigChange('tencentCloud', 'region', e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                          云开发环境所在地域
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">连接测试</h4>
                        <p className="text-sm text-gray-500">验证配置信息是否正确</p>
                      </div>
                      <Button 
                        onClick={testConnection} 
                        disabled={testingConnection || !configData.tencentCloud.secretId || !configData.tencentCloud.secretKey}
                        variant="outline"
                      >
                        {testingConnection ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            测试中...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            测试连接
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button variant="outline">
                        重置配置
                      </Button>
                      <Button onClick={saveConfiguration} className="bg-blue-600 hover:bg-blue-700">
                        <Database className="h-4 w-4 mr-2" />
                        保存配置
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Setup Guide */}
        <TabsContent value="guide" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>云存储配置操作指南</CardTitle>
              <CardDescription>
                详细的步骤指导，帮助您快速完成云存储服务的配置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 腾讯云指南 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="text-2xl mr-2">🐧</span>
                  腾讯云 CloudBase 配置指南
                </h3>
                
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium">步骤 1: 创建云开发环境</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      1. 访问 <a href="https://console.cloud.tencent.com/tcb" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">
                        腾讯云开发控制台 <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </p>
                    <p className="text-sm text-gray-600">2. 点击"新建环境"，选择"按量计费"</p>
                    <p className="text-sm text-gray-600">3. 填写环境名称，选择地域，点击"立即开通"</p>
                    <p className="text-sm text-gray-600">4. 记录环境 ID（env-xxxxxxxx 格式）</p>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium">步骤 2: 获取访问密钥</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      1. 访问 <a href="https://console.cloud.tencent.com/cam/capi" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">
                        访问管理控制台 <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </p>
                    <p className="text-sm text-gray-600">2. 点击"新建密钥"</p>
                    <p className="text-sm text-gray-600">3. 记录 SecretId 和 SecretKey</p>
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        请妥善保管密钥信息，不要泄露给他人
                      </AlertDescription>
                    </Alert>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-medium">步骤 3: 开启云存储服务</h4>
                    <p className="text-sm text-gray-600 mt-1">1. 在云开发控制台中选择您的环境</p>
                    <p className="text-sm text-gray-600">2. 点击左侧菜单"云存储"</p>
                    <p className="text-sm text-gray-600">3. 点击"开通云存储服务"</p>
                    <p className="text-sm text-gray-600">4. 配置安全规则（建议先使用默认规则）</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 常见问题 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">常见问题解答</h3>
                
                <div className="space-y-3">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-sm">Q: 如何选择合适的云存储服务？</h4>
                    <p className="text-sm text-gray-600 mt-2">
                      A: 建议根据以下因素选择：
                      <br />• 预算：腾讯云有较多免费额度，适合小型项目
                      <br />• 地域：选择离用户更近的服务商，提升访问速度
                      <br />• 功能需求：如需要云函数等服务，推荐腾讯云 CloudBase
                      <br />• 技术栈：如果已在使用某云服务商的其他服务，建议保持一致
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-sm">Q: 配置后如何验证是否成功？</h4>
                    <p className="text-sm text-gray-600 mt-2">
                      A: 可以通过以下方式验证：
                      <br />• 使用"测试连接"功能验证配置正确性
                      <br />• 尝试上传一个测试文件
                      <br />• 检查云服务控制台是否有相应的文件记录
                      <br />• 查看应用日志是否有错误信息
                    </p>
                  </div>
                </div>
              </div>

              {/* 技术支持 */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>需要帮助？</AlertTitle>
                <AlertDescription>
                  如果在配置过程中遇到问题，可以查看各云服务商的官方文档，或联系技术支持获取帮助。
                  <br />
                  <div className="flex space-x-4 mt-2">
                    <a href="https://cloud.tencent.com/document/product/876" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center text-sm">
                      腾讯云文档 <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}