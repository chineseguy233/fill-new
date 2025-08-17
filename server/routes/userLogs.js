const express = require('express');
const userLogModel = require('../models/userLog');
const router = express.Router();

// 中间件：检查是否为管理员
const isAdmin = (req, res, next) => {
  // 从请求中获取用户信息
  const user = req.user;
  
  // 在实际应用中，这里应该检查用户是否有管理员权限
  // 由于当前系统可能没有完整的用户认证系统，这里简化处理
  // 如果有认证系统，应该从req.user中获取角色信息
  
  // 临时解决方案：通过请求头或查询参数检查管理员标识
  const isAdminUser = req.headers['x-admin-access'] === 'true' || 
                      req.query.admin === 'true';
  
  if (isAdminUser) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: '权限不足，需要管理员权限'
    });
  }
};

// 添加操作日志
router.post('/', async (req, res) => {
  try {
    const logData = req.body;
    
    // 添加IP地址
    logData.ip = req.ip || req.connection.remoteAddress;
    
    const result = await userLogModel.addLog(logData);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        message: '操作日志已记录',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || '记录操作日志失败'
      });
    }
  } catch (error) {
    console.error('添加操作日志失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法记录操作日志',
      error: error.message
    });
  }
});

// 获取操作日志列表（仅管理员可访问）
router.get('/', isAdmin, async (req, res) => {
  try {
    const options = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      userId: req.query.userId,
      action: req.query.action,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      sortBy: req.query.sortBy || 'timestamp',
      sortOrder: req.query.sortOrder || 'desc'
    };
    
    const result = await userLogModel.getLogs(options);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: '获取操作日志失败',
        error: result.error
      });
    }
  } catch (error) {
    console.error('获取操作日志失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取操作日志',
      error: error.message
    });
  }
});

// 清理过期日志（仅管理员可访问）
router.delete('/cleanup', isAdmin, async (req, res) => {
  try {
    const result = await userLogModel.cleanupOldLogs();
    
    if (result.success) {
      res.json({
        success: true,
        message: `已清理 ${result.deletedCount} 个过期日志文件`,
        data: { deletedCount: result.deletedCount }
      });
    } else {
      res.status(400).json({
        success: false,
        message: '清理过期日志失败',
        error: result.error
      });
    }
  } catch (error) {
    console.error('清理过期日志失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法清理过期日志',
      error: error.message
    });
  }
});

module.exports = router;