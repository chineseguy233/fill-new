const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const storageConfig = require('../config/storage');

const router = express.Router();

/**
 * 用户数据存储文件路径（主存储：storagePath/system/users.json）
 * 同时维护一份备份：server/config/users.backup.json
 */
// 用户数据存储文件路径
const getUsersFilePath = () => storageConfig.getSystemFilePath('users.json');
// 用户数据备份文件路径（服务器内置目录，用于容灾恢复）
const getUsersBackupFilePath = () => path.join(__dirname, '..', 'config', 'users.backup.json');

// 初始化用户数据
let users = [];

// 加载用户数据
function loadUsers() {
  try {
    const usersFilePath = getUsersFilePath();
    // 自动迁移旧版 users.json 到 system 目录（覆盖）
    try {
      const oldPath = path.join(storageConfig.getStoragePath(), 'users.json');
      if (fs.existsSync(oldPath) && oldPath !== usersFilePath) {
        fs.ensureDirSync(path.dirname(usersFilePath));
        fs.copyFileSync(oldPath, usersFilePath);
        console.log(`已将旧用户数据迁移到: ${usersFilePath}`);
      }
    } catch (e) {
      console.warn('迁移旧用户数据失败:', e.message);
    }
    if (fs.existsSync(usersFilePath)) {
      const userData = fs.readFileSync(usersFilePath, 'utf8');
      users = JSON.parse(userData);
      console.log(`已从 ${usersFilePath} 加载 ${users.length} 个用户`);
    } else {
      // 尝试从备份恢复
      try {
        const backupPath = getUsersBackupFilePath();
        if (fs.existsSync(backupPath)) {
          const backupData = fs.readFileSync(backupPath, 'utf8');
          users = JSON.parse(backupData);
          saveUsers();
          console.log(`已从备份恢复 ${users.length} 个用户并写入: ${usersFilePath}`);
          return;
        }
      } catch (e) {
        console.warn('从备份恢复用户失败:', e.message);
      }
      // 创建默认演示用户
      users = [
        {
          id: 'demo_user_001',
          username: '演示用户',
          email: 'demo@example.com',
          phone: '13800138000',
          role: 'admin',
          permissions: {
            canUpload: true,
            canDownload: true,
            canView: true,
            canDelete: true,
            canManageUsers: true
          },
          createdAt: new Date().toISOString(),
          password: '123456' // 实际项目中应该加密存储
        }
      ];
      saveUsers();
      console.log('已创建默认用户数据');
    }
  } catch (error) {
    console.error('加载用户数据失败:', error);
    // 如果加载失败，创建默认用户
    users = [
      {
        id: 'demo_user_001',
        username: '演示用户',
        email: 'demo@example.com',
        phone: '13800138000',
        role: 'admin',
        permissions: {
          canUpload: true,
          canDownload: true,
          canView: true,
          canDelete: true,
          canManageUsers: true
        },
        createdAt: new Date().toISOString(),
        password: '123456'
      }
    ];
  }
}

// 保存用户数据（主文件 + 备份）
function saveUsers() {
  try {
    const usersFilePath = getUsersFilePath();
    fs.ensureDirSync(path.dirname(usersFilePath));
    const data = JSON.stringify(users, null, 2);
    fs.writeFileSync(usersFilePath, data, 'utf8');
    // 同步写入服务器内置备份，提升容灾能力
    try {
      const backupPath = getUsersBackupFilePath();
      fs.ensureDirSync(path.dirname(backupPath));
      fs.writeFileSync(backupPath, data, 'utf8');
    } catch (e) {
      console.warn('写入用户数据备份失败:', e.message);
    }
    return true;
  } catch (error) {
    console.error('保存用户数据失败:', error);
    return false;
  }
}

// 初始化用户数据
loadUsers();

// 验证邮箱格式
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 验证手机号格式
function isValidPhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

// 生成用户ID
function generateUserId() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 用户注册
router.post('/register', (req, res) => {
  try {
    const { username, email, password, confirmPassword, phone } = req.body;

    // 验证输入
    if (!username || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的邮箱地址'
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的手机号码'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少为6位'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '两次输入的密码不一致'
      });
    }

    // 检查用户是否已存在
    const existingUser = users.find(user => 
      user.email === email || 
      user.username === username || 
      user.phone === phone
    );
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱或手机号已存在'
      });
    }

    // 创建新用户
    const newUser = {
      id: generateUserId(),
      username,
      email,
      phone,
      role: 'user',
      permissions: {
        canUpload: true,
        canDownload: true,
        canView: true,
        canDelete: false,
        canManageUsers: false
      },
      createdAt: new Date().toISOString(),
      password // 实际项目中应该加密存储
    };

    users.push(newUser);
    const saved = saveUsers();
    if (!saved) {
      return res.status(500).json({
        success: false,
        message: '注册成功但保存用户数据失败，请在设置页配置可写的存储路径后重试'
      });
    }

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: userWithoutPassword
      }
    });

  } catch (error) {
    console.error('用户注册失败:', error);
    res.status(500).json({
      success: false,
      message: '注册过程中发生错误',
      error: error.message
    });
  }
});

// 用户登录
router.post('/login', (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: '请输入登录信息和密码'
      });
    }

    // 查找用户
    const user = users.find(u => 
      (u.email === identifier || 
       u.username === identifier || 
       u.phone === identifier) && 
      u.password === password
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '登录信息或密码错误'
      });
    }

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userWithoutPassword
      }
    });

  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录过程中发生错误',
      error: error.message
    });
  }
});

// 获取用户信息
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const user = users.find(u => u.id === id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: {
        user: userWithoutPassword
      }
    });

  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
});

// 更新用户信息
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 如果要更新邮箱或用户名，检查是否已存在
    if (updates.email || updates.username || updates.phone) {
      const existingUser = users.find(user => 
        user.id !== id && (
          (updates.email && user.email === updates.email) ||
          (updates.username && user.username === updates.username) ||
          (updates.phone && user.phone === updates.phone)
        )
      );
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '用户名、邮箱或手机号已存在'
        });
      }
    }

    // 更新用户信息
    const updatedUser = { ...users[userIndex], ...updates };
    users[userIndex] = updatedUser;

    saveUsers();

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = updatedUser;
    
    res.json({
      success: true,
      message: '更新成功',
      data: {
        user: userWithoutPassword
      }
    });

  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户信息失败',
      error: error.message
    });
  }
});

// 修改密码
router.put('/:id/password', (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '请提供原密码和新密码'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度至少为6位'
      });
    }

    const userIndex = users.findIndex(u => u.id === id && u.password === oldPassword);

    if (userIndex === -1) {
      return res.status(400).json({
        success: false,
        message: '原密码错误'
      });
    }

    // 更新密码
    users[userIndex].password = newPassword;
    saveUsers();

    res.json({
      success: true,
      message: '密码修改成功'
    });

  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败',
      error: error.message
    });
  }
});

// 获取所有用户（管理员专用）
router.get('/', (req, res) => {
  try {
    // 这里应该验证管理员权限，暂时简化处理
    const usersWithoutPassword = users.map(({ password, ...user }) => user);
    
    res.json({
      success: true,
      data: {
        users: usersWithoutPassword
      }
    });

  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
});

// 删除用户（管理员专用）
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 不能删除演示用户
    if (users[userIndex].email === 'demo@example.com') {
      return res.status(400).json({
        success: false,
        message: '不能删除演示用户'
      });
    }

    users.splice(userIndex, 1);
    saveUsers();

    res.json({
      success: true,
      message: '用户删除成功'
    });

  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败',
      error: error.message
    });
  }
});

module.exports = router;