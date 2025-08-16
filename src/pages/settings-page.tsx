import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Database,
  Upload,
  Download,
  Trash2
} from 'lucide-react'
import { StoragePathSelector } from '@/components/StoragePathSelector'
import StorageStatus from '@/components/StorageStatus'

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    comments: true,
    uploads: true
  })

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    department: '',
    phone: ''
  })

  const [isUpdating, setIsUpdating] = useState(false)

  // 初始化用户数据
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.username || '',
        email: user.email || '',
        department: '技术部', // 这个字段可以后续添加到用户模型中
        phone: user.phone || ''
      })
    }
  }, [user])

  // 保存个人资料
  const handleSaveProfile = async () => {
    if (!user) return

    setIsUpdating(true)
    try {
      const result = await updateUser({
        username: profile.name,
        email: profile.email,
        phone: profile.phone
      })

      if (result.success) {
        toast({
          title: "保存成功",
          description: "个人资料已更新",
        })
      } else {
        toast({
          title: "保存失败",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "保存失败",
        description: "更新个人资料时发生错误",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">设置</h1>
        <p className="text-gray-600 mt-1">管理您的账户设置和偏好</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>个人资料</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>通知</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>安全</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>外观</span>
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>存储</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>个人资料</CardTitle>
              <CardDescription>
                更新您的个人信息和联系方式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.avatar || "/placeholder.svg?height=80&width=80"} />
                  <AvatarFallback className="text-lg">
                    {user?.username?.slice(0, 2) || '用户'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    更换头像
                  </Button>
                  <p className="text-sm text-gray-500 mt-1">
                    支持 JPG、PNG 格式，最大 2MB
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">部门</Label>
                  <Input
                    id="department"
                    value={profile.department}
                    onChange={(e) => setProfile({...profile, department: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">电话</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleSaveProfile}
                  disabled={isUpdating}
                >
                  {isUpdating ? '保存中...' : '保存更改'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>通知设置</CardTitle>
              <CardDescription>
                选择您希望接收的通知类型
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">邮件通知</Label>
                    <p className="text-sm text-gray-500">接收重要更新的邮件通知</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={notifications.email}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, email: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">推送通知</Label>
                    <p className="text-sm text-gray-500">接收浏览器推送通知</p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={notifications.push}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, push: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="comment-notifications">评论通知</Label>
                    <p className="text-sm text-gray-500">当有人评论您的文档时通知</p>
                  </div>
                  <Switch
                    id="comment-notifications"
                    checked={notifications.comments}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, comments: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="upload-notifications">上传通知</Label>
                    <p className="text-sm text-gray-500">文档上传完成时通知</p>
                  </div>
                  <Switch
                    id="upload-notifications"
                    checked={notifications.uploads}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, uploads: checked})
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  保存设置
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>安全设置</CardTitle>
              <CardDescription>
                管理您的密码和安全选项
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">当前密码</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">新密码</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">确认新密码</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>两步验证</Label>
                    <p className="text-sm text-gray-500">为您的账户添加额外的安全层</p>
                  </div>
                  <Button variant="outline" size="sm">
                    启用
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>登录历史</Label>
                    <p className="text-sm text-gray-500">查看最近的登录活动</p>
                  </div>
                  <Button variant="outline" size="sm">
                    查看
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  更新密码
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>外观设置</CardTitle>
              <CardDescription>
                自定义界面外观和主题
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base">主题</Label>
                  <p className="text-sm text-gray-500 mb-3">选择您偏好的界面主题</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4 cursor-pointer hover:border-blue-500">
                      <div className="w-full h-20 bg-white border rounded mb-2"></div>
                      <p className="text-sm text-center">浅色</p>
                    </div>
                    <div className="border rounded-lg p-4 cursor-pointer hover:border-blue-500">
                      <div className="w-full h-20 bg-gray-900 border rounded mb-2"></div>
                      <p className="text-sm text-center">深色</p>
                    </div>
                    <div className="border rounded-lg p-4 cursor-pointer hover:border-blue-500 border-blue-500">
                      <div className="w-full h-20 bg-gradient-to-br from-white to-gray-100 border rounded mb-2"></div>
                      <p className="text-sm text-center">自动</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base">显示设置</Label>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>紧凑模式</Label>
                      <p className="text-sm text-gray-500">减少界面元素间距</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>显示文件扩展名</Label>
                      <p className="text-sm text-gray-500">在文件名中显示扩展名</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Settings */}
        <TabsContent value="storage" className="space-y-6">
          {/* Storage Path Configuration */}
          <StoragePathSelector />
          
          {/* Storage Status */}
          <StorageStatus />
          
          <Card>
            <CardHeader>
              <CardTitle>存储管理</CardTitle>
              <CardDescription>
                查看和管理您的存储空间使用情况
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">存储使用情况</span>
                    <span className="text-sm text-gray-500">2.4 GB / 10 GB</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '24%'}}></div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <span className="text-sm">文档文件</span>
                    </div>
                    <span className="text-sm text-gray-500">1.8 GB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-sm">图片文件</span>
                    </div>
                    <span className="text-sm text-gray-500">456 MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <span className="text-sm">其他文件</span>
                    </div>
                    <span className="text-sm text-gray-500">144 MB</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base">存储管理</Label>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>自动清理</Label>
                      <p className="text-sm text-gray-500">自动删除30天前的回收站文件</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>压缩上传</Label>
                      <p className="text-sm text-gray-500">上传时自动压缩大文件</p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    导出数据
                  </Button>
                  <Button variant="outline" className="flex-1 text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    清空回收站
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}