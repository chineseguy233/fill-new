const userLogModel = require('../models/userLog');

// 用户操作日志中间件
const logUserAction = (action) => {
  return async (req, res, next) => {
    // 保存原始的res.json方法
    const originalJson = res.json;
    
    // 重写res.json方法以在响应发送后记录日志
    res.json = async function(data) {
      // 调用原始的json方法
      originalJson.call(this, data);
      
      try {
        // 从请求中获取用户信息
        const userId = req.user?.id || req.headers['x-user-id'] || 'anonymous';
        const username = req.user?.username || req.headers['x-username'] || '匿名用户';
        
        // 构建日志详情
        const details = {
          method: req.method,
          path: req.path,
          params: req.params,
          query: req.query,
          body: action === 'LOGIN' ? { username: req.body.username } : undefined, // 登录时不记录密码
          status: res.statusCode,
          success: data.success
        };
        
        // 根据不同操作类型，添加特定信息
        switch (action) {
          case 'VIEW_FILE':
            details.filename = req.params.filename;
            break;
          case 'UPLOAD_FILE':
            if (req.processedFiles && req.processedFiles.length > 0) {
              details.files = req.processedFiles.map(file => ({
                filename: file.filename,
                originalName: file.originalName,
                size: file.size,
                mimetype: file.mimetype
              }));
            }
            break;
          case 'DOWNLOAD_FILE':
          case 'DELETE_FILE':
            details.filename = req.params.filename;
            break;
          case 'MOVE_FILE':
            details.filename = req.body.filename;
            details.targetFolder = req.body.folderId;
            break;
        }
        
        // 记录日志
        userLogModel.addLog({
          userId,
          username,
          action,
          details,
          timestamp: new Date().toISOString(),
          ip: req.ip || req.connection.remoteAddress
        }).catch(logError => {
          console.error('记录日志失败:', logError);
        });
      } catch (error) {
        console.error('记录用户操作日志失败:', error);
        // 即使日志记录失败，也不影响API响应
      }
    };
    
    next();
  };
};

// 定期清理过期日志的函数
const setupLogCleanup = () => {
  // 每天凌晨2点执行清理
  const runCleanup = async () => {
    try {
      const result = await userLogModel.cleanupOldLogs();
      if (result.success) {
        console.log(`日志清理完成: 已删除 ${result.deletedCount} 个过期日志文件`);
      } else {
        console.error('日志清理失败:', result.error);
      }
    } catch (error) {
      console.error('执行日志清理时出错:', error);
    }
  };
  
  // 计算距离下次执行的时间
  const calculateNextRun = () => {
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(2, 0, 0, 0); // 设置为凌晨2点
    
    // 如果当前时间已经过了今天的2点，则设置为明天的2点
    if (now >= nextRun) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    return nextRun.getTime() - now.getTime();
  };
  
  // 设置定时器
  const scheduleNextRun = () => {
    const delay = calculateNextRun();
    setTimeout(() => {
      runCleanup().finally(() => {
        scheduleNextRun(); // 执行完后再次调度下一次执行
      });
    }, delay);
  };
  
  // 启动定时清理
  scheduleNextRun();
  
  // 同时立即执行一次清理
  runCleanup();
};

module.exports = {
  logUserAction,
  setupLogCleanup
};