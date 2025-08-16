import React, { useState, useEffect } from 'react'
import { Loader2, AlertTriangle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import mammoth from 'mammoth'

interface WordViewerProps {
  src: string
  filename: string
  onDownload?: () => void
}

export default function WordViewer({ src, filename, onDownload }: WordViewerProps) {
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadWordDocument = async () => {
      try {
        setLoading(true)
        setError(null)

        // 获取文件数据
        const response = await fetch(src)
        if (!response.ok) {
          throw new Error('文件加载失败')
        }

        const arrayBuffer = await response.arrayBuffer()
        
        // 使用mammoth转换Word文档为HTML
        const result = await mammoth.convertToHtml({ arrayBuffer })
        setHtmlContent(result.value)

        // 输出转换警告（如果有）
        if (result.messages.length > 0) {
          console.warn('Word文档转换警告:', result.messages)
        }
      } catch (err) {
        console.error('Word文档预览失败:', err)
        setError(err instanceof Error ? err.message : '未知错误')
      } finally {
        setLoading(false)
      }
    }

    loadWordDocument()
  }, [src])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-500">正在转换Word文档...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-6">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Word文档预览失败</h3>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          {error}。建议下载文件后在本地Word软件中查看。
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

  return (
    <div className="w-full h-[70vh] overflow-auto">
      {/* 工具栏 */}
      <div className="sticky top-0 bg-white border-b p-3 flex justify-between items-center z-10">
        <div className="text-sm text-gray-600">
          {filename} - Word文档预览
        </div>
        {onDownload && (
          <Button variant="outline" size="sm" onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            下载原文件
          </Button>
        )}
      </div>

      {/* 文档内容 */}
      <div className="p-6 bg-white">
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          style={{
            fontFamily: 'Arial, sans-serif',
            lineHeight: '1.6',
            color: '#333'
          }}
        />
      </div>

      {/* 提示信息 */}
      <div className="p-4 bg-yellow-50 border-t">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-yellow-800 font-medium mb-1">Word文档预览说明</p>
            <ul className="text-yellow-700 space-y-1">
              <li>• 此预览由Word文档转换而来，可能与原文档格式略有差异</li>
              <li>• 复杂的表格、图片和格式可能显示不完整</li>
              <li>• 如需查看完整格式，请下载原文件在Word中打开</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}