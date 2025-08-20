const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const storageConfig = require('../config/storage');
const { upload, handleUploadError, processUploadedFiles } = require('../middleware/upload');
const userLogModel = require('../models/userLog');

const router = express.Router();

// 文件查看次数存储（实际项目中应使用数据库）
const viewCounts = new Map();

// 记录文件查看次数
router.post('/view/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const currentCount = viewCounts.get(filename) || 0;
    viewCounts.set(filename, currentCount + 1);
    
    res.json({
      success: true,
      data: {
        filename,
        viewCount: currentCount + 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新查看次数失败',
      error: error.message
    });
  }
});

// 获取文件查看次数
router.get('/view/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const viewCount = viewCounts.get(filename) || 0;
    
    res.json({
      success: true,
      data: {
        filename,
        viewCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取查看次数失败',
      error: error.message
    });
  }
});

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

    // 记录上传者与文件-文件夹归属，用于显示作者与后续鉴权
    const uploadedById = req.header('x-user-id') || (req.body && req.body.userId) || 'anonymous';
    const uploadedByName = req.header('x-user-name') || (req.body && req.body.userName) || '匿名用户';
    if (!global.fileMetaMap) global.fileMetaMap = new Map();
    if (!global.fileToFolderMap) global.fileToFolderMap = new Map();
    try {
      (req.processedFiles || []).forEach(f => {
        // 记录上传者
        global.fileMetaMap.set(f.filename, {
          uploadedById,
          uploadedByName,
          uploadedAt: new Date().toISOString()
        });
        // 记录文件归属文件夹
        const fid = (req.body && req.body.folderId) || 'root';
        global.fileToFolderMap.set(f.filename, fid);
      });
    } catch (e) {
      console.warn('记录文件元信息失败:', e);
    }

    // 记录上传日志
    try {
      const uid = req.header('x-user-id') || (req.body && req.body.userId) || 'anonymous';
      const uname = req.header('x-user-name') || (req.body && req.body.userName) || '匿名用户';
      for (const f of (req.processedFiles || [])) {
        await userLogModel.addLog({
          userId: uid,
          username: uname,
          action: 'file_upload',
          resource: f.filename,
          details: { filename: f.filename, originalName: f.originalName },
          timestamp: new Date().toISOString(),
          url: req.headers.referer || '',
          userAgent: req.headers['user-agent'] || ''
        });
      }
    } catch (e) {
      console.warn('写入上传日志失败:', e.message);
    }

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
    
    // 获取原始文件名
    // 首先尝试从查询参数中获取原始文件名
    let originalFilename = req.query.originalName;
    
    // 如果查询参数中没有原始文件名，则尝试从系统文件名中提取
    // 支持两种前缀形式：
    // 1) 时间戳_UUID_原始文件名
    // 2) UUID_原始文件名（如 9d29f933_xxx.ext）
    if (!originalFilename) {
      const parts = filename.split('_');
      if (parts.length >= 3 && /^\d+$/.test(parts[0]) && /^[0-9a-fA-F-]{6,}$/.test(parts[1])) {
        // 去掉时间戳和UUID前缀
        originalFilename = parts.slice(2).join('_');
      } else if (parts.length >= 2 && /^[0-9a-fA-F-]{6,}$/.test(parts[0])) {
        // 去掉单段UUID前缀
        originalFilename = parts.slice(1).join('_');
      } else {
        originalFilename = filename;
      }
    }
    
    console.log('下载文件:', filename, '原始文件名:', originalFilename);

    // 设置响应头，使用原始文件名（同时设置 filename* 以兼容 UTF-8）
    const encodedName = encodeURIComponent(originalFilename);
    res.setHeader('Content-Disposition', `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`);
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

// 预览文件
router.get('/preview/:filename', async (req, res) => {
  try {
    // 从请求中获取文件名
    let filename = req.params.filename;
    
    // 如果有originalFilename（通过中间件设置），则使用它
    if (req.originalFilename) {
      filename = req.originalFilename;
    }
    
    console.log('预览文件:', filename);
    const filePath = storageConfig.getFilePath(filename);
    console.log('文件路径:', filePath);
    
    // 检查文件是否存在
    const exists = await storageConfig.fileExists(filename);
    if (!exists) {
      console.error('文件不存在:', filename);
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 增加查看次数
    const currentCount = viewCounts.get(filename) || 0;
    viewCounts.set(filename, currentCount + 1);

    // 获取文件扩展名
    const ext = path.extname(filename).toLowerCase();
    
    // 根据文件类型设置适当的Content-Type
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.txt':
        contentType = 'text/plain';
        break;
      case '.md':
        contentType = 'text/markdown';
        break;
      case '.html':
        contentType = 'text/html';
        break;
      case '.doc':
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case '.xls':
      case '.xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case '.ppt':
      case '.pptx':
        contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        break;
    }

    console.log('文件类型:', contentType);

    // 设置响应头，使浏览器内联显示文件而不是下载
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);

    // 发送文件
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('文件预览失败:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: '文件预览失败'
          });
        }
      }
    });

  } catch (error) {
    console.error('文件预览失败:', error);
    res.status(500).json({
      success: false,
      message: '文件预览失败',
      error: error.message
    });
  }
});

/**
 * 删除文件（鉴权）
 * 允许删除的角色：
 * - 管理员（X-User-Role=admin）
 * - 上传者本人（与记录的uploadedById匹配）
 * - 文件当前所属文件夹的所有者或编辑者
 */
router.delete('/delete/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.header('x-user-id') || 'anonymous';
    const userRole = req.header('x-user-role') || 'user';

    let authorized = userRole === 'admin';

    // 上传者本人
    if (!authorized) {
      if (!global.fileMetaMap) global.fileMetaMap = new Map();
      const meta = global.fileMetaMap.get(filename);
      if (meta && meta.uploadedById && meta.uploadedById === userId) {
        authorized = true;
      }
    }

    // 文件夹权限（owner 或 editors）
    if (!authorized) {
      if (!global.fileToFolderMap) global.fileToFolderMap = new Map();
      const currentFolderId = global.fileToFolderMap.get(filename) || 'root';
      try {
        const folderDataPath = path.join(storageConfig.getStoragePath(), 'system', 'folders.json');
        if (await fs.pathExists(folderDataPath)) {
          const folderList = await fs.readJson(folderDataPath);
          const folder = Array.isArray(folderList) ? folderList.find(f => f.id === currentFolderId) : null;
          if (folder && folder.permissions) {
            if (folder.permissions.owner === userId) {
              authorized = true;
            } else if (Array.isArray(folder.permissions.editors) && folder.permissions.editors.includes(userId)) {
              authorized = true;
            }
          }
        }
      } catch (e) {
        console.warn('检查文件夹权限失败:', e.message);
      }
    }

    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: '无权限删除该文件'
      });
    }

    const result = await storageConfig.deleteFile(filename);
    if (result.success) {
      return res.json({ success: true, message: result.message });
    }
    return res.status(400).json({
      success: false,
      message: '文件删除失败',
      error: result.error
    });
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
      const filesWithAuthor = (result.stats.files || []).map(file => {
        const meta = global.fileMetaMap && global.fileMetaMap.get(file.name);
        return { ...file, author: (meta && meta.uploadedByName) ? meta.uploadedByName : (file.author || '系统管理员') };
      });
      res.json({
        success: true,
        data: {
          files: filesWithAuthor,
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

// 移动文件到指定文件夹
router.put('/move/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { folderId } = req.body;
    
    if (!folderId) {
      return res.status(400).json({
        success: false,
        message: '目标文件夹ID不能为空'
      });
    }
    
    // 检查文件是否存在
    const exists = await storageConfig.fileExists(filename);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }
    
    // 这里应该更新文件的文件夹归属信息
    // 由于当前使用的是简单的文件存储，我们可以在内存中维护文件-文件夹的映射关系
    // 实际项目中应该使用数据库来存储这些关系
    
    // 创建一个简单的文件-文件夹映射存储
    if (!global.fileToFolderMap) {
      global.fileToFolderMap = new Map();
    }
    
    // 更新文件的文件夹归属
    global.fileToFolderMap.set(filename, folderId);
    
    console.log(`文件 ${filename} 已移动到文件夹 ${folderId}`);
    
    res.json({
      success: true,
      message: '文件移动成功',
      data: {
        filename,
        folderId,
        movedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('移动文件失败:', error);
    res.status(500).json({
      success: false,
      message: '移动文件失败',
      error: error.message
    });
  }
});

// 获取文件的文件夹归属信息
router.get('/folder/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!global.fileToFolderMap) {
      global.fileToFolderMap = new Map();
    }
    
    const folderId = global.fileToFolderMap.get(filename) || 'root';
    
    res.json({
      success: true,
      data: {
        filename,
        folderId
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取文件文件夹信息失败',
      error: error.message
    });
  }
});

// 错误处理中间件
router.use(handleUploadError);

module.exports = router;
