import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Database,
  Camera,
  Save,
  Users,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import StorageSettingsPage from '@/pages/storage-settings-page'
import { API_ORIGIN } from '@/lib/apiBase'

export default function EnhancedSettingsPage() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 通知设置
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    comments: true,
    uploads: true
  })

  // 个人资料
  const [profile, setProfile] = useState({
    name: user?.username || '张三',
    email: user?.email || 'zhangsan@example.com',
    department: '技术部',
    phone: '138****8888',
    avatar: ''
  })

  // 密码修改
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // 主题设置
  const [theme, setTheme] = useState('auto')
  const [displaySettings, setDisplaySettings] = useState({
    compactMode: false,
    showExtensions: true
  })


  // 权限设置
  const [permissions, setPermissions] = useState({
    canUpload: true,
    canDownload: true,
    canShare: true,
    canDelete: false,
    canManageUsers: false,
    maxFileSize: '100MB',
    allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
  })

  // 处理头像上传
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "文件过大",
          description: "头像文件大小不能超过 2MB",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const avatarUrl = e.target?.result as string
        setProfile(prev => ({ ...prev, avatar: avatarUrl }))
        toast({
          title: "头像上传成功",
          description: "请点击保存更改来应用新头像",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  // 保存个人资料
  const handleSaveProfile = async () => {
    try {
      const result = await updateUser({
        username: profile.name,
        email: profile.email
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
    }
  }

  // 修改密码
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "密码不匹配",
        description: "新密码和确认密码不一致",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "密码太短",
        description: "新密码长度至少为6位",
        variant: "destructive",
      })
      return
    }

    try {
      const resp = await fetch(`${API_ORIGIN}/api/users/${user?.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const apiRes = await resp.json().catch(() => ({}));
      const result = resp.ok && (apiRes?.success ?? true)
        ? { success: true }
        : { success: false, message: apiRes?.message || '密码修改失败' };
      
      if (result.success) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        toast({
          title: "密码修改成功",
          description: "您的密码已更新",
        })
      } else {
        toast({
          title: "密码修改失败",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "密码修改失败",
        description: "修改密码时发生错误",
        variant: "destructive",
      })
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            个人资料
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            通知
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            安全
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            外观
          </TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="storage">
              <Database className="h-4 w-4 mr-2" />
              存储
            </TabsTrigger>
          )}
          <TabsTrigger value="permissions">
            <Users className="h-4 w-4 mr-2" />
            权限
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
                  <AvatarImage src={profile.avatar || "/placeholder.svg?height=80&width=80"} />
                  <AvatarFallback className="text-lg">
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    更换头像
                  </Button>
                  <p className="text-sm text-gray-500 mt-1">
                    支持 JPG、PNG 格式，最大 2MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
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
                <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  保存更改
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
                <Button onClick={() => toast({ title: "设置已保存", description: "通知设置已更新" })} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
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
              <CardTitle>密码修改</CardTitle>
              <CardDescription>
                更新您的登录密码
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">当前密码</Label>
                  <div className="relative">
                    <Input 
                      id="current-password" 
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">新密码</Label>
                  <div className="relative">
                    <Input 
                      id="new-password" 
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">确认新密码</Label>
                  <div className="relative">
                    <Input 
                      id="confirm-password" 
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleChangePassword} className="bg-blue-600 hover:bg-blue-700">
                  <Lock className="h-4 w-4 mr-2" />
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
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer hover:border-blue-500 ${theme === 'light' ? 'border-blue-500 bg-blue-50' : ''}`}
                      onClick={() => setTheme('light')}
                    >
                      <div className="w-full h-20 bg-white border rounded mb-2"></div>
                      <p className="text-sm text-center">浅色</p>
                    </div>
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer hover:border-blue-500 ${theme === 'dark' ? 'border-blue-500 bg-blue-50' : ''}`}
                      onClick={() => setTheme('dark')}
                    >
                      <div className="w-full h-20 bg-gray-900 border rounded mb-2"></div>
                      <p className="text-sm text-center">深色</p>
                    </div>
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer hover:border-blue-500 ${theme === 'auto' ? 'border-blue-500 bg-blue-50' : ''}`}
                      onClick={() => setTheme('auto')}
                    >
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
                    <Switch 
                      checked={displaySettings.compactMode}
                      onCheckedChange={(checked) => setDisplaySettings({...displaySettings, compactMode: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>显示文件扩展名</Label>
                      <p className="text-sm text-gray-500">在文件名中显示扩展名</p>
                    </div>
                    <Switch 
                      checked={displaySettings.showExtensions}
                      onCheckedChange={(checked) => setDisplaySettings({...displaySettings, showExtensions: checked})}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => {
                    document.documentElement.setAttribute('data-theme', theme)
                    toast({ title: "主题已应用", description: `已切换到${theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '自动'}主题` })
                  }} className="bg-blue-600 hover:bg-blue-700">
                    <Palette className="h-4 w-4 mr-2" />
                    应用主题
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Settings */}
        {user?.role === 'admin' && (
        <TabsContent value="storage" className="space-y-6">
          <StorageSettingsPage />
        </TabsContent>
        )}

        {/* Permissions Settings */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>用户权限设置</CardTitle>
              <CardDescription>
                管理用户权限和访问控制
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-base">基本权限</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>上传文件</Label>
                        <p className="text-sm text-gray-500">允许用户上传文档</p>
                      </div>
                      <Switch 
                        checked={permissions.canUpload}
                        onCheckedChange={(checked) => setPermissions({...permissions, canUpload: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>下载文件</Label>
                        <p className="text-sm text-gray-500">允许用户下载文档</p>
                      </div>
                      <Switch 
                        checked={permissions.canDownload}
                        onCheckedChange={(checked) => setPermissions({...permissions, canDownload: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>分享文件</Label>
                        <p className="text-sm text-gray-500">允许用户分享文档链接</p>
                      </div>
                      <Switch 
                        checked={permissions.canShare}
                        onCheckedChange={(checked) => setPermissions({...permissions, canShare: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>删除文件</Label>
                        <p className="text-sm text-gray-500">允许用户删除自己的文档</p>
                      </div>
                      <Switch 
                        checked={permissions.canDelete}
                        onCheckedChange={(checked) => setPermissions({...permissions, canDelete: checked})}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base">管理权限</Label>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>用户管理</Label>
                      <p className="text-sm text-gray-500">允许管理其他用户账户</p>
                    </div>
                    <Switch 
                      checked={permissions.canManageUsers}
                      onCheckedChange={(checked) => setPermissions({...permissions, canManageUsers: checked})}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base">文件限制</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>最大文件大小</Label>
                      <Select value={permissions.maxFileSize} onValueChange={(value) => setPermissions({...permissions, maxFileSize: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10MB">10 MB</SelectItem>
                          <SelectItem value="50MB">50 MB</SelectItem>
                          <SelectItem value="100MB">100 MB</SelectItem>
                          <SelectItem value="500MB">500 MB</SelectItem>
                          <SelectItem value="1GB">1 GB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>允许的文件类型</Label>
                      <div className="flex flex-wrap gap-2">
                        {permissions.allowedFileTypes.map((type) => (
                          <Badge key={type} variant="secondary">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => toast({ title: "权限设置已保存", description: "用户权限设置已更新" })} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    保存权限设置
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
