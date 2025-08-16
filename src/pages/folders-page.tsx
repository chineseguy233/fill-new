import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { 
  Folder, 
  FolderPlus, 
  Search, 
  Edit,
  Trash2,
  FileText,
  Save
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface FolderItem {
  id: string
  name: string
  description?: string
  documentCount: number
  createdAt: string
  updatedAt: string
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

  // 从localStorage和后端存储加载文件夹数据
  useEffect(() => {
    const loadFolders = async () => {
      try {
        // 从localStorage获取所有文档
        const storedDocs = JSON.parse(localStorage.getItem('documents') || '[]')
        
        // 尝试从后端获取文件列表
        let backendFileCount = 0
        try {
          const backendModule = await import('@/lib/backendStorage')
          const backendResult = await backendModule.backendStorageService.getFileList()
          
          if (backendResult.success && backendResult.data?.files) {
            backendFileCount = backendResult.data.files.length
            console.log('后端文件数量:', backendFileCount)
          }
        } catch (backendError) {
          console.warn('后端文件统计失败:', backendError)
        }
        
        // 统计每个文件夹的文档数量
        const folderStats: { [key: string]: { count: number; lastModified: string } } = {}
        
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

        // 将后端文件计入根目录
        if (backendFileCount > 0) {
          if (!folderStats['root']) {
            folderStats['root'] = { count: 0, lastModified: new Date().toISOString() }
          }
          folderStats['root'].count += backendFileCount
        }

        // 获取已保存的自定义文件夹
        const customFolders = JSON.parse(localStorage.getItem('folders') || '[]')
        
        // 创建默认文件夹列表
        const defaultFolders = [
          { id: 'root', name: '根目录', description: '默认文档存储位置（包含后端存储文件）' },
          { id: 'documents', name: '文档', description: '一般文档文件' },
          { id: 'images', name: '图片', description: '图片和媒体文件' },
          { id: 'projects', name: '项目文件', description: '项目相关文档' },
          { id: 'archive', name: '归档', description: '已归档的文件' }
        ]

        // 合并默认文件夹和自定义文件夹
        const allFolders = [...defaultFolders, ...customFolders]
        
        // 格式化文件夹数据
        const formattedFolders: FolderItem[] = allFolders.map(folder => ({
          id: folder.id,
          name: folder.name,
          description: folder.description || '',
          documentCount: folderStats[folder.id]?.count || 0,
          createdAt: folder.createdAt || new Date().toISOString().split('T')[0],
          updatedAt: folderStats[folder.id]?.lastModified?.split('T')[0] || new Date().toISOString().split('T')[0]
        }))

        setFolders(formattedFolders)
        
        if (backendFileCount > 0) {
          console.log(`文件夹统计已更新，根目录包含 ${backendFileCount} 个后端文件`)
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
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: "请输入文件夹名称",
        variant: "destructive",
      })
      return
    }

    const newFolder: FolderItem = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      description: newFolderDescription.trim(),
      documentCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    }

    // 更新状态
    setFolders(prev => [...prev, newFolder])
    
    // 保存到localStorage
    try {
      const existingFolders = JSON.parse(localStorage.getItem('folders') || '[]')
      existingFolders.push(newFolder)
      localStorage.setItem('folders', JSON.stringify(existingFolders))
      console.log('文件夹已保存到localStorage:', newFolder)
    } catch (error) {
      console.error('保存文件夹失败:', error)
    }
    
    setNewFolderName('')
    setNewFolderDescription('')
    setIsCreateDialogOpen(false)

    toast({
      title: "创建成功",
      description: `文件夹 "${newFolder.name}" 已创建`,
    })
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
  const handleDeleteFolder = (folder: FolderItem) => {
    // 更新状态
    setFolders(prev => prev.filter(f => f.id !== folder.id))
    
    // 从localStorage中删除
    try {
      const existingFolders = JSON.parse(localStorage.getItem('folders') || '[]')
      const filteredFolders = existingFolders.filter((f: any) => f.id !== folder.id)
      localStorage.setItem('folders', JSON.stringify(filteredFolders))
      console.log('文件夹已从localStorage删除:', folder.name)
    } catch (error) {
      console.error('删除文件夹失败:', error)
    }
    
    toast({
      title: "删除成功",
      description: `文件夹 "${folder.name}" 已删除`,
      variant: "destructive",
    })
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
                    <CardTitle className="text-lg">{folder.name}</CardTitle>
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