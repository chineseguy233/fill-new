import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Calendar as CalendarIcon, RefreshCw, Search, Trash2, Filter, Download } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// 操作类型映射
const actionTypeMap: Record<string, { label: string; color: string }> = {
  'LOGIN': { label: '登录', color: 'bg-blue-500' },
  'LOGOUT': { label: '退出', color: 'bg-gray-500' },
  'VIEW_FILE': { label: '查看文件', color: 'bg-green-500' },
  'UPLOAD_FILE': { label: '上传文件', color: 'bg-purple-500' },
  'DOWNLOAD_FILE': { label: '下载文件', color: 'bg-indigo-500' },
  'DELETE_FILE': { label: '删除文件', color: 'bg-red-500' },
  'MOVE_FILE': { label: '移动文件', color: 'bg-amber-500' },
  'CREATE_FOLDER': { label: '创建文件夹', color: 'bg-teal-500' },
  'DELETE_FOLDER': { label: '删除文件夹', color: 'bg-rose-500' },
  'UPDATE_FOLDER': { label: '更新文件夹', color: 'bg-cyan-500' }
};

// 日志类型接口
interface UserLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: any;
  timestamp: string;
  ip: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // 检查是否为管理员
  useEffect(() => {
    // 临时设置所有用户为管理员，用于测试
    // 在生产环境中，应该从认证系统获取真实的用户角色
    const userRole = localStorage.getItem('userRole') || 'admin'; // 临时默认为admin
    
    // 如果没有设置用户角色，临时设置为admin用于测试
    if (!localStorage.getItem('userRole')) {
      localStorage.setItem('userRole', 'admin');
    }
    
    if (userRole === 'admin') {
      setIsAdmin(true);
    } else {
      // 非管理员重定向到首页
      toast({
        title: "访问被拒绝",
        description: "您没有权限访问此页面",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [navigate, toast]);

  // 获取日志数据
  const fetchLogs = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      
      // 构建查询参数
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (actionFilter && actionFilter !== 'all') {
        params.append('action', actionFilter);
      }
      
      if (startDate) {
        params.append('startDate', startDate.toISOString());
      }
      
      if (endDate) {
        params.append('endDate', endDate.toISOString());
      }
      
      // 添加管理员标识
      params.append('admin', 'true');
      
      const response = await fetch(`http://localhost:3001/api/logs?${params.toString()}`, {
        headers: {
          'X-Admin-Access': 'true'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLogs(data.data.logs);
          setTotalPages(data.data.pagination.totalPages);
          setTotalLogs(data.data.pagination.total);
        } else {
          throw new Error(data.message || '获取日志失败');
        }
      } else {
        throw new Error('获取日志失败');
      }
    } catch (error) {
      console.error('获取日志失败:', error);
      toast({
        title: "获取日志失败",
        description: error instanceof Error ? error.message : "无法获取操作日志",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 当筛选条件变化时重新获取数据
  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [page, actionFilter, startDate, endDate, isAdmin]);

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // 重置到第一页
    fetchLogs();
  };

  // 清理过期日志
  const handleCleanupLogs = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/logs/cleanup', {
        method: 'DELETE',
        headers: {
          'X-Admin-Access': 'true'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: "清理成功",
            description: data.message || `已清理 ${data.data.deletedCount} 个过期日志文件`,
          });
          fetchLogs(); // 刷新日志列表
        } else {
          throw new Error(data.message || '清理日志失败');
        }
      } else {
        throw new Error('清理日志失败');
      }
    } catch (error) {
      console.error('清理日志失败:', error);
      toast({
        title: "清理失败",
        description: error instanceof Error ? error.message : "无法清理过期日志",
        variant: "destructive",
      });
    } finally {
      setIsCleanupDialogOpen(false);
    }
  };

  // 导出日志为CSV
  const exportLogsToCSV = () => {
    if (logs.length === 0) {
      toast({
        title: "导出失败",
        description: "没有可导出的日志数据",
        variant: "destructive",
      });
      return;
    }
    
    // 创建CSV内容
    const headers = ['ID', '用户ID', '用户名', '操作类型', '操作时间', 'IP地址', '详情'];
    const csvRows = [headers.join(',')];
    
    logs.forEach(log => {
      const row = [
        log.id,
        log.userId,
        `"${log.username}"`,
        `"${actionTypeMap[log.action]?.label || log.action}"`,
        log.timestamp,
        log.ip,
        `"${JSON.stringify(log.details).replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `user-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 格式化日期时间
  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
    } catch (error) {
      return dateString;
    }
  };

  // 获取操作类型标签
  const getActionBadge = (action: string) => {
    const actionInfo = actionTypeMap[action] || { label: action, color: 'bg-gray-500' };
    return (
      <Badge className={`${actionInfo.color} text-white`}>
        {actionInfo.label}
      </Badge>
    );
  };

  // 渲染日志详情
  const renderLogDetails = (details: any) => {
    if (!details) return null;
    
    // 根据不同操作类型，显示不同的详情
    switch (details.method) {
      case 'GET':
        if (details.path.includes('/preview/') || details.path.includes('/view/')) {
          return `查看文件: ${details.params?.filename || '未知文件'}`;
        }
        if (details.path.includes('/download/')) {
          return `下载文件: ${details.params?.filename || '未知文件'}`;
        }
        return `${details.method} ${details.path}`;
        
      case 'POST':
        if (details.path.includes('/upload')) {
          if (details.files && details.files.length > 0) {
            return `上传 ${details.files.length} 个文件: ${details.files.map((f: any) => f.originalName || f.filename).join(', ')}`;
          }
          return '上传文件';
        }
        if (details.path.includes('/move')) {
          return `移动文件 ${details.filename || '未知文件'} 到文件夹 ${details.targetFolder || '未知文件夹'}`;
        }
        return `${details.method} ${details.path}`;
        
      case 'DELETE':
        if (details.path.includes('/delete/')) {
          return `删除文件: ${details.params?.filename || '未知文件'}`;
        }
        return `${details.method} ${details.path}`;
        
      default:
        return JSON.stringify(details);
    }
  };

  if (!isAdmin) {
    return null; // 非管理员不显示内容
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">用户操作日志</h1>
          <p className="text-gray-600 mt-1">查看和管理系统操作记录</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={exportLogsToCSV}
            disabled={logs.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            导出CSV
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setIsCleanupDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            清理过期日志
          </Button>
        </div>
      </div>

      {/* 筛选工具栏 */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">搜索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索用户名、IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-full md:w-48 space-y-2">
              <label className="text-sm font-medium">操作类型</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="所有操作" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有操作</SelectItem>
                  {Object.entries(actionTypeMap).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-48 space-y-2">
              <label className="text-sm font-medium">开始日期</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'yyyy-MM-dd') : <span>选择日期</span>}
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
            
            <div className="w-full md:w-48 space-y-2">
              <label className="text-sm font-medium">结束日期</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'yyyy-MM-dd') : <span>选择日期</span>}
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
            
            <div className="flex space-x-2">
              <Button type="submit">
                <Filter className="mr-2 h-4 w-4" />
                筛选
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setActionFilter('all');
                  setStartDate(undefined);
                  setEndDate(undefined);
                  setPage(1);
                }}
              >
                重置
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 日志列表 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>操作日志列表</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchLogs} 
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : logs.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>用户</TableHead>
                      <TableHead>操作类型</TableHead>
                      <TableHead>操作时间</TableHead>
                      <TableHead>IP地址</TableHead>
                      <TableHead className="w-1/3">详情</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.username}</TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                        <TableCell>{log.ip}</TableCell>
                        <TableCell className="text-sm">{renderLogDetails(log.details)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* 分页 */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  显示 {logs.length} 条记录，共 {totalLogs} 条
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className={cn(page <= 1 && "pointer-events-none opacity-50")}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // 显示当前页附近的页码
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      
                      return (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => setPage(pageNum)}
                            isActive={page === pageNum}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className={cn(page >= totalPages && "pointer-events-none opacity-50")}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">没有找到匹配的操作日志</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 清理日志确认对话框 */}
      <AlertDialog open={isCleanupDialogOpen} onOpenChange={setIsCleanupDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清理过期日志</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除7天前的所有操作日志。此操作不可撤销，确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleCleanupLogs} className="bg-red-600 hover:bg-red-700">
              确认清理
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}