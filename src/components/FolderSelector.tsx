import { useState, useEffect, useRef } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { FolderOpen, Plus } from 'lucide-react'

interface Folder {
  id: string
  name: string
  path: string
}

interface FolderSelectorProps {
  selectedFolderId?: string
  onFolderChange: (folderId: string) => void
  className?: string
}

export default function FolderSelector({ selectedFolderId, onFolderChange, className }: FolderSelectorProps) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const isMountedRef = useRef(true)
  const { toast } = useToast()

  useEffect(() => {
    loadFolders()
    
    // 组件卸载时清理
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadFolders = () => {
    if (!isMountedRef.current) return
    
    // 模拟获取文件夹列表
    const mockFolders: Folder[] = [
      { id: 'root', name: '根目录', path: '/' },
      { id: 'documents', name: '文档', path: '/documents' },
      { id: 'images', name: '图片', path: '/images' },
      { id: 'projects', name: '项目文件', path: '/projects' },
      { id: 'archive', name: '归档', path: '/archive' }
    ]
    
    if (isMountedRef.current) {
      setFolders(mockFolders)
      
      // 如果没有选中的文件夹，默认选择根目录
      if (!selectedFolderId && mockFolders.length > 0) {
        onFolderChange(mockFolders[0].id)
      }
    }
  }

  const handleCreateFolder = async () => {
    if (!isMountedRef.current) return
    
    if (!newFolderName.trim()) {
      toast({
        title: '文件夹名称不能为空',
        variant: 'destructive'
      })
      return
    }

    setIsCreating(true)
    try {
      // 模拟创建文件夹
      const newFolder: Folder = {
        id: `folder_${Date.now()}`,
        name: newFolderName.trim(),
        path: `/${newFolderName.trim().toLowerCase().replace(/\s+/g, '-')}`
      }

      if (isMountedRef.current) {
        // 更新文件夹列表
        setFolders(prev => [...prev, newFolder])
        
        // 立即选中新创建的文件夹
        onFolderChange(newFolder.id)
        
        // 清理表单并关闭对话框
        setNewFolderName('')
        setIsCreateDialogOpen(false)
        
        toast({
          title: '文件夹创建成功',
          description: `文件夹 "${newFolder.name}" 已创建并选中`
        })
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast({
          title: '创建文件夹失败',
          description: '创建文件夹时发生错误',
          variant: 'destructive'
        })
      }
    } finally {
      if (isMountedRef.current) {
        setIsCreating(false)
      }
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>选择文件夹</Label>
      <div className="flex space-x-2">
        <Select value={selectedFolderId} onValueChange={onFolderChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="请选择文件夹" />
          </SelectTrigger>
          <SelectContent>
            {folders.map((folder) => (
              <SelectItem key={folder.id} value={folder.id}>
                <div className="flex items-center space-x-2">
                  <FolderOpen className="h-4 w-4" />
                  <span>{folder.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>创建新文件夹</DialogTitle>
              <DialogDescription>
                输入新文件夹的名称
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folderName">文件夹名称</Label>
                <Input
                  id="folderName"
                  placeholder="输入文件夹名称"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateFolder()
                    }
                  }}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  setNewFolderName('')
                }}
                disabled={isCreating}
              >
                取消
              </Button>
              <Button
                onClick={handleCreateFolder}
                disabled={isCreating || !newFolderName.trim()}
              >
                {isCreating ? '创建中...' : '创建文件夹'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {selectedFolderId && (
        <p className="text-sm text-muted-foreground">
          文件将上传到: {folders.find(f => f.id === selectedFolderId)?.name || '未知文件夹'}
        </p>
      )}
    </div>
  )
}