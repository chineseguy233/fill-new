import React from 'react'
import ImageViewer from './ImageViewer'
import VideoPlayer from './VideoPlayer'
import WordViewer from './WordViewer'
import ExcelViewer from './ExcelViewer'
import TextViewer from './TextViewer'
import { FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FilePreviewerProps {
  src: string
  filename: string
  fileType: string
  onDownload?: () => void
}

// 获取文件类型分类
const getFileCategory = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  // 图片文件
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext || '')) {
    return 'image'
  }
  
  // 视频文件
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext || '')) {
    return 'video'
  }
  
  // Word文档
  if (['doc', 'docx'].includes(ext || '')) {
    return 'word'
  }
  
  // Excel表格
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
    return 'excel'
  }
  
  // PowerPoint演示文稿
  if (['ppt', 'pptx'].includes(ext || '')) {
    return 'powerpoint'
  }
  
  // 文本文件
  if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'sql', 'yaml', 'yml', 'sh', 'bat'].includes(ext || '')) {
    return 'text'
  }
  
  // PDF文件
  if (ext === 'pdf') {
    return 'pdf'
  }
  
  return 'unknown'
}

// 不支持预览的文件类型组件
const UnsupportedViewer: React.FC<{ filename: string; fileType: string; onDownload?: () => void }> = ({ 
  filename, 
  fileType, 
  onDownload 
}) => (
  <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6">
    <FileText className="h-16 w-16 text-gray-400 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      此文件类型暂不支持在线预览
    </h3>
    <p className="text-gray-500 mb-6 max-w-md">
      {fileType} 文件无法在浏览器中直接预览。您可以下载文件后在本地相应软件中查看。
    </p>
    {onDownload && (
      <Button onClick={onDownload}>
        <Download className="h-4 w-4 mr-2" />
        下载文件
      </Button>
    )}
  </div>
)

// PDF预览组件（使用浏览器原生支持）
const PDFViewer: React.FC<{ src: string; filename: string; onDownload?: () => void }> = ({ 
  src, 
  filename, 
  onDownload 
}) => (
  <div className="w-full h-[70vh]">
    <iframe 
      src={src} 
      className="w-full h-full border-0"
      title={filename}
    />
  </div>
)

export default function FilePreviewer({ src, filename, fileType, onDownload }: FilePreviewerProps) {
  const category = getFileCategory(filename)
  
  switch (category) {
    case 'image':
      return <ImageViewer src={src} filename={filename} onDownload={onDownload} />
    
    case 'video':
      return <VideoPlayer src={src} filename={filename} onDownload={onDownload} />
    
    case 'word':
      return <WordViewer src={src} filename={filename} onDownload={onDownload} />
    
    case 'excel':
      return <ExcelViewer src={src} filename={filename} onDownload={onDownload} />
    
    case 'text':
      return <TextViewer src={src} filename={filename} onDownload={onDownload} />
    
    case 'pdf':
      return <PDFViewer src={src} filename={filename} onDownload={onDownload} />
    
    case 'powerpoint':
      // PowerPoint暂时使用不支持预览的组件，后续可以添加专门的PPT预览器
      return <UnsupportedViewer filename={filename} fileType="PowerPoint" onDownload={onDownload} />
    
    default:
      return <UnsupportedViewer filename={filename} fileType={fileType} onDownload={onDownload} />
  }
}

// 导出所有预览组件
export {
  ImageViewer,
  VideoPlayer,
  WordViewer,
  ExcelViewer,
  TextViewer,
  FilePreviewer
}