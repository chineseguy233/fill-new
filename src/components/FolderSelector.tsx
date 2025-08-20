import { useState, useEffect, useRef } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { API_FOLDERS } from '../lib/apiBase'
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

  const loadFolders = async () => {
    if (!isMountedRef.current) return
    
    try {
      // 从后端获取文件夹列表
      const response = await fetch(`${API_FOLDERS}`);
      
      if (!response.ok) {
        throw new Error('获取文件夹列表失败');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        // 转换后端数据格式为组件所需格式
        const folderList: Folder[] = data.data.map((folder: any) => ({
          id: folder.id,
          name: folder.name,
          path: folder.path || `/${folder.name}`
        }));
        
        // 添加根目录选项
        if (!folderList.some(f => f.id === 'root')) {
          folderList.unshift({ id: 'root', name: '根目录', path: '/' });
        }
        
        if (isMountedRef.current) {
          setFolders(folderList);
          
          // 如果没有选中的文件夹，默认选择根目录
          if (!selectedFolderId && folderList.length > 0) {
            onFolderChange(folderList[0].id);
          }
        }
      } else {
        throw new Error(data.message || '获取文件夹列表失败');
      }
    } catch (error) {
      console.error('加载文件夹失败:', error);
      toast({
        title: '加载文件夹失败',
        description: error instanceof Error ? error.message : '无法获取文件夹列表',
        variant: 'destructive'
      });
      
      // 加载失败时使用默认文件夹
      const defaultFolders: Folder[] = [
        { id: 'root', name: '根目录', path: '/' }
      ];
      
      if (isMountedRef.current) {
        setFolders(defaultFolders);
        
        if (!selectedFolderId) {
          onFolderChange(defaultFolders[0].id);
        }
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
      // 调用后端API创建文件夹
      const response = await fetch(`${API_FOLDERS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newFolderName.trim()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '创建文件夹失败');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const newFolder: Folder = {
          id: data.data.id,
          name: data.data.name,
          path: data.data.path || `/${data.data.name}`
        };
        
        if (isMountedRef.current) {
          // 更新文件夹列表
          setFolders(prev => [...prev, newFolder]);
          
          // 立即选中新创建的文件夹
          onFolderChange(newFolder.id);
          
          // 清理表单并关闭对话框
          setNewFolderName('');
          setIsCreateDialogOpen(false);
          
          toast({
            title: '文件夹创建成功',
            description: `文件夹 "${newFolder.name}" 已创建并选中`
          });
        }
      } else {
        throw new Error(data.message || '创建文件夹失败');
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('创建文件夹失败:', error);
        toast({
          title: '创建文件夹失败',
          description: error instanceof Error ? error.message : '创建文件夹时发生错误',
          variant: 'destructive'
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsCreating(false);
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