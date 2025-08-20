import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { backendStorageService } from '@/lib/backendStorage';
import { API_FILES } from '@/lib/apiBase';
import FilePreviewer from '@/components/FilePreviewers';

export default function DocumentPreviewPage() {
  const { id, filename } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [docFile, setDocFile] = useState<{ filename: string; originalName?: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 1) 优先从 URL 参数/查询参数获取文件名
        const fileParam = filename || searchParams.get('file');
        const displayName = searchParams.get('displayName') || undefined;

        if (fileParam) {
        setDocFile({ filename: fileParam, originalName: displayName });
        // 构建预览URL
        const url = `${API_FILES}/preview/${encodeURIComponent(fileParam)}`;
        setPreviewUrl(url);
        setLoading(false);
        return;
        }

        // 2) 兜底：从本地 documents 中按 id 取文件（仅在未提供 filename 时）
        const stored = JSON.parse(localStorage.getItem('documents') || '[]');
        const doc = stored.find((d: any) => String(d.id) === String(id));
        const file = doc?.files?.[0];

        if (!file) {
          toast({
            title: '无法找到文件',
            description: '请返回后重试',
            variant: 'destructive'
          });
          navigate('/documents');
          return;
        }

        setDocFile({ filename: file.filename, originalName: file.originalName });
        // 构建预览URL
        const url = `${API_FILES}/preview/${encodeURIComponent(file.filename)}`;
        setPreviewUrl(url);
      } catch (e) {
        console.error('预览页初始化失败:', e);
        toast({
          title: '加载失败',
          description: '无法获取文件信息',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, filename]);

  const handleGoBack = () => {
    const fromFolder = searchParams.get('fromFolder');
    const folderName = searchParams.get('folderName');

    if (fromFolder) {
      navigate(`/folders/${fromFolder}`, { state: { folderName } });
    } else {
      navigate('/documents');
    }
  };

  const handleDownload = async () => {
    if (!docFile?.filename) return;
    try {
      const result = await backendStorageService.downloadFile(docFile.filename);
      if (result.success && result.blob) {
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = docFile.originalName || docFile.filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: '开始下载',
          description: `文件 "${docFile.originalName || docFile.filename}" 已开始下载`
        });
      } else {
        // 兜底：直接打开下载链接
        try {
          const url = `${API_FILES}/download/${encodeURIComponent(docFile.filename)}${docFile.originalName ? `?originalName=${encodeURIComponent(docFile.originalName)}` : ''}`;
          window.open(url, '_blank');
        } catch (_) {}
        toast({
          title: '下载失败',
          description: result.message || '无法下载文件（已尝试直接下载）',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('下载错误:', error);
      // 兜底：直接打开下载链接
      try {
        const url = `${API_FILES}/download/${encodeURIComponent(docFile!.filename)}${docFile?.originalName ? `?originalName=${encodeURIComponent(docFile.originalName)}` : ''}`;
        window.open(url, '_blank');
      } catch (_) {}
      toast({
        title: '下载失败',
        description: '下载文件时发生错误（已尝试直接下载）',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部工具条，仅保留返回与下载 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {loading ? '加载中...' : docFile?.originalName || docFile?.filename || '文档'}
            </h1>
            <p className="text-gray-600 mt-1">文档预览</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleDownload} disabled={loading || !docFile}>
            <Download className="h-4 w-4 mr-2" />
            下载
          </Button>
        </div>
      </div>

      {/* 内容区域：文档预览 */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-[70vh]">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-500">加载预览中...</p>
              </div>
            </div>
          ) : docFile && previewUrl ? (
            <FilePreviewer
              src={previewUrl}
              filename={docFile.originalName || docFile.filename}
              fileType={docFile.filename.split('.').pop() || ''}
              onDownload={handleDownload}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[40vh] text-center p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">无法加载预览</h3>
              <p className="text-gray-500 mb-6 max-w-md">
                文件预览加载失败，请尝试下载文件。
              </p>
              <Button onClick={handleDownload} disabled={!docFile}>
                <Download className="h-4 w-4 mr-2" />
                下载文件
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}