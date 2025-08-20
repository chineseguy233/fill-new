import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { API_FILES } from '@/lib/apiBase';

interface FileViewCounterProps {
  filename: string;
  className?: string;
}

export const FileViewCounter: React.FC<FileViewCounterProps> = ({ filename, className = '' }) => {
  const [viewCount, setViewCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchViewCount();
  }, [filename]);

  const fetchViewCount = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_FILES}/view/${encodeURIComponent(filename)}`);
      if (response.ok) {
        const result = await response.json();
        setViewCount(result.data.viewCount);
      }
    } catch (error) {
      console.error('获取文件查看次数失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-1 text-sm text-muted-foreground ${className}`}>
        <Eye className="h-4 w-4" />
        <span>加载中...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 text-sm text-muted-foreground ${className}`}>
      <Eye className="h-4 w-4" />
      <span>{viewCount} 次查看</span>
    </div>
  );
};

export default FileViewCounter;