import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { FolderOpen, Plus } from 'lucide-react'

interface Folder {
  id: string
  name: string
  path: string
}

interface FileMoveDialogProps {
  isOpen: boolean
  onClose: () => void
  fileId: string
  fileName: string
  currentFolderId?: string
  onMoveComplete: () => void
}

export default function FileMoveDialog({
  isOpen,
  onClose,
  fileId,
  fileName,
  currentFolderId,
  onMoveComplete
}: FileMoveDialogProps) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string>('')
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadFolders()
    }
  }, [isOpen])

  const loadFolders = () => {
    // 模拟获取文件夹列表
    const mockFolders: Folder[] = [
      { id: 'root', name: '根目录', path: '/' },
      { id: 'documents', name: '文档', path: '/documents' },
      { id: 'images', name: '图片', path: '/images' },
      { id: 'projects', name: '项目文件', path: '/projects' },
      { id: 'archive', name: '归档', path: '/archive' }
    ]
    
    // 过滤掉当前文件夹
    const availableFolders = mockFolders.filter(folder => folder.id !== currentFolderId)
    setFolders(availableFolders)
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: '文件夹名称不能为空',
        variant: 'destructive'
      })
      return
    }

    setIsCreatingFolder(true)
    try {
      // 模拟创建文件夹
      const newFolder: Folder = {
        id: `folder_${Date.now()}`,
        name: newFolderName.trim(),
        path: `/${newFolderName.trim().toLowerCase().replace(/\s+/g, '-')}`
      }

      // 更新文件夹列表并立即选中新文件夹
      setFolders(prev => [...prev, newFolder])
      setSelectedFolderId(newFolder.id)
      setNewFolderName('')
      
      toast({
        title: '文件夹创建成功',
        description: `文件夹 "${newFolder.name}" 已创建并选中`
      })
    } catch (error) {
      toast({
        title: '创建文件夹失败',
        description: '创建文件夹时发生错误',
        variant: 'destructive'
      })
    } finally {
      setIsCreatingFolder(false)
    }
  }

  const handleMoveFile = async () => {
    if (!selectedFolderId) {
      toast({
        title: '请选择目标文件夹',
        variant: 'destructive'
      })
      return
    }

    setIsMoving(true)
    try {
      // 模拟文件移动
      const targetFolder = folders.find(f => f.id === selectedFolderId)
      
      // 在实际应用中，这里会调用API移动文件
      console.log(`移动文件 ${fileName} (ID: ${fileId}) 到文件夹 ${targetFolder?.name}`)
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: '文件移动成功',
        description: `文件 "${fileName}" 已移动到 "${targetFolder?.name}"`
      })
      
      onMoveComplete()
      onClose()
    } catch (error) {
      toast({
        title: '文件移动失败',
        description: '移动文件时发生错误',
        variant: 'destructive'
      })
    } finally {
      setIsMoving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>移动文件</DialogTitle>
          <DialogDescription>
            将文件 "{fileName}" 移动到指定文件夹
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>选择目标文件夹</Label>
            <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
              <SelectTrigger>
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
          </div>

          <div className="space-y-2">
            <Label>或创建新文件夹</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="输入新文件夹名称"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder()
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={handleCreateFolder}
                disabled={isCreatingFolder || !newFolderName.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isMoving}
          >
            取消
          </Button>
          <Button
            onClick={handleMoveFile}
            disabled={isMoving || !selectedFolderId}
          >
            {isMoving ? '移动中...' : '移动文件'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}