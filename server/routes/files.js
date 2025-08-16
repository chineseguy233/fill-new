const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const storageConfig = require('../config/storage');
const { upload, handleUploadError, processUploadedFiles } = require('../middleware/upload');

const router = express.Router();

// 文件上传接口
router.post('/upload', upload, processUploadedFiles, async (req, res) => {
  try {
    const { title, description, tags, folderId } = req.body;
    
    if (!req.processedFiles || req.processedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有文件被上传'
      });
    }

    // 构建文档信息
    const documentData = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title || req.processedFiles[0].originalName || '未命名文档',
      description: description || '',
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      folderId: folderId || 'root',
      files: req.processedFiles.map(file => ({
        originalName: file.originalName,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        uploadTime: file.uploadTime
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      storagePath: storageConfig.getStoragePath()
    };

    res.json({
      success: true,
      message: `成功上传 ${req.processedFiles.length} 个文件`,
      data: {
        document: documentData,
        files: req.processedFiles,
        storagePath: storageConfig.getStoragePath()
      }
    });

  } catch (error) {
    console.error('文件上传处理失败:', error);
    res.status(500).json({
      success: false,
      message: '文件上传处理失败',
      error: error.message
    });
  }
});

// 获取存储配置
router.get('/storage/config', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        storagePath: storageConfig.getStoragePath(),
        defaultPath: 'D:\\DOC_STORAGE'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取存储配置失败',
      error: error.message
    });
  }
});

// 设置存储路径
router.post('/storage/config', async (req, res) => {
  try {
    const { storagePath } = req.body;
    
    if (!storagePath) {
      return res.status(400).json({
        success: false,
        message: '存储路径不能为空'
      });
    }

    const result = await storageConfig.setStoragePath(storagePath);
    
    if (result.success) {
      res.json({
        success: true,
        message: '存储路径设置成功',
        data: {
          storagePath: result.path
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: '存储路径设置失败',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '设置存储路径失败',
      error: error.message
    });
  }
});

// 获取存储统计信息
router.get('/storage/stats', async (req, res) => {
  try {
    const result = await storageConfig.getStorageStats();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.stats
      });
    } else {
      res.status(500).json({
        success: false,
        message: '获取存储统计失败',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取存储统计失败',
      error: error.message
    });
  }
});

// 下载文件
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = storageConfig.getFilePath(filename);
    
    // 检查文件是否存在
    const exists = await storageConfig.fileExists(filename);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 设置响应头
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // 发送文件
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('文件下载失败:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: '文件下载失败'
          });
        }
      }
    });

  } catch (error) {
    console.error('文件下载失败:', error);
    res.status(500).json({
      success: false,
      message: '文件下载失败',
      error: error.message
    });
  }
});

// 删除文件
router.delete('/delete/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    const result = await storageConfig.deleteFile(filename);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: '文件删除失败',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '文件删除失败',
      error: error.message
    });
  }
});

// 获取文件列表
router.get('/list', async (req, res) => {
  try {
    const result = await storageConfig.getStorageStats();
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          files: result.stats.files,
          totalFiles: result.stats.totalFiles,
          totalSize: result.stats.totalSize,
          storagePath: result.stats.storagePath
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: '获取文件列表失败',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取文件列表失败',
      error: error.message
    });
  }
});

// 检查文件是否存在
router.get('/exists/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const exists = await storageConfig.fileExists(filename);
    
    res.json({
      success: true,
      data: {
        exists,
        filename,
        storagePath: storageConfig.getStoragePath()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '检查文件失败',
      error: error.message
    });
  }
});

// 错误处理中间件
router.use(handleUploadError);

module.exports = router;