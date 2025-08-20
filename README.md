# 文档管理系统 (Document Management System)

> 一个功能完整的现代化文档管理系统，支持文件上传、预览、分类管理和用户权限控制。

**项目创建人：Mr.Tony**

## 📋 目录

- [项目简介](#项目简介)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [详细部署指南](#详细部署指南)
- [功能使用说明](#功能使用说明)
- [API文档](#api文档)
- [常见问题](#常见问题)
- [更新日志](#更新日志)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## 🚀 项目简介

文档管理系统是一个基于现代Web技术栈开发的企业级文档管理解决方案。系统提供了完整的文档生命周期管理功能，包括文档上传、存储、预览、分类、搜索和权限控制等核心功能。

### 设计理念

- **用户友好**：直观的界面设计，简单易用的操作流程
- **功能完整**：涵盖文档管理的各个环节
- **安全可靠**：完善的用户权限控制和数据安全保障
- **扩展性强**：模块化设计，易于扩展和维护
- **响应式设计**：支持桌面端和移动端访问

## ✨ 功能特性

### 🔐 用户管理
- **用户注册/登录**：支持邮箱和用户名登录
- **角色权限**：管理员、普通用户等不同权限级别
- **用户资料**：个人信息管理和头像上传
- **活动日志**：用户操作记录和审计

### 📁 文件夹管理
- **层级结构**：支持多级文件夹嵌套
- **权限控制**：公开/私有文件夹设置
- **批量操作**：文件夹的创建、编辑、删除
- **智能统计**：文件夹内文档数量统计

### 📄 文档管理
- **多格式支持**：Word、Excel、PDF、图片、视频等
- **在线预览**：无需下载即可预览文档内容
- **版本控制**：文档版本历史记录
- **标签分类**：灵活的标签系统
- **全文搜索**：基于内容的智能搜索

### 🔍 搜索功能
- **全局搜索**：跨文件夹的全文搜索
- **高级筛选**：按文件类型、日期、大小筛选
- **搜索历史**：保存常用搜索条件
- **实时建议**：搜索关键词自动补全

### 📊 统计分析
- **存储统计**：磁盘使用情况分析
- **文件统计**：文件类型分布统计
- **用户活动**：用户操作行为分析
- **系统监控**：系统运行状态监控

### ⚙️ 系统设置
- **存储配置**：本地/云端存储切换
- **系统参数**：上传限制、预览设置等
- **备份恢复**：数据备份和恢复功能
- **日志管理**：系统日志查看和管理

## 🛠 技术栈

### 前端技术
- **React 18**：现代化的前端框架
- **TypeScript**：类型安全的JavaScript超集
- **Vite**：快速的构建工具
- **Tailwind CSS**：实用优先的CSS框架
- **Shadcn/ui**：高质量的UI组件库
- **React Router**：客户端路由管理
- **Zustand**：轻量级状态管理

### 后端技术
- **Node.js**：JavaScript运行时环境
- **Express.js**：Web应用框架
- **Multer**：文件上传中间件
- **JSON文件存储**：轻量级数据存储方案
- **JWT**：用户认证和授权

### 开发工具
- **ESLint**：代码质量检查
- **Prettier**：代码格式化
- **Git**：版本控制
- **npm/yarn**：包管理器

## 💻 系统要求

### 最低要求
- **操作系统**：Windows 10/macOS 10.14/Ubuntu 18.04 或更高版本
- **Node.js**：版本 16.0 或更高
- **内存**：至少 4GB RAM
- **存储空间**：至少 1GB 可用空间
- **浏览器**：Chrome 90+/Firefox 88+/Safari 14+/Edge 90+

### 推荐配置
- **操作系统**：Windows 11/macOS 12+/Ubuntu 20.04+
- **Node.js**：版本 18.0 或更高
- **内存**：8GB RAM 或更多
- **存储空间**：10GB 或更多可用空间
- **网络**：稳定的互联网连接

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd document-management-system
```

### 2. 安装依赖
```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

### 3. 启动开发服务器
```bash
# 启动后端服务器 (端口: 3001)
cd server
npm start

# 新开终端，启动前端开发服务器 (端口: 5173)
cd ..
npm run dev
```

### 4. 访问应用
打开浏览器访问：`http://localhost:5173`

默认管理员账户：
- 用户名：`admin`
- 密码：`admin123`

## 📖 详细部署指南

### 开发环境部署

#### 步骤1：环境准备
1. **安装Node.js**
   - 访问 [Node.js官网](https://nodejs.org/)
   - 下载并安装LTS版本（推荐18.x或更高）
   - 验证安装：`node --version` 和 `npm --version`

2. **安装Git**
   - 访问 [Git官网](https://git-scm.com/)
   - 下载并安装适合您操作系统的版本
   - 验证安装：`git --version`

3. **选择代码编辑器**
   - 推荐使用 [Visual Studio Code](https://code.visualstudio.com/)
   - 安装推荐插件：ES7+ React/Redux/React-Native snippets、Tailwind CSS IntelliSense

#### 步骤2：项目设置
1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd document-management-system
   ```

2. **安装前端依赖**
   ```bash
   npm install
   ```
   如果遇到网络问题，可以使用国内镜像：
   ```bash
   npm install --registry=https://registry.npmmirror.com
   ```

3. **安装后端依赖**
   ```bash
   cd server
   npm install
   cd ..
   ```

#### 步骤3：配置文件
1. **后端配置**
   - 检查 `server/config/storage.js` 文件
   - 根据需要修改存储路径和配置

2. **前端配置**
   - 检查 `src/lib/apiBase.ts` 文件
   - 确认API基础URL配置正确

#### 步骤4：启动服务
1. **启动后端服务**
   ```bash
   cd server
   npm start
   ```
   看到 "Server running on port 3001" 表示启动成功

2. **启动前端服务**（新开终端）
   ```bash
   npm run dev
   ```
   看到本地服务器地址表示启动成功

### 生产环境部署

#### 方式1：传统服务器部署

1. **构建前端项目**
   ```bash
   npm run build
   ```

2. **配置Web服务器**
   - 使用Nginx或Apache作为反向代理
   - 配置静态文件服务和API代理

3. **配置进程管理**
   ```bash
   # 安装PM2
   npm install -g pm2
   
   # 启动后端服务
   cd server
   pm2 start app.js --name "doc-management-api"
   
   # 设置开机自启
   pm2 startup
   pm2 save
   ```

#### 方式2：Docker部署

1. **创建Dockerfile**
   ```dockerfile
   # 前端构建
   FROM node:18-alpine as frontend-build
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   
   # 后端运行
   FROM node:18-alpine
   WORKDIR /app
   COPY server/package*.json ./
   RUN npm install --production
   COPY server/ .
   COPY --from=frontend-build /app/dist ./public
   EXPOSE 3001
   CMD ["node", "app.js"]
   ```

2. **构建和运行**
   ```bash
   docker build -t doc-management .
   docker run -p 3001:3001 -v $(pwd)/data:/app/data doc-management
   ```

## 📚 功能使用说明

### 用户管理

#### 注册新用户
1. 访问系统首页，点击"注册"按钮
2. 填写用户信息：
   - 用户名（3-20个字符，支持字母、数字、下划线）
   - 邮箱地址（用于登录和通知）
   - 密码（至少6个字符）
   - 确认密码
3. 点击"注册"完成账户创建
4. 系统会自动登录新注册的用户

#### 用户登录
1. 在登录页面输入用户名/邮箱和密码
2. 可选择"记住我"保持登录状态
3. 点击"登录"进入系统

#### 个人资料管理
1. 点击右上角用户头像，选择"个人设置"
2. 可以修改：
   - 个人信息（姓名、邮箱等）
   - 头像上传
   - 密码修改
   - 通知设置

### 文件夹管理

#### 创建文件夹
1. 在文件夹页面点击"新建文件夹"按钮
2. 填写文件夹信息：
   - 文件夹名称（必填）
   - 描述信息（可选）
   - 可见性设置（公开/私有）
3. 点击"创建"完成

#### 文件夹操作
- **编辑**：点击文件夹卡片上的编辑按钮
- **删除**：点击删除按钮，确认后删除（注意：删除前需要清空文件夹）
- **权限设置**：点击设置按钮修改可见性
- **进入文件夹**：点击文件夹名称或图标

### 文档管理

#### 上传文档
1. 进入目标文件夹
2. 点击"上传文档"按钮
3. 选择文件上传方式：
   - 点击选择文件
   - 拖拽文件到上传区域
4. 填写文档信息：
   - 文档标题
   - 描述信息
   - 标签（用逗号分隔）
5. 点击"上传"完成

#### 文档预览
1. 在文档列表中点击文档名称
2. 系统支持以下格式的在线预览：
   - 图片：JPG、PNG、GIF、WebP
   - 文档：PDF、TXT、MD
   - 视频：MP4、WebM、OGV
   - 音频：MP3、WAV、OGG

#### 文档操作
- **下载**：点击下载按钮保存到本地
- **移动**：将文档移动到其他文件夹
- **编辑信息**：修改文档标题、描述、标签
- **删除**：删除文档（可在回收站恢复）

### 搜索功能

#### 全局搜索
1. 在顶部搜索框输入关键词
2. 系统会搜索：
   - 文档标题
   - 文档内容
   - 标签信息
   - 文件夹名称

#### 高级搜索
1. 点击搜索框旁的"高级搜索"
2. 可以设置筛选条件：
   - 文件类型
   - 上传日期范围
   - 文件大小范围
   - 特定文件夹

### 系统设置

#### 存储配置
1. 管理员进入"系统设置"页面
2. 在"存储设置"中可以：
   - 选择存储方式（本地/云端）
   - 设置存储路径
   - 配置上传限制

#### 用户管理（管理员功能）
1. 进入"用户管理"页面
2. 可以进行以下操作：
   - 查看所有用户列表
   - 编辑用户信息
   - 重置用户密码
   - 禁用/启用用户账户
   - 设置用户权限

## 🔌 API文档

### 认证接口

#### 用户登录
```http
POST /api/users/login
Content-Type: application/json

{
  "identifier": "用户名或邮箱",
  "password": "密码"
}
```

#### 用户注册
```http
POST /api/users/register
Content-Type: application/json

{
  "username": "用户名",
  "email": "邮箱",
  "password": "密码",
  "fullName": "全名"
}
```

### 文件夹接口

#### 获取文件夹列表
```http
GET /api/folders
```

#### 创建文件夹
```http
POST /api/folders
Content-Type: application/json

{
  "name": "文件夹名称",
  "description": "描述",
  "visibility": "public|private"
}
```

#### 删除文件夹
```http
DELETE /api/folders/:id
```

### 文件接口

#### 上传文件
```http
POST /api/files/upload
Content-Type: multipart/form-data

file: 文件数据
folderId: 文件夹ID
title: 文件标题
description: 文件描述
tags: 标签
```

#### 获取文件列表
```http
GET /api/files/list?folderId=文件夹ID
```

#### 下载文件
```http
GET /api/files/download/:filename
```

## ❓ 常见问题

### 安装问题

**Q: npm install 失败怎么办？**
A: 
1. 检查Node.js版本是否符合要求
2. 清除npm缓存：`npm cache clean --force`
3. 使用国内镜像：`npm install --registry=https://registry.npmmirror.com`
4. 删除node_modules文件夹后重新安装

**Q: 端口被占用怎么办？**
A:
1. 查看端口占用：`netstat -ano | findstr :3001`
2. 结束占用进程或修改配置文件中的端口号
3. 前端端口可以在vite.config.ts中修改

### 使用问题

**Q: 上传文件失败？**
A:
1. 检查文件大小是否超过限制
2. 检查文件格式是否支持
3. 确认存储空间是否充足
4. 查看浏览器控制台错误信息

**Q: 文件预览不显示？**
A:
1. 确认文件格式是否支持预览
2. 检查文件是否损坏
3. 清除浏览器缓存后重试

**Q: 忘记管理员密码？**
A:
1. 停止服务器
2. 运行重置脚本：`node server/reset-admin.js`
3. 重新启动服务器

### 性能问题

**Q: 系统运行缓慢？**
A:
1. 检查服务器资源使用情况
2. 清理不必要的文件和日志
3. 考虑升级服务器配置
4. 优化数据库查询

## 📝 更新日志

### v1.0.0 (2024-01-20)
- 🎉 初始版本发布
- ✨ 完整的文档管理功能
- 🔐 用户认证和权限控制
- 📁 文件夹层级管理
- 🔍 全文搜索功能
- 📊 统计分析功能

### 计划中的功能
- 📱 移动端APP
- 🔄 文档版本控制
- 💬 协作评论功能
- 🔗 文档分享链接
- 📧 邮件通知
- 🌐 多语言支持

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献
1. Fork 项目到您的GitHub账户
2. 创建功能分支：`git checkout -b feature/AmazingFeature`
3. 提交更改：`git commit -m 'Add some AmazingFeature'`
4. 推送到分支：`git push origin feature/AmazingFeature`
5. 创建Pull Request

### 代码规范
- 使用TypeScript编写代码
- 遵循ESLint和Prettier配置
- 编写清晰的提交信息
- 添加必要的注释和文档

### 报告问题
如果您发现了bug或有功能建议，请：
1. 检查是否已有相关issue
2. 创建新的issue，详细描述问题
3. 提供复现步骤和环境信息

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- **项目创建人**：Mr.Tony
- **项目地址**：[GitHub Repository]
- **问题反馈**：[Issues页面]
- **邮箱联系**：[联系邮箱]

## 🙏 致谢

感谢以下开源项目和贡献者：
- React团队提供的优秀框架
- Tailwind CSS的设计系统
- Shadcn/ui的组件库
- 所有测试用户和反馈者

---

**如果这个项目对您有帮助，请给我们一个⭐️！**