import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Eye, HardDrive, FileText } from 'lucide-react';
import { backendStorageService } from '@/lib/backendStorage';
import { API_FILES } from '@/lib/apiBase';

interface FileStatisticsProps {
  filename?: string;
}

export default function FileStatistics({ filename }: FileStatisticsProps) {
  const [viewCount, setViewCount] = useState<number>(0);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 如果提供了文件名，获取该文件的查看次数
    if (filename) {
      fetchFileViewCount(filename);
    }
    
    // 获取存储统计信息
    fetchStorageStats();
  }, [filename]);

  const fetchFileViewCount = async (filename: string) => {
    try {
      const response = await fetch(`${API_FILES}/view/${encodeURIComponent(filename)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setViewCount(data.data.viewCount);
        }
      }
    } catch (error) {
      console.error('获取文件查看次数失败:', error);
    }
  };

  const fetchStorageStats = async () => {
    try {
      setLoading(true);
      const result = await backendStorageService.getStorageStats();
      if (result.success && result.data) {
        setStorageStats(result.data);
      }
    } catch (error) {
      console.error('获取存储统计信息失败:', error);
    } finally {
      setLoading(false);
    }
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
      <CardHeader>
        <CardTitle>文件统计</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {filename && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Eye className="mr-2 h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">查看次数</span>
              </div>
              <span className="text-sm font-bold">{viewCount}</span>
            </div>
          </div>
        )}

        {storageStats && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">文件总数</span>
                </div>
                <span className="text-sm font-bold">{storageStats.totalFiles || 0}</span>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}