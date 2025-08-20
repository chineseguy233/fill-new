const fs = require('fs-extra');
const path = require('path');
const storageConfig = require('../config/storage');

// 用户操作日志模型
class UserLogModel {
  constructor() {
    this.logsPath = path.join(storageConfig.getStoragePath(), 'user_logs');
    this.ensureLogDirectory();
  }

  // 确保日志目录存在
  async ensureLogDirectory() {
    try {
      await fs.ensureDir(this.logsPath);
      return { success: true, path: this.logsPath };
    } catch (error) {
      console.error('创建日志目录失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 添加日志
  async addLog(logData) {
    try {
      // 确保必要字段存在（允许无 userId，但需有 action 与 timestamp）
      if (!logData.action || !logData.timestamp) {
        return { success: false, message: '日志数据不完整' };
      }

      // 生成日志ID
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // 完整日志对象
      const log = {
        id: logId,
        userId: logData.userId || 'anonymous',
        username: logData.username || '匿名用户',
        action: logData.action,
        resource: logData.resource || '',
        url: logData.url || '',
        userAgent: logData.userAgent || '',
        details: logData.details || {},
        timestamp: logData.timestamp || new Date().toISOString(),
        ip: logData.ip || '未知IP'
      };

      // 按日期组织日志文件
      const date = new Date(log.timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const logFilePath = path.join(this.logsPath, `${year}-${month}-${day}.json`);
      
      // 读取现有日志或创建新的日志数组
      let logs = [];
      if (await fs.pathExists(logFilePath)) {
        const fileData = await fs.readFile(logFilePath, 'utf8');
        logs = JSON.parse(fileData);
      }
      
      // 添加新日志
      logs.push(log);
      
      // 保存日志文件
      await fs.writeFile(logFilePath, JSON.stringify(logs, null, 2), 'utf8');
      
      return { success: true, data: log };
    } catch (error) {
      console.error('添加日志失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取日志列表（支持分页和筛选）
  async getLogs(options = {}) {
    try {
      const { 
        startDate, 
        endDate, 
        userId, 
        action, 
        page = 1, 
        limit = 50,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = options;
      
      // 确定日期范围
      const start = startDate ? new Date(startDate) : new Date();
      start.setHours(0, 0, 0, 0);
      
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      
      // 如果没有指定日期范围，默认查询最近7天
      if (!startDate && !endDate) {
        start.setDate(start.getDate() - 7);
      }
      
      // 获取日期范围内的所有日志文件
      const dateRange = [];
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        
        dateRange.push(`${year}-${month}-${day}.json`);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // 读取所有相关日志文件
      let allLogs = [];
      for (const dateFile of dateRange) {
        const logFilePath = path.join(this.logsPath, dateFile);
        if (await fs.pathExists(logFilePath)) {
          const fileData = await fs.readFile(logFilePath, 'utf8');
          const logs = JSON.parse(fileData);
          allLogs = allLogs.concat(logs);
        }
      }
      
      // 应用筛选条件
      let filteredLogs = allLogs;
      
      if (userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === userId);
      }
      
      if (action) {
        filteredLogs = filteredLogs.filter(log => log.action === action);
      }
      
      // 应用日期范围筛选
      filteredLogs = filteredLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= start && logDate <= end;
      });
      
      // 排序
      filteredLogs.sort((a, b) => {
        if (sortBy === 'timestamp') {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }
        return 0;
      });
      
      // 分页
      const totalLogs = filteredLogs.length;
      const totalPages = Math.ceil(totalLogs / limit);
      const offset = (page - 1) * limit;
      const paginatedLogs = filteredLogs.slice(offset, offset + limit);
      
      return {
        success: true,
        data: {
          logs: paginatedLogs,
          pagination: {
            total: totalLogs,
            page,
            limit,
            totalPages
          }
        }
      };
    } catch (error) {
      console.error('获取日志失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 清理过期日志（保留最近7天）
  async cleanupOldLogs() {
    try {
      // 获取所有日志文件
      const files = await fs.readdir(this.logsPath);
      const logFiles = files.filter(file => file.endsWith('.json'));
      
      // 计算7天前的日期
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      
      // 删除过期日志
      let deletedCount = 0;
      for (const file of logFiles) {
        // 从文件名解析日期 (格式: YYYY-MM-DD.json)
        const datePart = file.split('.')[0];
        const fileDate = new Date(datePart);
        
        if (fileDate < sevenDaysAgo) {
          await fs.remove(path.join(this.logsPath, file));
          deletedCount++;
        }
      }
      
      return { success: true, deletedCount };
    } catch (error) {
      console.error('清理过期日志失败:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new UserLogModel();