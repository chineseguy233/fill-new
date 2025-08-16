import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { FolderOpen, Plus, ChevronDown } from 'lucide-react'

interface Folder {
  id: string
  name: string
  path: string
}

interface SimpleFolderSelectorProps {
  selectedFolderId?: string
  onFolderChange: (folderId: string) => void
  className?: string
}

export default function SimpleFolderSelector({ selectedFolderId, onFolderChange, className }: SimpleFolderSelectorProps) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const isMountedRef = useRef(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadFolders()
    
    // 点击外部关闭下拉菜单
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    
    // 组件卸载时清理
    return () => {
      isMountedRef.current = false
      document.removeEventListener('mousedown', handleClickOutside)
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

  const handleFolderSelect = (folderId: string) => {
    if (isMountedRef.current) {
      onFolderChange(folderId)
      setIsDropdownOpen(false)
    }
  }

  const selectedFolder = folders.find(f => f.id === selectedFolderId)

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>选择文件夹</Label>
      <div className="flex space-x-2">
        <div className="relative flex-1" ref={dropdownRef}>
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-4 w-4" />
              <span>{selectedFolder?.name || '请选择文件夹'}</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </Button>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                  onClick={() => handleFolderSelect(folder.id)}
                >
                  <FolderOpen className="h-4 w-4" />
                  <span>{folder.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
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
          文件将上传到: {selectedFolder?.name || '未知文件夹'}
        </p>
      )}
    </div>
  )
}