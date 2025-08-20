const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const storageConfig = require('./config/storage');
const filesRouter = require('./routes/files');
const foldersRouter = require('./routes/folders');
const userLogsRouter = require('./routes/userLogs');
const usersRouter = require('./routes/users');

const app = express();
// const PORT = process.env.PORT || 3001;
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors({
  origin: true,
  credentials: true
}));
app.options('*', cors());

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 解决URL中包含特殊字符的问题
app.use((req, res, next) => {
  const originalUrl = req.url;
  // 如果URL包含预览路径，特殊处理
  if (originalUrl.includes('/api/files/preview/')) {
    const prefix = '/api/files/preview/';
    const filename = originalUrl.substring(originalUrl.indexOf(prefix) + prefix.length);
    req.originalFilename = decodeURIComponent(filename);
  }
  next();
});

// 日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API路由
app.use('/api/files', filesRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/user-logs', userLogsRouter);
app.use('/api/users', usersRouter);

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Document Management Server is running',
    timestamp: new Date().toISOString(),
    storagePath: storageConfig.getStoragePath()
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Document Management System Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      upload: 'POST /api/files/upload',
      storageConfig: 'GET/POST /api/files/storage/config',
      storageStats: 'GET /api/files/storage/stats',
      fileList: 'GET /api/files/list',
      download: 'GET /api/files/download/:filename',
      delete: 'DELETE /api/files/delete/:filename',
      exists: 'GET /api/files/exists/:filename'
    }
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? error.message : '请联系管理员'
  });
});

// 启动服务器
async function startServer() {
  try {
    // 确保存储目录存在
    const result = await storageConfig.ensureStorageDirectory();
    if (result.success) {
      console.log(`✅ 存储目录已准备就绪: ${result.path}`);
    } else {
      console.warn(`⚠️  存储目录创建失败: ${result.error}`);
    }

    app.listen(3001,'0.0.0.0', () => {
      console.log('🚀 Document Management Server 启动成功!');
      console.log(`📡 服务器地址: http://localhost:${PORT}`);
      console.log(`📁 存储路径: ${storageConfig.getStoragePath()}`);
      console.log(`📋 API文档: http://localhost:${PORT}/`);
      console.log(`💚 健康检查: http://localhost:${PORT}/health`);
      console.log('-----------------------------------');
      console.log('可用的API接口:');
      console.log('  POST /api/files/upload - 文件上传');
      console.log('  GET  /api/files/list - 获取文件列表');
      console.log('  GET  /api/files/storage/stats - 存储统计');
      console.log('  GET  /api/files/download/:filename - 下载文件');
      console.log('  DELETE /api/files/delete/:filename - 删除文件');
      console.log('-----------------------------------');
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

// 启动服务器
startServer();

module.exports = app;