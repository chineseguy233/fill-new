import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen, Plus, RefreshCw } from 'lucide-react';
import { API_FOLDERS } from '@/lib/apiBase';

interface Folder {
  id: string;
  name: string;
  path: string;
}

interface SimpleFolderSelectorProps {
  selectedFolderId?: string;
  onFolderChange: (folderId: string) => void;
  className?: string;
}

export default function SimpleFolderSelector({
  selectedFolderId,
  onFolderChange,
  className
}: SimpleFolderSelectorProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFolders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizeServerFolders = (raw: any): Folder[] => {
    const list: any[] =
      (Array.isArray(raw?.data?.folders) && raw.data.folders) ||
      (Array.isArray(raw?.data) && raw.data) ||
      (Array.isArray(raw?.folders) && raw.folders) ||
      (Array.isArray(raw) && raw) ||
      [];

    return list.map((f: any) => {
      const name = String(f.name ?? f.title ?? '未命名');
      const id =
        String(f.id ?? f._id ?? f.uuid ?? name.toLowerCase().replace(/\s+/g, '-'));
      const path =
        String(f.path ?? `/${name.toLowerCase().replace(/\s+/g, '-')}`);
      return { id, name, path };
    });
  };

  const loadFolders = async () => {
    setIsLoading(true);
    try {
      // 优先从后端加载
      const resp = await fetch(`${API_FOLDERS}`);
      const data = await resp.json().catch(() => ({}));

      if (resp.ok) {
        const serverFolders = normalizeServerFolders(data);
        const allFolders: Folder[] = [{ id: 'root', name: '根目录', path: '/' }, ...serverFolders];
        setFolders(allFolders);
        if (!selectedFolderId && allFolders.length > 0) {
          onFolderChange(allFolders[0].id);
        }
        return;
      }

      // 后端不可用则回退 localStorage
      fallbackLoadFromLocal();
    } catch (e) {
      // 回退 localStorage
      fallbackLoadFromLocal();
    } finally {
      setIsLoading(false);
    }
  };

  const fallbackLoadFromLocal = () => {
    try {
      const customFoldersStr = localStorage.getItem('folders');
      const customFolders = customFoldersStr ? JSON.parse(customFoldersStr) : [];

      const defaultFolders: Folder[] = [{ id: 'root', name: '根目录', path: '/' }];

      const userFolders: Folder[] = customFolders.map((folder: any) => ({
        id: String(folder.id),
        name: String(folder.name),
        path: `/${String(folder.name).toLowerCase().replace(/\s+/g, '-')}`
      }));

      const allFolders = [...defaultFolders, ...userFolders];
      setFolders(allFolders);

      if (!selectedFolderId && allFolders.length > 0) {
        onFolderChange(allFolders[0].id);
      }
    } catch {
      const fallbackFolders = [{ id: 'root', name: '根目录', path: '/' }];
      setFolders(fallbackFolders);
      if (!selectedFolderId) {
        onFolderChange('root');
      }
    }
  };

  const handleCreateFolder = async () => {
    const trimmedName = newFolderName.trim();
    if (!trimmedName) {
      toast({
        title: '文件夹名称不能为空',
        variant: 'destructive'
      });
      return;
    }

    // 名称去重（前端本地校验）
    const nameExists = folders.some(
      (folder) => folder.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (nameExists) {
      toast({
        title: '文件夹名称已存在',
        description: '请使用不同的文件夹名称',
        variant: 'destructive'
      });
      return;
    }

    setIsCreating(true);
    try {
      // 优先调用后端创建
      const resp = await fetch(`${API_FOLDERS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName })
      });
      const res = await resp.json().catch(() => ({}));

      if (resp.ok && (res?.success ?? true)) {
        const created =
          res?.data ??
          res?.folder ?? {
            id: Date.now().toString(),
            name: trimmedName,
            path: `/${trimmedName.toLowerCase().replace(/\s+/g, '-')}`
          };

        const newFolder: Folder = {
          id: String(created.id ?? created._id ?? created.uuid ?? created.name),
          name: String(created.name ?? trimmedName),
          path:
            String(
              created.path ??
                `/${(created.name ?? trimmedName).toLowerCase().replace(/\s+/g, '-')}`
            )
        };

        const updated = [...folders, newFolder];
        setFolders(updated);
        onFolderChange(newFolder.id);

        setNewFolderName('');
        setIsCreateDialogOpen(false);

        toast({
          title: '文件夹创建成功',
          description: `文件夹 "${newFolder.name}" 已创建并选中`
        });
        return;
      }

      // 后端失败时，回退到本地保存策略
      const newFolderData = {
        id: Date.now().toString(),
        name: trimmedName,
        description: `创建于 ${new Date().toLocaleString()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const newFolder: Folder = {
        id: newFolderData.id,
        name: newFolderData.name,
        path: `/${newFolderData.name.toLowerCase().replace(/\s+/g, '-')}`
      };

      const existingFoldersStr = localStorage.getItem('folders');
      const existingFolders = existingFoldersStr ? JSON.parse(existingFoldersStr) : [];
      existingFolders.push(newFolderData);
      localStorage.setItem('folders', JSON.stringify(existingFolders));

      const updated = [...folders, newFolder];
      setFolders(updated);
      onFolderChange(newFolder.id);

      setNewFolderName('');
      setIsCreateDialogOpen(false);

      toast({
        title: '文件夹创建成功(本地)',
        description: `文件夹 "${newFolder.name}" 已创建并选中（后端失败，已使用本地兜底）`
      });
    } catch (error: any) {
      toast({
        title: '创建文件夹失败',
        description: error?.message || '创建文件夹时发生错误',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleFolderSelect = (folderId: string) => {
    onFolderChange(folderId);
  };

  const handleRefresh = () => {
    loadFolders();
  };

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className || ''}`}>
        <Label>选择文件夹</Label>
        <div className="flex space-x-2">
          <Select disabled>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="加载中..." />
            </SelectTrigger>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <Label>选择文件夹</Label>
      <div className="flex space-x-2">
        <Select value={selectedFolderId || ''} onValueChange={handleFolderSelect}>
          <SelectTrigger className="w-full">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-4 w-4" />
              <SelectValue placeholder="请选择文件夹" />
            </div>
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

        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          title="刷新文件夹列表"
          type="button"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" title="创建新文件夹" type="button">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>创建新文件夹</DialogTitle>
              <DialogDescription>输入新文件夹的名称</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folderName">文件夹名称</Label>
                <Input
                  id="folderName"
                  placeholder="输入文件夹名称"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isCreating && newFolderName.trim()) {
                      e.preventDefault();
                      handleCreateFolder();
                    }
                  }}
                  disabled={isCreating}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setNewFolderName('');
                }}
                disabled={isCreating}
                type="button"
              >
                取消
              </Button>
              <Button onClick={handleCreateFolder} disabled={isCreating || !newFolderName.trim()} type="button">
                {isCreating ? '创建中...' : '创建文件夹'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {selectedFolderId && (
        <p className="text-sm text-muted-foreground">
          文件将上传到: {folders.find((f) => f.id === selectedFolderId)?.name || '未知文件夹'}
        </p>
      )}
    </div>
  );
}