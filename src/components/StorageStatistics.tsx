import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { HardDrive, FileText, Folder, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { backendStorageService } from '@/lib/backendStorage';
import { useToast } from '@/hooks/use-toast';

export default function StorageStatistics() {
  const [storageStats, setStorageStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStorageStats();
  }, []);

  const fetchStorageStats = async () => {
    try {
      setLoading(true);
      const result = await backendStorageService.getStorageStats();
      if (result.success && result.data) {
        setStorageStats(result.data);
      } else {
        throw new Error(result.message || '获取存储统计信息失败');
      }
    } catch (error) {
      console.error('获取存储统计信息失败:', error);
      toast({
        title: "获取存储统计失败",
        description: "无法获取存储统计信息，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStorageStats();
    setRefreshing(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>存储统计</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {storageStats && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">文件总数</span>
                </div>
                <span className="text-sm font-bold">{storageStats.totalFiles || 0}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Folder className="mr-2 h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">文件夹总数</span>
                </div>
                <span className="text-sm font-bold">{storageStats.totalFolders || 0}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <HardDrive className="mr-2 h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">存储空间</span>
                </div>
                <span className="text-sm font-bold">{formatFileSize(storageStats.totalSize || 0)}</span>
              </div>
              <Progress value={Math.min((storageStats.totalSize / (1024 * 1024 * 1024)) * 100, 100)} />
              <div className="text-xs text-gray-500 text-right">
                {formatFileSize(storageStats.totalSize || 0)} / 1 GB
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-2">
              存储路径: {storageStats.storagePath || '未设置'}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}