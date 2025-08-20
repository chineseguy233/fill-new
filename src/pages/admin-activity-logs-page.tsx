import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Activity, 
  Calendar as CalendarIcon, 
  Filter, 
  RefreshCw, 
  Trash2, 
  Download,
  Eye,
  Upload,
  User,
  Clock,
  Globe,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { API_USER_LOGS } from '@/lib/apiBase';

interface UserLog {
  id: string;
  userId?: string;
  username?: string;
  action: string;
  resource?: string;
  details?: any;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  url?: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  file_upload: <Upload className="h-4 w-4 text-green-500" />,
  file_download: <Download className="h-4 w-4 text-blue-500" />,
  file_delete: <Trash2 className="h-4 w-4 text-red-500" />,
  file_view: <Eye className="h-4 w-4 text-purple-500" />,
  folder_create: <Upload className="h-4 w-4 text-green-500" />,
  folder_delete: <Trash2 className="h-4 w-4 text-red-500" />,
  user_login: <User className="h-4 w-4 text-blue-500" />,
  user_logout: <User className="h-4 w-4 text-gray-500" />,
  search: <Search className="h-4 w-4 text-orange-500" />,
  page_visit: <Globe className="h-4 w-4 text-gray-400" />,
  settings_change: <Activity className="h-4 w-4 text-yellow-500" />,
};

const actionLabels: Record<string, string> = {
  file_upload: '文件上传',
  file_download: '文件下载',
  file_delete: '文件删除',
  file_view: '文件查看',
  folder_create: '文件夹创建',
  folder_delete: '文件夹删除',
  user_login: '用户登录',
  user_logout: '用户登出',
  search: '搜索操作',
  page_visit: '页面访问',
  settings_change: '设置更改',
};

export const AdminActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    action: '',
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [currentPage, pageSize, filters]);

  // 定时轮询，确保日志及时更新
  useEffect(() => {
    const timer = setInterval(() => {
      fetchLogs();
    }, 5000);
    return () => clearInterval(timer);
  }, [currentPage, pageSize, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const filterParams = {
        ...filters,
        action: filters.action === 'all' ? '' : filters.action
      };
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...filterParams,
        admin: 'true' // 管理员权限标识
      });

      const hdrs: Record<string, string> = { 'x-admin-access': 'true' };
      try {
        const raw = localStorage.getItem('currentUser');
        if (raw) {
          const u = JSON.parse(raw);
          if (u?.id) hdrs['X-User-Id'] = String(u.id);
          if (u?.role) hdrs['X-User-Role'] = String(u.role);
        }
      } catch {}
      const response = await fetch(`${API_USER_LOGS}?${params.toString()}`, {
        headers: hdrs
      });

      if (response.ok) {
        const result = await response.json();
        setLogs(result.data.logs || []);
        setTotalCount((result.data.pagination && result.data.pagination.total) ? result.data.pagination.total : (result.data.total || 0));
      } else {
        throw new Error('获取日志失败');
      }
    } catch (error) {
      console.error('获取用户活动日志失败:', error);
      toast({
        title: "错误",
        description: "获取用户活动日志失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupLogs = async () => {
    try {
      const hdrs2: Record<string, string> = { 'x-admin-access': 'true' };
      try {
        const raw = localStorage.getItem('currentUser');
        if (raw) {
          const u = JSON.parse(raw);
          if (u?.id) hdrs2['X-User-Id'] = String(u.id);
          if (u?.role) hdrs2['X-User-Role'] = String(u.role);
        }
      } catch {}
      const response = await fetch(`${API_USER_LOGS}/cleanup`, {
        method: 'DELETE',
        headers: hdrs2
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "清理成功",
          description: `已清理 ${result.data.deletedCount} 个过期日志文件`,
        });
        fetchLogs(); // 重新获取日志
      } else {
        throw new Error('清理日志失败');
      }
    } catch (error) {
      console.error('清理过期日志失败:', error);
      toast({
        title: "错误",
        description: "清理过期日志失败",
        variant: "destructive",
      });
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1); // 重置到第一页
  };

  const handleDateFilter = () => {
    const newFilters = {
      ...filters,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : '',
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : ''
    };
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      userId: '',
      action: '',
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentPage(1);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'file_delete':
      case 'folder_delete':
        return 'destructive';
      case 'file_upload':
      case 'folder_create':
        return 'default';
      case 'file_view':
      case 'page_visit':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Activity className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">用户活动日志</h1>
            <p className="text-muted-foreground">查看和管理系统用户活动记录</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <Trash2 className="h-4 w-4 mr-2" />
                清理过期日志
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认清理过期日志</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作将删除所有过期的日志文件，此操作不可撤销。确定要继续吗？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleCleanupLogs}>
                  确认清理
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* 过滤器 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">过滤条件</CardTitle>
          <CardDescription>设置过滤条件来查找特定的活动日志</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 日期范围 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">开始日期</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "yyyy-MM-dd") : "选择开始日期"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">结束日期</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "yyyy-MM-dd") : "选择结束日期"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 用户ID */}
            <div className="space-y-2">
              <label className="text-sm font-medium">用户ID</label>
              <Input
                placeholder="输入用户ID"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              />
            </div>

            {/* 操作类型 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">操作类型</label>
              <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择操作类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部操作</SelectItem>
                  {Object.entries(actionLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button onClick={handleDateFilter}>
              <Filter className="h-4 w-4 mr-2" />
              应用过滤
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              重置过滤器
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总日志数</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">当前页</p>
                <p className="text-2xl font-bold">{currentPage}/{totalPages}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">每页显示</p>
                <p className="text-2xl font-bold">{pageSize}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">当前显示</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
              <Globe className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 日志列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">活动日志</CardTitle>
          <CardDescription>系统用户活动的详细记录</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">加载中...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">暂无日志记录</h3>
              <p className="text-muted-foreground">没有找到符合条件的活动日志</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      {actionIcons[log.action] || <Activity className="h-4 w-4 text-gray-500" />}
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {actionLabels[log.action] || log.action}
                      </Badge>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{log.username || log.userId || '匿名用户'}</span>
                        {log.resource && (
                          <span className="text-sm text-muted-foreground">
                            → {log.resource}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(log.timestamp)}
                        </span>
                        {log.ip && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {log.ip}
                          </span>
                        )}
                        {log.url && (
                          <span className="truncate max-w-xs">
                            {log.url}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {log.details && (
                    <div className="text-xs text-muted-foreground max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">每页显示</span>
                <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">条记录</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <span className="text-sm text-muted-foreground">
                  第 {currentPage} 页，共 {totalPages} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminActivityLogsPage;