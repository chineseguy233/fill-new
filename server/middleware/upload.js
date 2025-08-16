const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const storageConfig = require('../config/storage');

// 配置multer存储
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      // 确保存储目录存在
      const storagePath = storageConfig.getStoragePath();
      await fs.ensureDir(storagePath);
      cb(null, storagePath);
    } catch (error) {
      console.error('创建存储目录失败:', error);
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    try {
      // 正确处理中文文件名编码
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      
      // 生成唯一文件名：时间戳_UUID_原文件名
      const timestamp = Date.now();
      const uniqueId = uuidv4().substring(0, 8);
      const ext = path.extname(originalName);
      const nameWithoutExt = path.basename(originalName, ext);
      
      // 对文件名进行安全处理，移除特殊字符但保留中文
      const safeName = nameWithoutExt.replace(/[<>:"/\\|?*]/g, '_');
      const uniqueFilename = `${timestamp}_${uniqueId}_${safeName}${ext}`;
      
      // 将生成的文件名添加到请求对象中，供后续使用
      if (!req.uploadedFiles) {
        req.uploadedFiles = [];
      }
      
      req.uploadedFiles.push({
        originalName: originalName, // 使用正确编码的原始文件名
        filename: uniqueFilename,
        mimetype: file.mimetype,
        size: file.size
      });
      
      console.log(`文件名处理: ${file.originalname} -> ${originalName} -> ${uniqueFilename}`);
      cb(null, uniqueFilename);
    } catch (error) {
      console.error('文件名处理失败:', error);
      cb(error);
    }
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = [
    // 文档类型
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/markdown',
    // 压缩文件
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    // 图片类型
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    // 视频类型
    'video/mp4',
    'video/avi',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/webm',
    'video/x-flv',
    'video/x-matroska'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
  }
};

// 创建multer实例
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    files: 10 // 最多10个文件，不限制文件大小
  }
});

// 错误处理中间件
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '文件数量超过限制（最多10个文件）'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: '意外的文件字段'
      });
    }
  }
  
  if (error.message.includes('不支持的文件类型')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  console.error('文件上传错误:', error);
  res.status(500).json({
    success: false,
    message: '文件上传失败'
  });
};

// 上传成功后的处理中间件
const processUploadedFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有文件被上传'
      });
    }

    // 处理上传的文件信息
    const processedFiles = req.files.map((file, index) => {
      const uploadedFileInfo = req.uploadedFiles[index];
      
      // 确保使用正确编码的原始文件名
      const originalName = uploadedFileInfo ? uploadedFileInfo.originalName : 
        Buffer.from(file.originalname, 'latin1').toString('utf8');
      
      return {
        originalName: originalName, // 使用正确编码的原始文件名
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        uploadTime: new Date().toISOString(),
        storagePath: storageConfig.getStoragePath()
      };
    });

    // 将处理后的文件信息添加到请求对象
    req.processedFiles = processedFiles;
    
    console.log(`成功上传 ${processedFiles.length} 个文件到: ${storageConfig.getStoragePath()}`);
    processedFiles.forEach(file => {
      console.log(`- ${file.originalName} -> ${file.filename} (${file.size} bytes)`);
    });

    next();
  } catch (error) {
    console.error('处理上传文件失败:', error);
    res.status(500).json({
      success: false,
      message: '处理上传文件失败'
    });
  }
};

module.exports = {
  upload: upload.array('files', 10), // 支持多文件上传，最多10个
  handleUploadError,
  processUploadedFiles
};