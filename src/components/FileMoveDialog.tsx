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
    try {
      // 从localStorage加载真实的文件夹数据
      const storedFolders = localStorage.getItem('folders')
      let allFolders: Folder[] = []
      
      if (storedFolders) {
        const parsedFolders = JSON.parse(storedFolders)
        allFolders = parsedFolders.map((folder: any) => ({
          id: folder.id,
          name: folder.name,
          path: folder.path || `/${folder.name}`
        }))
      }
      
      // 确保根目录存在
      if (!allFolders.find(f => f.id === 'root')) {
        allFolders.unshift({ id: 'root', name: '根目录', path: '/' })
      }
      
      // 过滤掉当前文件夹
      const availableFolders = allFolders.filter(folder => folder.id !== currentFolderId)
      setFolders(availableFolders)
      
      console.log('加载的文件夹列表:', availableFolders)
    } catch (error) {
      console.error('加载文件夹失败:', error)
      // 如果加载失败，至少提供根目录
      setFolders([{ id: 'root', name: '根目录', path: '/' }])
    }
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
      // 创建新文件夹
      const newFolder: Folder = {
        id: `folder_${Date.now()}`,
        name: newFolderName.trim(),
        path: `/${newFolderName.trim().toLowerCase().replace(/\s+/g, '-')}`
      }

      // 保存到localStorage
      const storedFolders = localStorage.getItem('folders')
      let allFolders = []
      
      if (storedFolders) {
        allFolders = JSON.parse(storedFolders)
      }
      
      // 检查是否已存在同名文件夹
      const existingFolder = allFolders.find((f: any) => f.name === newFolder.name)
      if (existingFolder) {
        toast({
          title: '文件夹已存在',
          description: `文件夹 "${newFolder.name}" 已存在`,
          variant: 'destructive'
        })
        return
      }
      
      // 添加新文件夹到localStorage
      allFolders.push({
        id: newFolder.id,
        name: newFolder.name,
        path: newFolder.path,
        parentId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      localStorage.setItem('folders', JSON.stringify(allFolders))

      // 更新本地状态并立即选中新文件夹
      setFolders(prev => [...prev, newFolder])
      setSelectedFolderId(newFolder.id)
      setNewFolderName('')
      
      console.log('新文件夹已创建并保存:', newFolder)
      
      toast({
        title: '文件夹创建成功',
        description: `文件夹 "${newFolder.name}" 已创建并选中`
      })
    } catch (error) {
      console.error('创建文件夹失败:', error)
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
      const targetFolder = folders.find(f => f.id === selectedFolderId)
      
      // 更新localStorage中的文档数据
      const storedDocuments = localStorage.getItem('documents')
      if (storedDocuments) {
        const documents = JSON.parse(storedDocuments)
        const documentIndex = documents.findIndex((doc: any) => doc.id === fileId)
        
        if (documentIndex !== -1) {
          // 更新文档的文件夹ID
          documents[documentIndex].folderId = selectedFolderId
          documents[documentIndex].updatedAt = new Date().toISOString()
          
          // 保存更新后的文档数据
          localStorage.setItem('documents', JSON.stringify(documents))
          
          console.log(`文件 ${fileName} 已移动到文件夹 ${targetFolder?.name}`)
        }
      }
      
      // 调用后端API移动文件（如果需要）
      try {
        const response = await fetch(`/api/files/move/${fileId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            folderId: selectedFolderId
          })
        })
        
        if (!response.ok) {
          console.warn('后端API调用失败，但本地数据已更新')
        }
      } catch (apiError) {
        console.warn('后端API不可用，仅更新本地数据:', apiError)
      }
      
      toast({
        title: '文件移动成功',
        description: `文件 "${fileName}" 已移动到 "${targetFolder?.name}"`
      })
      
      onMoveComplete()
      onClose()
    } catch (error) {
      console.error('文件移动失败:', error)
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