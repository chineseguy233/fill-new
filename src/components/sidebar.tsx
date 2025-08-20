import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Upload,
  Search,
  FolderOpen,
  Shield,
  Cloud,
  Folder,
  Database
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import DocumentUpload from '@/components/DocumentUpload'
import { useAuth } from '@/contexts/AuthContext'

const navigation = [
  { name: '仪表盘', href: '/dashboard', icon: LayoutDashboard },
  { name: '文档管理', href: '/documents', icon: FileText },
  { name: '文件夹', href: '/folders', icon: FolderOpen },
  { name: '搜索', href: '/search', icon: Search },
]

export default function Sidebar() {
  const location = useLocation()
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.permissions?.canManageUsers

  const secondaryNavigation = [
    { name: '设置', href: '/settings', icon: Settings },
    ...(isAdmin ? [
      { name: '云存储配置', href: '/cloud-storage-config', icon: Cloud },
      { name: '用户管理', href: '/user-management', icon: Shield },
      { name: '活动日志', href: '/admin-activity-logs', icon: Settings },
      { name: '数据管理', href: '/data-management', icon: Database }
    ] : [])
  ]

  const handleUploadComplete = () => {
    setIsUploadOpen(false)
    // 可以在这里添加刷新文档列表的逻辑
  }

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <FileText className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">文档管理</span>
        </div>
      </div>

      {/* Upload Button */}
      <div className="p-4">
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              上传文档
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogTitle className="sr-only">上传文档</DialogTitle>
            <DocumentUpload 
              onUploadComplete={handleUploadComplete}
              onClose={() => setIsUploadOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <Separator className="mx-4" />

      {/* Secondary Navigation */}
      <nav className="px-4 py-4 space-y-1">
        {secondaryNavigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}