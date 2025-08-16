import React, { useState, useEffect } from 'react'
import { Loader2, AlertTriangle, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import * as XLSX from 'xlsx'

interface ExcelViewerProps {
  src: string
  filename: string
  onDownload?: () => void
}

interface SheetData {
  name: string
  data: any[][]
}

export default function ExcelViewer({ src, filename, onDownload }: ExcelViewerProps) {
  const [sheets, setSheets] = useState<SheetData[]>([])
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadExcelFile = async () => {
      try {
        setLoading(true)
        setError(null)

        // 获取文件数据
        const response = await fetch(src)
        if (!response.ok) {
          throw new Error('文件加载失败')
        }

        const arrayBuffer = await response.arrayBuffer()
        
        // 使用SheetJS解析Excel文件
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        
        const sheetsData: SheetData[] = workbook.SheetNames.map(sheetName => {
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            raw: false
          }) as any[][]
          
          return {
            name: sheetName,
            data: jsonData
          }
        })

        setSheets(sheetsData)
        setCurrentSheetIndex(0)
      } catch (err) {
        console.error('Excel文件预览失败:', err)
        setError(err instanceof Error ? err.message : '未知错误')
      } finally {
        setLoading(false)
      }
    }

    loadExcelFile()
  }, [src])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-500">正在解析Excel文件...</p>
        </div>
      </div>
    )
  }

  if (error || sheets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-6">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Excel文件预览失败</h3>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          {error || '无法解析Excel文件'}。建议下载文件后在本地Excel软件中查看。
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

  const currentSheet = sheets[currentSheetIndex]
  const maxDisplayRows = 100 // 限制显示行数以提高性能
  const displayData = currentSheet.data.slice(0, maxDisplayRows)

  return (
    <div className="w-full h-[70vh] flex flex-col">
      {/* 工具栏 */}
      <div className="bg-white border-b p-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {filename} - Excel表格预览
          </div>
          
          {/* 工作表选择器 */}
          {sheets.length > 1 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">工作表:</span>
              <Select 
                value={currentSheetIndex.toString()} 
                onValueChange={(value) => setCurrentSheetIndex(parseInt(value))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sheets.map((sheet, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {sheet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {onDownload && (
          <Button variant="outline" size="sm" onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            下载原文件
          </Button>
        )}
      </div>

      {/* 表格内容 */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="min-w-full">
          <table className="w-full border-collapse bg-white">
            <tbody>
              {displayData.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex === 0 ? 'bg-gray-100 font-medium' : ''}>
                  {/* 行号 */}
                  <td className="border border-gray-300 bg-gray-100 px-2 py-1 text-xs text-gray-500 text-center min-w-[40px]">
                    {rowIndex + 1}
                  </td>
                  {/* 数据单元格 */}
                  {row.map((cell, cellIndex) => (
                    <td 
                      key={cellIndex} 
                      className="border border-gray-300 px-2 py-1 text-sm min-w-[80px] max-w-[200px]"
                      title={String(cell)}
                    >
                      <div className="truncate">
                        {String(cell)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 状态栏 */}
      <div className="bg-white border-t p-2 text-xs text-gray-500 flex justify-between">
        <div>
          工作表: {currentSheet.name} | 
          显示行数: {Math.min(displayData.length, maxDisplayRows)} / {currentSheet.data.length}
          {currentSheet.data.length > maxDisplayRows && ' (已限制显示前100行)'}
        </div>
        <div>
          共 {sheets.length} 个工作表
        </div>
      </div>

      {/* 提示信息 */}
      <div className="p-4 bg-green-50 border-t">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-green-800 font-medium mb-1">Excel表格预览说明</p>
            <ul className="text-green-700 space-y-1">
              <li>• 此预览显示Excel文件的基本内容，可能不包含公式计算结果</li>
              <li>• 复杂的格式、图表和宏功能无法显示</li>
              <li>• 大文件仅显示前100行以确保性能</li>
              <li>• 如需完整功能，请下载原文件在Excel中打开</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}