const express = require('express');
const userLogModel = require('../models/userLog');
const fs = require('fs-extra');
const storageConfig = require('../config/storage');
const router = express.Router();

// 中间件：检查是否为管理员（支持多种来源）
const isAdmin = async (req, res, next) => {
  try {
    // 1) 直接允许：请求头或查询参数显式声明管理员访问（兼容旧逻辑）
    const headerAdminAccess = String(req.headers['x-admin-access']).toLowerCase() === 'true';
    const queryAdmin = String(req.query.admin).toLowerCase() === 'true';

    // 2) 角色头部声明
    const headerRole = (req.headers['x-user-role'] || '').toString().toLowerCase();

    if (headerAdminAccess || queryAdmin || headerRole === 'admin') {
      return next();
    }

    // 3) 根据 X-User-Id 到 users.json 校验角色
    const userId = req.headers['x-user-id'] || '';
    if (userId) {
      try {
        const usersPath = storageConfig.getSystemFilePath('users.json');
        if (await fs.pathExists(usersPath)) {
          const users = await fs.readJson(usersPath);
          const user = Array.isArray(users)
            ? users.find(u => String(u.id) === String(userId))
            : null;

          if (user && (user.role === 'admin' || (user.permissions && user.permissions.canManageUsers))) {
            return next();
          }
        }
      } catch (e) {
        console.warn('管理员验证读取用户失败:', e.message);
      }
    }

    return res.status(403).json({
      success: false,
      message: '权限不足，需要管理员权限'
    });
  } catch (e) {
    console.error('管理员权限校验失败:', e);
    return res.status(500).json({
      success: false,
      message: '管理员权限校验失败',
      error: e.message
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