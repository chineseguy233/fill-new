import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { 
  Folder, 
  FolderPlus, 
  Search, 
  Edit,
  Trash2,
  FileText,
  Save,
  Lock,
  Globe,
  Settings
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { API_FOLDERS } from '@/lib/apiBase'

interface FolderItem {
  id: string
  name: string
  description?: string
  documentCount: number
  createdAt: string
  updatedAt: string
  visibility?: 'public' | 'private'
  permissions?: {
    owner: string
    viewers: string[]
    editors: string[]
  }
}

export default function FoldersPage() {
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<FolderItem | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderDescription, setNewFolderDescription] = useState('')
  const [newFolderVisibility, setNewFolderVisibility] = useState<'public' | 'private'>('public')
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false)
  const [permissionFolder, setPermissionFolder] = useState<FolderItem | null>(null)
  const { toast } = useToast()
  const navigate = useNavigate()

  // 点击文件夹进入文件夹详情
  const handleFolderClick = (folder: FolderItem) => {
    navigate(`/folders/${folder.id}`, { 
      state: { 
        folderName: folder.name,
        folderId: folder.id 
      } 
    })
  }

  // 监听权限更新事件
  useEffect(() => {
    const handlePermissionUpdate = (event: CustomEvent) => {
      const { folderId, visibility } = event.detail
      setFolders(prev => prev.map(f => 
        f.id === folderId ? { ...f, visibility } : f
      ))
      console.log(`文件夹 ${folderId} 权限已更新为: ${visibility}`)
    }

    window.addEventListener('folderPermissionUpdated', handlePermissionUpdate as EventListener)
    
    return () => {
      window.removeEventListener('folderPermissionUpdated', handlePermissionUpdate as EventListener)
    }
  }, [])

  // 从localStorage和后端存储加载文件夹数据
  useEffect(() => {
    const loadFolders = async () => {
      try {
        // 从localStorage获取所有文档
        const storedDocs = JSON.parse(localStorage.getItem('documents') || '[]')

        // 从后端API获取文件列表（用于统计文件数量）
        let backendFiles: any[] = []
        try {
          const response = await fetch(`${API_FOLDERS.replace('/folders', '/files')}/list`)
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data?.files) {
              backendFiles = result.data.files
              console.log('后端文件数量:', backendFiles.length)
            }
          }
        } catch (backendError) {
          console.warn('后端文件统计失败:', backendError)
        }

        // 新增：从后端获取真实文件夹列表，避免仅显示 localStorage 的文件夹
        let apiFolders: any[] = []
        try {
          const resp = await fetch(`${API_FOLDERS}`)
          if (resp.ok) {
            const json = await resp.json()
            if (json.success && Array.isArray(json.data)) {
              apiFolders = json.data
            }
          }
        } catch (apiErr) {
          console.warn('获取后端文件夹失败:', apiErr)
        }

        // 统计每个文件夹的文档数量
        const folderStats: { [key: string]: { count: number; lastModified: string } } = {}

        // 统计前端本地文档数据
        storedDocs.forEach((doc: any) => {
          const folderId = doc.folderId || 'root'
          if (!folderStats[folderId]) {
            folderStats[folderId] = { count: 0, lastModified: doc.createdAt || new Date().toISOString() }
          }
          folderStats[folderId].count++
          if (doc.createdAt && doc.createdAt > folderStats[folderId].lastModified) {
            folderStats[folderId].lastModified = doc.createdAt
          }
        })

        // 统计后端文件数量（需要根据文件夹归属进行分类）
        if (backendFiles.length > 0) {
          // 获取每个后端文件的文件夹归属
          for (const file of backendFiles) {
            try {
              const folderResponse = await fetch(`${API_FOLDERS.replace('/folders', '/files')}/folder/${encodeURIComponent(file.name)}`)
              let folderId = 'root' // 默认归属根目录
              
              if (folderResponse.ok) {
                const folderData = await folderResponse.json()
                if (folderData.success && folderData.data?.folderId) {
                  folderId = folderData.data.folderId
                }
              }
              
              if (!folderStats[folderId]) {
                folderStats[folderId] = { count: 0, lastModified: file.created || file.modified || new Date().toISOString() }
              }
              folderStats[folderId].count++
              
              const fileTime = file.created || file.modified || new Date().toISOString()
              if (fileTime > folderStats[folderId].lastModified) {
                folderStats[folderId].lastModified = fileTime
              }
            } catch (error) {
              console.warn(`获取文件 ${file.name} 的文件夹归属失败:`, error)
              // 归属获取失败，默认计入根目录
              if (!folderStats['root']) {
                folderStats['root'] = { count: 0, lastModified: new Date().toISOString() }
              }
              folderStats['root'].count++
            }
          }
          
          console.log('文件夹统计完成:', folderStats)
        }

        // 获取已保存的自定义文件夹（本地）
        const customFolders = JSON.parse(localStorage.getItem('folders') || '[]')

        // 默认根目录
        const defaultFolders = [
          { id: 'root', name: '根目录', description: '默认文档存储位置（包含后端存储文件）' }
        ]

        // 合并：根目录 + 后端文件夹 + 本地文件夹，按 id 去重
        const mergedMap = new Map<string, any>()
        ;[...defaultFolders, ...apiFolders, ...customFolders].forEach((f: any) => {
          if (f && f.id) {
            if (!mergedMap.has(f.id)) {
              mergedMap.set(f.id, f)
            } else {
              // 后端数据优先于本地，保持已有条目（默认先放后端再放本地即可）
            }
          }
        })
        const allFolders = Array.from(mergedMap.values())

        // 格式化为页面展示结构
        const formattedFolders: FolderItem[] = allFolders.map((folder: any) => ({
          id: folder.id,
          name: folder.name || '未命名文件夹',
          description: folder.description || '',
          documentCount: folderStats[folder.id]?.count || 0,
          createdAt: (folder.createdAt || new Date().toISOString()).split('T')[0],
          updatedAt: (folderStats[folder.id]?.lastModified || folder.updatedAt || new Date().toISOString()).split('T')[0],
          visibility: folder.visibility || 'public',
          permissions: folder.permissions || {
            owner: 'anonymous',
            viewers: [],
            editors: []
          }
        }))

        setFolders(formattedFolders)

        if (backendFiles.length > 0) {
          console.log(`文件夹统计已更新，根目录包含 ${backendFiles.length} 个后端文件`)
        }
      } catch (error) {
        console.error('加载文件夹失败:', error)
        // 如果加载失败，至少显示默认文件夹
        setFolders([
          {
            id: 'root',
            name: '根目录',
            description: '默认文档存储位置',
            documentCount: 0,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
          }
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadFolders()
  }, [])

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    folder.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 创建文件夹
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "请输入文件夹名称",
        variant: "destructive",
      })
      return
    }

    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      
      const newFolder: FolderItem = {
        id: Date.now().toString(),
        name: newFolderName.trim(),
        description: newFolderDescription.trim(),
        documentCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        visibility: newFolderVisibility,
        permissions: {
          owner: currentUser.id || 'anonymous',
          viewers: [],
          editors: []
        }
      }

      // 尝试通过API创建文件夹
      try {
        const response = await fetch(`${API_FOLDERS}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newFolder.name,
            description: newFolder.description,
            createdBy: currentUser.id || 'anonymous',
            visibility: newFolder.visibility,
            permissions: newFolder.permissions
          })
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            // 使用后端返回的数据
            const backendFolder = {
              ...result.data,
              documentCount: 0
            }
            setFolders(prev => [...prev, backendFolder])
            
            toast({
              title: "创建成功",
              description: `文件夹 "${newFolder.name}" 已创建`,
            })
          }
        } else {
          throw new Error('后端创建失败')
        }
      } catch (apiError) {
        console.warn('API创建失败，使用本地存储:', apiError)
        
        // 更新状态
        setFolders(prev => [...prev, newFolder])
        
        // 保存到localStorage
        const existingFolders = JSON.parse(localStorage.getItem('folders') || '[]')
        existingFolders.push(newFolder)
        localStorage.setItem('folders', JSON.stringify(existingFolders))
        
        toast({
          title: "创建成功",
          description: `文件夹 "${newFolder.name}" 已创建（本地存储）`,
        })
      }
      
      setNewFolderName('')
      setNewFolderDescription('')
      setNewFolderVisibility('public')
      setIsCreateDialogOpen(false)

    } catch (error) {
      console.error('创建文件夹失败:', error)
      toast({
        title: "创建失败",
        description: "创建文件夹时发生错误",
        variant: "destructive",
      })
    }
  }

  // 编辑文件夹
  const handleEditFolder = (folder: FolderItem) => {
    setEditingFolder(folder)
    setNewFolderName(folder.name)
    setNewFolderDescription(folder.description || '')
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingFolder || !newFolderName.trim()) {
      toast({
        title: "请输入文件夹名称",
        variant: "destructive",
      })
      return
    }

    setFolders(prev => prev.map(folder => 
      folder.id === editingFolder.id 
        ? {
            ...folder,
            name: newFolderName.trim(),
            description: newFolderDescription.trim(),
            updatedAt: new Date().toISOString().split('T')[0]
          }
        : folder
    ))

    setEditingFolder(null)
    setNewFolderName('')
    setNewFolderDescription('')
    setIsEditDialogOpen(false)

    toast({
      title: "更新成功",
      description: `文件夹 "${newFolderName}" 已更新`,
    })
  }

  // 删除文件夹
  const handleDeleteFolder = async (folder: FolderItem) => {
    try {
      // 如果是根目录，不允许删除
      if (folder.id === 'root') {
        toast({
          title: "无法删除",
          description: "根目录不能被删除",
          variant: "destructive",
        })
        return
      }

      // 尝试通过API删除
      try {
        const response = await fetch(`${API_FOLDERS}/${folder.id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            // 后端删除成功
            setFolders(prev => prev.filter(f => f.id !== folder.id))
            
            toast({
              title: "删除成功",
              description: `文件夹 "${folder.name}" 已删除`,
            })
            return
          } else {
            throw new Error(result.message || '后端删除失败')
          }
        } else {
          throw new Error('删除请求失败')
        }
      } catch (apiError) {
        console.warn('API删除失败，尝试本地删除:', apiError)
        
        // API删除失败，尝试本地删除
        setFolders(prev => prev.filter(f => f.id !== folder.id))
        
        // 从localStorage中删除
        const existingFolders = JSON.parse(localStorage.getItem('folders') || '[]')
        const filteredFolders = existingFolders.filter((f: any) => f.id !== folder.id)
        localStorage.setItem('folders', JSON.stringify(filteredFolders))
        
        toast({
          title: "删除成功",
          description: `文件夹 "${folder.name}" 已删除（本地删除）`,
        })
      }
    } catch (error) {
      console.error('删除文件夹失败:', error)
      toast({
        title: "删除失败",
        description: "删除文件夹时发生错误",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">文件夹管理</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">文件夹管理</h1>
          <p className="text-gray-600 mt-1">
            管理您的文档文件夹，共 {folders.length} 个文件夹
          </p>
        </div>
        
        {/* 创建文件夹对话框 */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <FolderPlus className="h-4 w-4 mr-2" />
              新建文件夹
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新文件夹</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name">文件夹名称</Label>
                <Input
                  id="folder-name"
                  placeholder="输入文件夹名称"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="folder-description">描述（可选）</Label>
                <Textarea
                  id="folder-description"
                  placeholder="输入文件夹描述"
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="folder-visibility">可见性</Label>
                <Select value={newFolderVisibility} onValueChange={(value: 'public' | 'private') => setNewFolderVisibility(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择可见性" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4" />
                        <span>所有人可见</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center space-x-2">
                        <Lock className="h-4 w-4" />
                        <span>仅自己可见</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreateFolder}>
                  <Save className="h-4 w-4 mr-2" />
                  创建
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 搜索栏 */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="搜索文件夹..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 编辑文件夹对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑文件夹</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-folder-name">文件夹名称</Label>
              <Input
                id="edit-folder-name"
                placeholder="输入文件夹名称"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-folder-description">描述（可选）</Label>
              <Textarea
                id="edit-folder-description"
                placeholder="输入文件夹描述"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSaveEdit}>
                <Save className="h-4 w-4 mr-2" />
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 文件夹网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFolders.map((folder) => (
          <Card key={folder.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 cursor-pointer" onClick={() => handleFolderClick(folder)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Folder className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{folder.name}</CardTitle>
                      {folder.visibility === 'private' ? (
                        <Lock className="h-4 w-4 text-gray-500" title="私有文件夹" />
                      ) : (
                        <Globe className="h-4 w-4 text-green-500" title="公开文件夹" />
                      )}
                    </div>
                    <CardDescription className="text-sm">
                      {folder.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => handleFolderClick(folder)}>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {folder.documentCount} 个文档
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {new Date(folder.updatedAt).toLocaleDateString()}
                </Badge>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditFolder(folder)
                  }}
                  className="flex-1"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  编辑
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation()
                    setPermissionFolder(folder)
                    setIsPermissionDialogOpen(true)
                  }}
                  title="权限设置"
                >
                  <Settings className="h-3 w-3" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除</AlertDialogTitle>
                      <AlertDialogDescription>
                        您确定要删除文件夹 "{folder.name}" 吗？此操作无法撤销。
                        {folder.documentCount > 0 && (
                          <span className="text-red-600 block mt-2">
                            注意：此文件夹包含 {folder.documentCount} 个文档，删除后这些文档将移至回收站。
                          </span>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteFolder(folder)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        删除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 权限管理对话框 */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>权限设置 - {permissionFolder?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>可见性设置</Label>
              <Select 
                value={permissionFolder?.visibility || 'public'} 
                onValueChange={async (value: 'public' | 'private') => {
                  if (permissionFolder) {
                    try {
                      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
                      
                      // 尝试通过API更新权限
                      try {
                        const response = await fetch(`${API_FOLDERS}/${permissionFolder.id}/permissions`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            visibility: value,
                            userId: currentUser.id || 'anonymous'
                          })
                        })

                        if (response.ok) {
                          const result = await response.json()
                          if (result.success) {
                            const updatedFolder = {
                              ...permissionFolder,
                              visibility: value
                            }
                            setPermissionFolder(updatedFolder)
                            setFolders(prev => prev.map(f => 
                              f.id === permissionFolder.id ? updatedFolder : f
                            ))
                            
                            toast({
                              title: "权限更新成功",
                              description: `文件夹 "${permissionFolder.name}" 的可见性已更新`,
                            })
                            return
                          }
                        }
                        throw new Error('API更新失败')
                      } catch (apiError) {
                        console.warn('API权限更新失败，使用本地更新:', apiError)
                        
                        // API失败，本地更新
                        const updatedFolder = {
                          ...permissionFolder,
                          visibility: value
                        }
                        setPermissionFolder(updatedFolder)
                        setFolders(prev => prev.map(f => 
                          f.id === permissionFolder.id ? updatedFolder : f
                        ))
                        
                        // 保存到localStorage - 确保正确更新
                        const existingFolders = JSON.parse(localStorage.getItem('folders') || '[]')
                        const updatedFolders = existingFolders.map((f: any) => 
                          f.id === permissionFolder.id ? { ...f, visibility: value } : f
                        )
                        localStorage.setItem('folders', JSON.stringify(updatedFolders))
                        
                        // 触发存储事件，通知其他组件更新
                        window.dispatchEvent(new CustomEvent('folderPermissionUpdated', {
                          detail: { folderId: permissionFolder.id, visibility: value }
                        }))
                        
                        toast({
                          title: "权限更新成功",
                          description: `文件夹 "${permissionFolder.name}" 的可见性已更新（本地保存）`,
                        })
                      }
                    } catch (error) {
                      console.error('权限更新失败:', error)
                      toast({
                        title: "权限更新失败",
                        description: "更新文件夹权限时发生错误",
                        variant: "destructive",
                      })
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-green-500" />
                      <span>所有人可见</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4 text-gray-500" />
                      <span>仅自己可见</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start space-x-2">
                {permissionFolder?.visibility === 'private' ? (
                  <Lock className="h-4 w-4 mt-0.5 text-gray-500" />
                ) : (
                  <Globe className="h-4 w-4 mt-0.5 text-green-500" />
                )}
                <div>
                  <p className="font-medium">
                    {permissionFolder?.visibility === 'private' ? '私有文件夹' : '公开文件夹'}
                  </p>
                  <p className="text-xs mt-1">
                    {permissionFolder?.visibility === 'private' 
                      ? '只有您可以查看和管理此文件夹中的内容'
                      : '所有用户都可以查看此文件夹中的内容'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>
                关闭
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 空状态 */}
      {filteredFolders.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            未找到匹配的文件夹
          </h3>
          <p className="text-gray-600">
            尝试使用不同的关键词搜索
          </p>
        </div>
      )}
    </div>
  )
}
