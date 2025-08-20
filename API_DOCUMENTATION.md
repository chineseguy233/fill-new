# API 接口文档

> 文档管理系统后端API接口详细说明

**项目创建人：Mr.Tony**

## 📋 目录

- [接口概览](#接口概览)
- [认证接口](#认证接口)
- [用户管理接口](#用户管理接口)
- [文件夹管理接口](#文件夹管理接口)
- [文件管理接口](#文件管理接口)
- [日志管理接口](#日志管理接口)
- [错误码说明](#错误码说明)
- [请求示例](#请求示例)

## 🌐 接口概览

### 基础信息
- **基础URL**：`http://localhost:3001/api`
- **数据格式**：JSON
- **字符编码**：UTF-8
- **请求方法**：GET, POST, PUT, DELETE

### 通用响应格式
```json
{
  "success": true,
  "message": "操作成功",
  "data": {},
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### 错误响应格式
```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息",
  "code": "ERROR_CODE"
}
```

## 🔐 认证接口

### 用户登录
**POST** `/users/login`

**请求参数：**
```json
{
  "identifier": "admin",      // 用户名或邮箱
  "password": "admin123"      // 密码
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "user_001",
      "username": "admin",
      "email": "admin@example.com",
      "fullName": "系统管理员",
      "permissions": {
        "manageUsers": true,
        "manageFiles": true,
        "viewLogs": true
      }
    },
    "token": "jwt_token_here"
  }
}
```

### 用户注册
**POST** `/users/register`

**请求参数：**
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "fullName": "新用户"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "user_002",
      "username": "newuser",
      "email": "user@example.com",
      "fullName": "新用户",
      "permissions": {
        "manageUsers": false,
        "manageFiles": true,
        "viewLogs": false
      }
    }
  }
}
```

### 用户登出
**POST** `/users/logout`

**响应示例：**
```json
{
  "success": true,
  "message": "登出成功"
}
```

## 👥 用户管理接口

### 获取用户列表
**GET** `/users`

**查询参数：**
- `page`: 页码（默认1）
- `limit`: 每页数量（默认10）
- `search`: 搜索关键词

**响应示例：**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_001",
        "username": "admin",
        "email": "admin@example.com",
        "fullName": "系统管理员",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "lastLoginAt": "2024-01-20T10:30:00.000Z",
        "isActive": true
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

### 获取单个用户信息
**GET** `/users/:id`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": "user_001",
    "username": "admin",
    "email": "admin@example.com",
    "fullName": "系统管理员",
    "permissions": {
      "manageUsers": true,
      "manageFiles": true,
      "viewLogs": true
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-20T10:30:00.000Z"
  }
}
```

### 更新用户信息
**PUT** `/users/:id`

**请求参数：**
```json
{
  "fullName": "更新后的姓名",
  "email": "newemail@example.com",
  "permissions": {
    "manageUsers": false,
    "manageFiles": true,
    "viewLogs": false
  }
}
```

### 删除用户
**DELETE** `/users/:id`

**响应示例：**
```json
{
  "success": true,
  "message": "用户删除成功"
}
```

### 重置用户密码
**POST** `/users/:id/reset-password`

**响应示例：**
```json
{
  "success": true,
  "message": "密码重置成功",
  "data": {
    "newPassword": "temp123456"
  }
}
```

## 📁 文件夹管理接口

### 获取文件夹列表
**GET** `/folders`

**查询参数：**
- `parentId`: 父文件夹ID（可选）
- `userId`: 用户ID（权限过滤）
- `isAdmin`: 是否管理员

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": "folder_001",
      "name": "项目文档",
      "description": "项目相关文档",
      "path": "/项目文档",
      "parentId": "root",
      "visibility": "public",
      "permissions": {
        "owner": "user_001",
        "viewers": [],
        "editors": []
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-20T10:30:00.000Z",
      "createdBy": "user_001"
    }
  ]
}
```

### 创建文件夹
**POST** `/folders`

**请求参数：**
```json
{
  "name": "新文件夹",
  "description": "文件夹描述",
  "parentId": "root",
  "visibility": "public",
  "createdBy": "user_001"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "文件夹创建成功",
  "data": {
    "id": "folder_002",
    "name": "新文件夹",
    "description": "文件夹描述",
    "path": "/新文件夹",
    "parentId": "root",
    "visibility": "public",
    "permissions": {
      "owner": "user_001",
      "viewers": [],
      "editors": []
    },
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T10:30:00.000Z",
    "createdBy": "user_001"
  }
}
```

### 更新文件夹
**PUT** `/folders/:id`

**请求参数：**
```json
{
  "name": "更新后的文件夹名",
  "description": "更新后的描述",
  "parentId": "root"
}
```

### 删除文件夹
**DELETE** `/folders/:id`

**请求参数：**
```json
{
  "userId": "user_001",
  "isAdmin": true
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "文件夹删除成功"
}
```

### 更新文件夹权限
**PUT** `/folders/:id/permissions`

**请求参数：**
```json
{
  "visibility": "private",
  "permissions": {
    "viewers": ["user_002"],
    "editors": ["user_003"]
  },
  "userId": "user_001"
}
```

### 获取文件夹路径
**GET** `/folders/:id/path`

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": "root",
      "name": "根目录",
      "path": "/"
    },
    {
      "id": "folder_001",
      "name": "项目文档",
      "path": "/项目文档"
    }
  ]
}
```

### 检查用户访问权限
**GET** `/folders/:id/access/:userId`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "hasAccess": true,
    "accessLevel": "owner",
    "visibility": "public"
  }
}
```

## 📄 文件管理接口

### 上传文件
**POST** `/files/upload`

**请求类型：** `multipart/form-data`

**请求参数：**
- `file`: 文件数据（必需）
- `folderId`: 文件夹ID（可选，默认root）
- `title`: 文件标题（可选）
- `description`: 文件描述（可选）
- `tags`: 标签，逗号分隔（可选）

**响应示例：**
```json
{
  "success": true,
  "message": "文件上传成功",
  "data": {
    "id": "file_001",
    "filename": "document.pdf",
    "originalName": "项目文档.pdf",
    "title": "项目文档",
    "description": "项目相关文档",
    "tags": ["项目", "文档"],
    "size": 1024000,
    "mimeType": "application/pdf",
    "folderId": "folder_001",
    "uploadedBy": "user_001",
    "uploadedAt": "2024-01-20T10:30:00.000Z",
    "downloadUrl": "/api/files/download/document.pdf"
  }
}
```

### 获取文件列表
**GET** `/files/list`

**查询参数：**
- `folderId`: 文件夹ID（可选）
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）
- `search`: 搜索关键词（可选）
- `type`: 文件类型过滤（可选）

**响应示例：**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "file_001",
        "filename": "document.pdf",
        "originalName": "项目文档.pdf",
        "title": "项目文档",
        "description": "项目相关文档",
        "tags": ["项目", "文档"],
        "size": 1024000,
        "mimeType": "application/pdf",
        "folderId": "folder_001",
        "uploadedBy": "user_001",
        "uploadedAt": "2024-01-20T10:30:00.000Z",
        "viewCount": 5,
        "downloadCount": 2
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

### 下载文件
**GET** `/files/download/:filename`

**响应：** 文件流

### 获取文件信息
**GET** `/files/info/:filename`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": "file_001",
    "filename": "document.pdf",
    "originalName": "项目文档.pdf",
    "title": "项目文档",
    "description": "项目相关文档",
    "tags": ["项目", "文档"],
    "size": 1024000,
    "mimeType": "application/pdf",
    "folderId": "folder_001",
    "uploadedBy": "user_001",
    "uploadedAt": "2024-01-20T10:30:00.000Z",
    "viewCount": 5,
    "downloadCount": 2,
    "lastAccessedAt": "2024-01-20T15:30:00.000Z"
  }
}
```

### 更新文件信息
**PUT** `/files/info/:filename`

**请求参数：**
```json
{
  "title": "更新后的标题",
  "description": "更新后的描述",
  "tags": ["新标签1", "新标签2"]
}
```

### 移动文件
**PUT** `/files/move/:filename`

**请求参数：**
```json
{
  "targetFolderId": "folder_002"
}
```

### 删除文件
**DELETE** `/files/:filename`

**响应示例：**
```json
{
  "success": true,
  "message": "文件删除成功"
}
```

### 获取文件夹归属
**GET** `/files/folder/:filename`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "folderId": "folder_001",
    "folderName": "项目文档",
    "folderPath": "/项目文档"
  }
}
```

### 搜索文件
**GET** `/files/search`

**查询参数：**
- `q`: 搜索关键词（必需）
- `type`: 文件类型过滤（可选）
- `folderId`: 限制搜索范围（可选）
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）

**响应示例：**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "file_001",
        "filename": "document.pdf",
        "originalName": "项目文档.pdf",
        "title": "项目文档",
        "description": "项目相关文档",
        "tags": ["项目", "文档"],
        "size": 1024000,
        "mimeType": "application/pdf",
        "folderId": "folder_001",
        "uploadedBy": "user_001",
        "uploadedAt": "2024-01-20T10:30:00.000Z",
        "matchScore": 0.95
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "searchTime": 0.05
  }
}
```

## 📊 日志管理接口

### 获取用户日志
**GET** `/user-logs`

**查询参数：**
- `userId`: 用户ID（可选）
- `action`: 操作类型（可选）
- `startDate`: 开始日期（可选）
- `endDate`: 结束日期（可选）
- `page`: 页码（默认1）
- `limit`: 每页数量（默认50）

**响应示例：**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log_001",
        "userId": "user_001",
        "username": "admin",
        "action": "文件上传",
        "details": "上传文件：项目文档.pdf",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "timestamp": "2024-01-20T10:30:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 50
  }
}
```

### 创建用户日志
**POST** `/user-logs`

**请求参数：**
```json
{
  "userId": "user_001",
  "action": "文件下载",
  "details": "下载文件：document.pdf",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

### 获取操作统计
**GET** `/user-logs/stats`

**查询参数：**
- `startDate`: 开始日期（可选）
- `endDate`: 结束日期（可选）
- `userId`: 用户ID（可选）

**响应示例：**
```json
{
  "success": true,
  "data": {
    "totalActions": 150,
    "actionsByType": {
      "文件上传": 45,
      "文件下载": 60,
      "文件删除": 10,
      "登录": 35
    },
    "actionsByUser": {
      "admin": 80,
      "user1": 40,
      "user2": 30
    },
    "actionsByDate": {
      "2024-01-20": 25,
      "2024-01-19": 30,
      "2024-01-18": 20
    }
  }
}
```

## ❌ 错误码说明

### HTTP状态码
- `200`: 请求成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未授权访问
- `403`: 权限不足
- `404`: 资源不存在
- `409`: 资源冲突
- `500`: 服务器内部错误

### 业务错误码
```json
{
  "USER_NOT_FOUND": "用户不存在",
  "INVALID_CREDENTIALS": "用户名或密码错误",
  "USER_ALREADY_EXISTS": "用户已存在",
  "FOLDER_NOT_FOUND": "文件夹不存在",
  "FOLDER_NOT_EMPTY": "文件夹不为空",
  "FILE_NOT_FOUND": "文件不存在",
  "FILE_TOO_LARGE": "文件过大",
  "INVALID_FILE_TYPE": "不支持的文件类型",
  "INSUFFICIENT_PERMISSIONS": "权限不足",
  "STORAGE_FULL": "存储空间不足",
  "INVALID_FOLDER_NAME": "无效的文件夹名称",
  "CIRCULAR_REFERENCE": "循环引用错误"
}
```

## 📝 请求示例

### JavaScript/Fetch示例

#### 用户登录
```javascript
const login = async (username, password) => {
  try {
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: username,
        password: password
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('currentUser', JSON.stringify(result.data.user));
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
};
```

#### 文件上传
```javascript
const uploadFile = async (file, folderId, title, description, tags) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', folderId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('tags', tags);
    
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('文件上传失败:', error);
    throw error;
  }
};
```

#### 获取文件列表
```javascript
const getFileList = async (folderId, page = 1, limit = 20) => {
  try {
    const params = new URLSearchParams({
      folderId: folderId,
      page: page.toString(),
      limit: limit.toString()
    });
    
    const response = await fetch(`/api/files/list?${params}`);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('获取文件列表失败:', error);
    throw error;
  }
};
```

### cURL示例

#### 用户登录
```bash
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin",
    "password": "admin123"
  }'
```

#### 创建文件夹
```bash
curl -X POST http://localhost:3001/api/folders \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新文件夹",
    "description": "文件夹描述",
    "parentId": "root",
    "visibility": "public",
    "createdBy": "user_001"
  }'
```

#### 文件上传
```bash
curl -X POST http://localhost:3001/api/files/upload \
  -F "file=@/path/to/document.pdf" \
  -F "folderId=folder_001" \
  -F "title=项目文档" \
  -F "description=项目相关文档" \
  -F "tags=项目,文档"
```

#### 获取文件列表
```bash
curl -X GET "http://localhost:3001/api/files/list?folderId=folder_001&page=1&limit=20"
```

## 🔧 开发调试

### 启用调试模式
在服务器启动时设置环境变量：
```bash
DEBUG=true npm start
```

### 查看API日志
日志文件位置：`server/logs/api.log`

### 测试API接口
推荐使用以下工具测试API：
- **Postman**：图形化API测试工具
- **Insomnia**：轻量级API测试工具
- **curl**：命令行工具
- **Thunder Client**：VS Code插件

### API性能监控
- 响应时间监控
- 错误率统计
- 请求量统计
- 资源使用监控

## 📚 更多资源

- **项目文档**：[README.md](README.md)
- **部署指南**：[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **快速开始**：[QUICK_START.md](QUICK_START.md)
- **项目结构**：[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

---

**本API文档由 Mr.Tony 创建和维护，如有问题请及时反馈。**

*最后更新时间：2024年1月20日*