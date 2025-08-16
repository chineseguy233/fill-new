const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const storageConfig = require('../config/storage');

const router = express.Router();

// 文件夹数据存储（实际项目中应使用数据库）
// 初始化一些默认文件夹
let folders = [
  { id: 'root', name: '根目录', path: '/', parentId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'system' },
  { id: 'documents', name: '文档', path: '/文档', parentId: 'root', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'system' },
  { id: 'images', name: '图片', path: '/图片', parentId: 'root', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'system' },
  { id: 'videos', name: '视频', path: '/视频', parentId: 'root', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'system' },
  { id: 'archives', name: '归档', path: '/归档', parentId: 'root', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'system' },
  { id: 'work', name: '工作文件', path: '/工作文件', parentId: 'root', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'system' },
  { id: 'personal', name: '个人文件', path: '/个人文件', parentId: 'root', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'system' }
];

// 尝试从文件加载文件夹数据
try {
  const folderDataPath = path.join(storageConfig.getStoragePath(), 'folders.json');
  if (fs.existsSync(folderDataPath)) {
    const folderData = fs.readFileSync(folderDataPath, 'utf8');
    folders = JSON.parse(folderData);
    console.log(`已从 ${folderDataPath} 加载 ${folders.length} 个文件夹`);
  } else {
    // 如果文件不存在，保存默认文件夹
    saveFolders();
    console.log('已创建默认文件夹数据');
  }
} catch (error) {
  console.error('加载文件夹数据失败:', error);
}

// 保存文件夹数据到文件
function saveFolders() {
  try {
    const folderDataPath = path.join(storageConfig.getStoragePath(), 'folders.json');
    fs.writeFileSync(folderDataPath, JSON.stringify(folders, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('保存文件夹数据失败:', error);
    return false;
  }
}

// 获取所有文件夹
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: folders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取文件夹列表失败',
      error: error.message
    });
  }
});

// 获取根文件夹
router.get('/root', (req, res) => {
  try {
    const rootFolders = folders.filter(folder => folder.parentId === null);
    res.json({
      success: true,
      data: rootFolders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取根文件夹失败',
      error: error.message
    });
  }
});

// 获取子文件夹
router.get('/children/:parentId', (req, res) => {
  try {
    const { parentId } = req.params;
    const childFolders = folders.filter(folder => folder.parentId === parentId);
    res.json({
      success: true,
      data: childFolders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取子文件夹失败',
      error: error.message
    });
  }
});

// 获取单个文件夹
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const folder = folders.find(folder => folder.id === id);
    
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: '文件夹不存在'
      });
    }
    
    res.json({
      success: true,
      data: folder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取文件夹失败',
      error: error.message
    });
  }
});

// 创建文件夹
router.post('/', (req, res) => {
  try {
    const { name, parentId = 'root', createdBy = 'system' } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '文件夹名称不能为空'
      });
    }
    
    // 检查同级目录下是否有同名文件夹
    const existingFolder = folders.find(folder => 
      folder.parentId === parentId && folder.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingFolder) {
      return res.status(400).json({
        success: false,
        message: '同级目录下已存在同名文件夹'
      });
    }
    
    // 获取父文件夹路径
    let parentPath = '/';
    if (parentId !== 'root') {
      const parentFolder = folders.find(folder => folder.id === parentId);
      if (parentFolder) {
        parentPath = parentFolder.path;
      }
    }
    
    // 创建新文件夹
    const newFolder = {
      id: uuidv4(),
      name,
      path: `${parentPath === '/' ? '' : parentPath}/${name}`,
      parentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy
    };
    
    folders.push(newFolder);
    
    // 保存到文件
    saveFolders();
    
    res.status(201).json({
      success: true,
      message: '文件夹创建成功',
      data: newFolder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建文件夹失败',
      error: error.message
    });
  }
});

// 更新文件夹
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, parentId } = req.body;
    
    const folderIndex = folders.findIndex(folder => folder.id === id);
    
    if (folderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '文件夹不存在'
      });
    }
    
    // 如果要修改名称，检查同级目录下是否有同名文件夹
    if (name && name !== folders[folderIndex].name) {
      const existingFolder = folders.find(folder => 
        folder.parentId === folders[folderIndex].parentId && 
        folder.name.toLowerCase() === name.toLowerCase() &&
        folder.id !== id
      );
      
      if (existingFolder) {
        return res.status(400).json({
          success: false,
          message: '同级目录下已存在同名文件夹'
        });
      }
    }
    
    // 如果要修改父文件夹，检查是否会造成循环引用
    if (parentId && parentId !== folders[folderIndex].parentId) {
      // 检查新的父文件夹是否存在
      const newParentFolder = folders.find(folder => folder.id === parentId);
      if (!newParentFolder) {
        return res.status(400).json({
          success: false,
          message: '父文件夹不存在'
        });
      }
      
      // 检查是否会造成循环引用
      let currentParentId = parentId;
      while (currentParentId) {
        if (currentParentId === id) {
          return res.status(400).json({
            success: false,
            message: '不能将文件夹移动到其子文件夹中'
          });
        }
        
        const currentParent = folders.find(folder => folder.id === currentParentId);
        if (!currentParent) break;
        
        currentParentId = currentParent.parentId;
      }
    }
    
    // 更新文件夹
    const updatedFolder = {
      ...folders[folderIndex],
      name: name || folders[folderIndex].name,
      parentId: parentId || folders[folderIndex].parentId,
      updatedAt: new Date().toISOString()
    };
    
    // 如果修改了名称或父文件夹，需要更新路径
    if (name || parentId) {
      let parentPath = '/';
      if (updatedFolder.parentId !== 'root') {
        const parentFolder = folders.find(folder => folder.id === updatedFolder.parentId);
        if (parentFolder) {
          parentPath = parentFolder.path;
        }
      }
      
      updatedFolder.path = `${parentPath === '/' ? '' : parentPath}/${updatedFolder.name}`;
      
      // 更新所有子文件夹的路径
      const updateChildPaths = (folderId, newParentPath) => {
        const childFolders = folders.filter(folder => folder.parentId === folderId);
        
        childFolders.forEach(childFolder => {
          const childIndex = folders.findIndex(f => f.id === childFolder.id);
          if (childIndex !== -1) {
            folders[childIndex].path = `${newParentPath === '/' ? '' : newParentPath}/${folders[childIndex].name}`;
            updateChildPaths(folders[childIndex].id, folders[childIndex].path);
          }
        });
      };
      
      updateChildPaths(id, updatedFolder.path);
    }
    
    folders[folderIndex] = updatedFolder;
    
    // 保存到文件
    saveFolders();
    
    res.json({
      success: true,
      message: '文件夹更新成功',
      data: updatedFolder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新文件夹失败',
      error: error.message
    });
  }
});

// 删除文件夹
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查文件夹是否存在
    const folderIndex = folders.findIndex(folder => folder.id === id);
    
    if (folderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '文件夹不存在'
      });
    }
    
    // 检查是否有子文件夹
    const hasChildren = folders.some(folder => folder.parentId === id);
    
    if (hasChildren) {
      return res.status(400).json({
        success: false,
        message: '文件夹不为空，无法删除'
      });
    }
    
    // 删除文件夹
    folders.splice(folderIndex, 1);
    
    // 保存到文件
    saveFolders();
    
    res.json({
      success: true,
      message: '文件夹删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除文件夹失败',
      error: error.message
    });
  }
});

// 获取文件夹路径
router.get('/:id/path', (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取文件夹路径
    const getFolderPath = (folderId) => {
      const path = [];
      let currentId = folderId;
      
      while (currentId) {
        const folder = folders.find(f => f.id === currentId);
        if (!folder) break;
        
        path.unshift(folder);
        currentId = folder.parentId;
      }
      
      return path;
    };
    
    const folderPath = getFolderPath(id);
    
    if (folderPath.length === 0) {
      return res.status(404).json({
        success: false,
        message: '文件夹不存在'
      });
    }
    
    res.json({
      success: true,
      data: folderPath
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取文件夹路径失败',
      error: error.message
    });
  }
});

module.exports = router;