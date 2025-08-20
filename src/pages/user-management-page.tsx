import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { getAllUsers, updateUser, deleteUser, User } from '@/lib/auth'
import { Shield, Settings, Trash2 } from 'lucide-react'

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const result = await getAllUsers()
      if (result.success && result.users) {
        setUsers(result.users)
      } else {
        toast({
          title: '加载失败',
          description: result.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '加载失败',
        description: '获取用户列表时发生错误',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const result = await updateUser(userId, { role: newRole })
      if (result.success) {
        toast({
          title: '更新成功',
          description: result.message
        })
        loadUsers()
      } else {
        toast({
          title: '更新失败',
          description: result.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '更新失败',
        description: '更新用户角色时发生错误',
        variant: 'destructive'
      })
    }
  }

  const handlePermissionChange = async (permission: keyof User['permissions'], value: boolean) => {
    if (!selectedUser) return

    try {
      const result = await updateUser(selectedUser.id, {
        permissions: {
          ...selectedUser.permissions,
          [permission]: value
        }
      })
      if (result.success) {
        toast({
          title: '更新成功',
          description: result.message
        })
        loadUsers()
        // 更新选中用户的权限显示
        setSelectedUser({
          ...selectedUser,
          permissions: {
            ...selectedUser.permissions,
            [permission]: value
          }
        })
      } else {
        toast({
          title: '更新失败',
          description: result.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '更新失败',
        description: '更新用户权限时发生错误',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const result = await deleteUser(userId)
      if (result.success) {
        toast({
          title: '删除成功',
          description: result.message
        })
        loadUsers()
      } else {
        toast({
          title: '删除失败',
          description: result.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '删除失败',
        description: '删除用户时发生错误',
        variant: 'destructive'
      })
    }
  }

  const openPermissionDialog = (user: User) => {
    setSelectedUser(user)
    setPermissionDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载用户列表...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">用户权限管理</h1>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <CardTitle className="text-lg">{user.username}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                    {user.phone && (
                      <CardDescription className="text-sm text-muted-foreground">
                        {user.phone}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? '管理员' : '普通用户'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPermissionDialog(user)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    权限设置
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除用户</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除用户 "{user.username}" 吗？此操作不可撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`role-${user.id}`} className="text-sm font-medium">
                    用户角色
                  </Label>
                  <Select
                    value={user.role}
                    onValueChange={(value: 'admin' | 'user') => handleRoleChange(user.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">普通用户</SelectItem>
                      <SelectItem value="admin">管理员</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium mb-2 block">权限概览</Label>
                  <div className="flex flex-wrap gap-2">
                    {user.permissions.canView && <Badge variant="outline">查看</Badge>}
                    {user.permissions.canUpload && <Badge variant="outline">上传</Badge>}
                    {user.permissions.canDownload && <Badge variant="outline">下载</Badge>}
                    {user.permissions.canDelete && <Badge variant="outline">删除</Badge>}
                    {user.permissions.canManageUsers && <Badge variant="outline">用户管理</Badge>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 权限设置对话框 */}
      <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>权限设置</DialogTitle>
            <DialogDescription>
              为用户 "{selectedUser?.username}" 设置详细权限
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="canView">查看文档</Label>
                <Switch
                  id="canView"
                  checked={selectedUser.permissions.canView}
                  onCheckedChange={(checked) => handlePermissionChange('canView', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="canUpload">上传文档</Label>
                <Switch
                  id="canUpload"
                  checked={selectedUser.permissions.canUpload}
                  onCheckedChange={(checked) => handlePermissionChange('canUpload', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="canDownload">下载文档</Label>
                <Switch
                  id="canDownload"
                  checked={selectedUser.permissions.canDownload}
                  onCheckedChange={(checked) => handlePermissionChange('canDownload', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="canDelete">删除文档</Label>
                <Switch
                  id="canDelete"
                  checked={selectedUser.permissions.canDelete}
                  onCheckedChange={(checked) => handlePermissionChange('canDelete', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="canManageUsers">用户管理</Label>
                <Switch
                  id="canManageUsers"
                  checked={selectedUser.permissions.canManageUsers}
                  onCheckedChange={(checked) => handlePermissionChange('canManageUsers', checked)}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}