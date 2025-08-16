import React, { useState, useEffect } from 'react'
import { Loader2, AlertTriangle, Download, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface TextViewerProps {
  src: string
  filename: string
  onDownload?: () => void
}

export default function TextViewer({ src, filename, onDownload }: TextViewerProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  // 根据文件扩展名判断语言类型
  const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'bash',
      'bat': 'batch'
    }
    return languageMap[ext || ''] || 'text'
  }

  useEffect(() => {
    const loadTextFile = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(src)
        if (!response.ok) {
          throw new Error('文件加载失败')
        }

        const text = await response.text()
        setContent(text)
      } catch (err) {
        console.error('文本文件预览失败:', err)
        setError(err instanceof Error ? err.message : '未知错误')
      } finally {
        setLoading(false)
      }
    }

    loadTextFile()
  }, [src])

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast({
        title: "复制成功",
        description: "文件内容已复制到剪贴板",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-500">正在加载文本文件...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-6">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">文本文件预览失败</h3>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          {error}。请尝试下载文件查看。
        </p>
        {onDownload && (
          <Button onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            下载文件
          </Button>
        )}
      </div>
    )
  }

  const language = getLanguageFromFilename(filename)
  const lines = content.split('\n')

  return (
    <div className="w-full h-[70vh] flex flex-col">
      {/* 工具栏 */}
      <div className="bg-white border-b p-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {filename} - 文本文件预览
          </div>
          <div className="text-xs text-gray-500">
            {lines.length} 行 | {content.length} 字符 | {language}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleCopyContent}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? '已复制' : '复制内容'}
          </Button>
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              下载文件
            </Button>
          )}
        </div>
      </div>

      {/* 文本内容 */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="flex">
          {/* 行号 */}
          <div className="bg-gray-100 border-r border-gray-300 px-3 py-4 text-xs text-gray-500 font-mono select-none">
            {lines.map((_, index) => (
              <div key={index} className="leading-6 text-right">
                {index + 1}
              </div>
            ))}
          </div>
          
          {/* 代码内容 */}
          <div className="flex-1 p-4">
            <pre className="text-sm font-mono leading-6 whitespace-pre-wrap break-words">
              <code className={`language-${language}`}>
                {content}
              </code>
            </pre>
          </div>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="p-4 bg-purple-50 border-t">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-purple-800 font-medium mb-1">文本文件预览说明</p>
            <ul className="text-purple-700 space-y-1">
              <li>• 支持多种编程语言和文本格式的预览</li>
              <li>• 大文件可能加载较慢，请耐心等待</li>
              <li>• 可以复制文件内容到剪贴板</li>
              <li>• 二进制文件可能显示乱码，建议下载查看</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}