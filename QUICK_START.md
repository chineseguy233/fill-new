# 快速开始指南

> 5分钟快速部署文档管理系统

**项目创建人：Mr.Tony**

## 🚀 一键启动

### 前提条件
- 已安装 Node.js 16+ 
- 已安装 Git

### 快速部署
```bash
# 1. 克隆项目
git clone <repository-url>
cd document-management-system

# 2. 安装依赖
npm install
cd server && npm install && cd ..

# 3. 启动后端服务
cd server && npm start &

# 4. 启动前端服务
npm run dev
```

### 访问系统
- 前端地址：http://localhost:5173
- 默认账户：admin / admin123

## 📱 主要功能

| 功能 | 描述 | 快捷键 |
|------|------|--------|
| 📁 文件夹管理 | 创建、编辑、删除文件夹 | - |
| 📄 文档上传 | 支持多种格式文件上传 | 拖拽上传 |
| 🔍 全文搜索 | 快速查找文档内容 | Ctrl+F |
| 👥 用户管理 | 用户注册、权限控制 | - |
| 📊 统计分析 | 存储使用情况统计 | - |

## 🎯 快速操作

### 1. 首次登录
```
用户名：admin
密码：admin123
```
⚠️ **重要**：登录后立即修改密码！

### 2. 创建文件夹
1. 点击"新建文件夹"
2. 输入名称和描述
3. 选择可见性设置
4. 点击"创建"

### 3. 上传文档
1. 进入目标文件夹
2. 点击"上传文档"或直接拖拽文件
3. 填写文档信息
4. 点击"上传"

### 4. 搜索文档
1. 在顶部搜索框输入关键词
2. 按回车或点击搜索按钮
3. 查看搜索结果

## 🔧 常用命令

### 开发环境
```bash
# 启动前端开发服务器
npm run dev

# 启动后端服务器
cd server && npm start

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 维护命令
```bash
# 查看日志
tail -f server/logs/app.log

# 重置管理员密码
node server/reset-admin.js

# 清理临时文件
npm run clean

# 备份数据
cp -r server/data server/data_backup
```

## 📋 检查清单

### 部署前
- [ ] Node.js 版本 >= 16
- [ ] 端口 3001 和 5173 可用
- [ ] 磁盘空间 >= 5GB

### 部署后
- [ ] 前后端服务正常启动
- [ ] 可以访问登录页面
- [ ] 管理员账户可以登录
- [ ] 文件上传功能正常

## 🚨 常见问题

### Q: 端口被占用怎么办？
A: 修改配置文件中的端口号，或结束占用进程

### Q: 上传文件失败？
A: 检查文件大小限制和存储空间

### Q: 忘记管理员密码？
A: 运行 `node server/reset-admin.js` 重置

## 📞 获取帮助

- 📖 详细文档：[README.md](README.md)
- 🛠 部署指南：[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- 🐛 问题反馈：[GitHub Issues]
- 📧 联系作者：Mr.Tony

---

**🎉 恭喜！您已成功部署文档管理系统！**