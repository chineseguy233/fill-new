import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, RotateCw, Download, Maximize } from 'lucide-react'

interface ImageViewerProps {
  src: string
  filename: string
  onDownload?: () => void
}

export default function ImageViewer({ src, filename, onDownload }: ImageViewerProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.25))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)
  const handleReset = () => {
    setScale(1)
    setRotation(0)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'w-full h-full'}`}>
      {/* 工具栏 */}
      <div className="absolute top-4 left-4 z-10 flex space-x-2">
        <Button variant="secondary" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={handleRotate}>
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={handleReset}>
          重置
        </Button>
        <Button variant="secondary" size="sm" onClick={toggleFullscreen}>
          <Maximize className="h-4 w-4" />
        </Button>
        {onDownload && (
          <Button variant="secondary" size="sm" onClick={onDownload}>
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 图片显示区域 */}
      <div className={`flex items-center justify-center ${isFullscreen ? 'h-full' : 'h-[70vh]'} overflow-hidden`}>
        <img
          src={src}
          alt={filename}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
          }}
          onError={(e) => {
            console.error('图片加载失败:', src)
          }}
        />
      </div>

      {/* 全屏模式下的关闭按钮 */}
      {isFullscreen && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-4 right-4 z-10"
          onClick={toggleFullscreen}
        >
          退出全屏
        </Button>
      )}

      {/* 图片信息 */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
        {filename} | 缩放: {Math.round(scale * 100)}% | 旋转: {rotation}°
      </div>
    </div>
  )
}