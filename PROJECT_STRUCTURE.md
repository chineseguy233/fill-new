# 项目结构说明

> 文档管理系统项目架构和文件组织说明

**项目创建人：Mr.Tony**

## 📁 项目总览

```
document-management-system/
├── 📄 README.md                    # 项目说明文档
├── 📄 DEPLOYMENT_GUIDE.md          # 部署使用手册
├── 📄 QUICK_START.md               # 快速开始指南
├── 📄 PROJECT_STRUCTURE.md         # 项目结构说明
├── 📄 package.json                 # 前端依赖配置
├── 📄 vite.config.ts               # Vite构建配置
├── 📄 tailwind.config.ts           # Tailwind CSS配置
├── 📄 tsconfig.json                # TypeScript配置
├── 📁 src/                         # 前端源代码
├── 📁 server/                      # 后端源代码
└── 📁 public/                      # 静态资源文件
```

## 🎨 前端架构 (src/)

### 核心文件
```
src/
├── 📄 main.tsx                     # 应用入口文件
├── 📄 App.tsx                      # 根组件
├── 📄 layout.tsx                   # 布局组件
├── 📄 globals.css                  # 全局样式
└── 📄 vite-env.d.ts               # Vite类型声明
```

### 页面组件 (pages/)
```
src/pages/
├── 📄 login.tsx                    # 登录页面
├── 📄 register.tsx                 # 注册页面
├── 📄 dashboard-page.tsx           # 仪表板页面
├── 📄 folders-page.tsx             # 文件夹管理页面
├── 📄 documents-page.tsx           # 文档管理页面
├── 📄 document-detail-page.tsx     # 文档详情页面
├── 📄 document-preview-page.tsx    # 文档预览页面
├── 📄 folder-detail-page.tsx       # 文件夹详情页面
├── 📄 search-page.tsx              # 搜索页面
├── 📄 file-search-page.tsx         # 文件搜索页面
├── 📄 settings-page.tsx            # 设置页面
├── 📄 enhanced-settings-page.tsx   # 增强设置页面
├── 📄 storage-settings-page.tsx    # 存储设置页面
├── 📄 storage-test-page.tsx        # 存储测试页面
├── 📄 cloud-storage-config-page.tsx # 云存储配置页面
├── 📄 user-management-page.tsx     # 用户管理页面
├── 📄 data-management-page.tsx     # 数据管理页面
├── 📄 file-statistics-page.tsx     # 文件统计页面
├── 📄 admin-logs-page.tsx          # 管理员日志页面
└── 📄 admin-activity-logs-page.tsx # 管理员活动日志页面
```

### 通用组件 (components/)
```
src/components/
├── 📄 header.tsx                   # 页面头部组件
├── 📄 sidebar.tsx                  # 侧边栏组件
├── 📄 ProtectedRoute.tsx           # 路由保护组件
├── 📄 theme-provider.tsx           # 主题提供者
├── 📄 DocumentUpload.tsx           # 文档上传组件
├── 📄 FileMoveDialog.tsx           # 文件移动对话框
├── 📄 FileStatistics.tsx           # 文件统计组件
├── 📄 FileViewCounter.tsx          # 文件查看计数器
├── 📄 FolderSelector.tsx           # 文件夹选择器
├── 📄 SimpleFolderSelector.tsx     # 简单文件夹选择器
├── 📄 StoragePathSelector.tsx      # 存储路径选择器
├── 📄 StorageStatistics.tsx        # 存储统计组件
├── 📄 StorageStatus.tsx            # 存储状态组件
├── 📄 UserActivityLogger.tsx       # 用户活动记录器
└── 📁 FilePreviewers/              # 文件预览器组件
    ├── 📄 index.tsx                # 预览器入口
    ├── 📄 ImageViewer.tsx          # 图片预览器
    ├── 📄 TextViewer.tsx           # 文本预览器
    ├── 📄 VideoPlayer.tsx          # 视频播放器
    ├── 📄 WordViewer.tsx           # Word文档预览器
    └── 📄 ExcelViewer.tsx          # Excel文档预览器
```

### UI组件库 (components/ui/)
```
src/components/ui/
├── 📄 accordion.tsx               # 手风琴组件
├── 📄 alert-dialog.tsx            # 警告对话框
├── 📄 alert.tsx                   # 警告组件
├── 📄 aspect-ratio.tsx            # 宽高比组件
├── 📄 avatar.tsx                  # 头像组件
├── 📄 badge.tsx                   # 徽章组件
├── 📄 breadcrumb.tsx              # 面包屑导航
├── 📄 button.tsx                  # 按钮组件
├── 📄 card.tsx                    # 卡片组件
├── 📄 checkbox.tsx                # 复选框组件
├── 📄 dialog.tsx                  # 对话框组件
├── 📄 dropdown-menu.tsx           # 下拉菜单
├── 📄 form.tsx                    # 表单组件
├── 📄 input.tsx                   # 输入框组件
├── 📄 label.tsx                   # 标签组件
├── 📄 progress.tsx                # 进度条组件
├── 📄 select.tsx                  # 选择器组件
├── 📄 separator.tsx               # 分隔符组件
├── 📄 sheet.tsx                   # 抽屉组件
├── 📄 table.tsx                   # 表格组件
├── 📄 tabs.tsx                    # 标签页组件
├── 📄 textarea.tsx                # 文本域组件
├── 📄 toast.tsx                   # 提示组件
└── 📄 toaster.tsx                 # 提示容器
```

### 上下文管理 (contexts/)
```
src/contexts/
└── 📄 AuthContext.tsx             # 认证上下文
```

### 工具函数 (lib/)
```
src/lib/
├── 📄 utils.ts                    # 通用工具函数
├── 📄 auth.ts                     # 认证相关函数
├── 📄 storage.ts                  # 存储相关函数
├── 📄 backendStorage.ts           # 后端存储函数
├── 📄 cloudbase.ts                # 云开发相关函数
├── 📄 apiBase.ts                  # API基础配置
└── 📁 database/                   # 数据库相关
```

### 自定义钩子 (hooks/)
```
src/hooks/
├── 📄 use-toast.ts                # 提示钩子
└── 📄 use-mobile.tsx              # 移动端检测钩子
```

### 工具类 (utils/)
```
src/utils/
├── 📄 adminSetup.ts               # 管理员设置工具
└── 📄 dataManager.ts              # 数据管理工具
```

## 🔧 后端架构 (server/)

### 核心文件
```
server/
├── 📄 app.js                      # 服务器入口文件
├── 📄 package.json                # 后端依赖配置
├── 📄 generate-test-logs.js       # 测试日志生成器
└── 📄 reset-folders.js            # 文件夹重置脚本
```

### 路由模块 (routes/)
```
server/routes/
├── 📄 users.js                    # 用户相关路由
├── 📄 folders.js                  # 文件夹相关路由
├── 📄 files.js                    # 文件相关路由
└── 📄 userLogs.js                 # 用户日志路由
```

### 中间件 (middleware/)
```
server/middleware/
├── 📄 logger.js                   # 日志中间件
└── 📄 upload.js                   # 文件上传中间件
```

### 数据模型 (models/)
```
server/models/
└── 📄 userLog.js                  # 用户日志模型
```

### 配置文件 (config/)
```
server/config/
├── 📄 storage.js                  # 存储配置
├── 📄 storage-config.json         # 存储配置文件
└── 📄 users.backup.json           # 用户备份文件
```

### 数据存储 (data/)
```
server/data/                       # 运行时生成
├── 📄 users.json                  # 用户数据
├── 📄 folders.json                # 文件夹数据
├── 📄 user-logs.json              # 用户日志数据
└── 📁 uploads/                    # 上传文件存储
    ├── 📁 documents/              # 文档文件
    ├── 📁 images/                 # 图片文件
    └── 📁 temp/                   # 临时文件
```

## 🔄 数据流架构

### 前端数据流
```
用户操作 → React组件 → Context/Hooks → API调用 → 后端服务
    ↑                                                    ↓
UI更新 ← 状态更新 ← 数据处理 ← API响应 ← 数据库操作
```

### 后端数据流
```
API请求 → 路由处理 → 中间件处理 → 业务逻辑 → 数据存储
    ↑                                              ↓
响应返回 ← 数据格式化 ← 错误处理 ← 数据验证 ← 文件操作
```

## 🎯 核心功能模块

### 1. 用户认证模块
- **前端**：`src/contexts/AuthContext.tsx`
- **后端**：`server/routes/users.js`
- **功能**：登录、注册、权限验证

### 2. 文件管理模块
- **前端**：`src/pages/documents-page.tsx`
- **后端**：`server/routes/files.js`
- **功能**：文件上传、下载、预览、删除

### 3. 文件夹管理模块
- **前端**：`src/pages/folders-page.tsx`
- **后端**：`server/routes/folders.js`
- **功能**：文件夹创建、编辑、删除、权限控制

### 4. 搜索功能模块
- **前端**：`src/pages/search-page.tsx`
- **后端**：集成在各个路由中
- **功能**：全文搜索、高级筛选

### 5. 系统设置模块
- **前端**：`src/pages/settings-page.tsx`
- **后端**：`server/config/storage.js`
- **功能**：系统配置、存储设置

### 6. 用户管理模块
- **前端**：`src/pages/user-management-page.tsx`
- **后端**：`server/routes/users.js`
- **功能**：用户列表、权限管理

### 7. 统计分析模块
- **前端**：`src/components/FileStatistics.tsx`
- **后端**：集成在各个路由中
- **功能**：存储统计、使用分析

## 🔐 安全架构

### 前端安全
- **路由保护**：`ProtectedRoute.tsx`
- **权限验证**：`AuthContext.tsx`
- **输入验证**：表单验证组件

### 后端安全
- **身份验证**：JWT令牌验证
- **文件验证**：文件类型和大小限制
- **路径安全**：防止路径遍历攻击
- **日志记录**：操作审计日志

## 📦 依赖管理

### 前端主要依赖
```json
{
  "react": "^18.2.0",
  "typescript": "^5.0.0",
  "vite": "^5.0.0",
  "tailwindcss": "^3.3.0",
  "@radix-ui/react-*": "各种UI组件",
  "lucide-react": "图标库",
  "react-router-dom": "路由管理"
}
```

### 后端主要依赖
```json
{
  "express": "^4.18.0",
  "multer": "^1.4.5",
  "cors": "^2.8.5",
  "fs-extra": "^11.1.0",
  "uuid": "^9.0.0"
}
```

## 🚀 构建和部署

### 开发环境
```bash
# 前端开发服务器
npm run dev          # 启动Vite开发服务器

# 后端开发服务器
cd server && npm start  # 启动Express服务器
```

### 生产环境
```bash
# 构建前端
npm run build        # 生成dist/目录

# 部署后端
cd server && npm start  # 生产环境启动
```

## 📊 性能优化

### 前端优化
- **代码分割**：React.lazy()懒加载
- **资源优化**：Vite自动优化
- **缓存策略**：浏览器缓存配置
- **图片优化**：WebP格式支持

### 后端优化
- **文件流**：大文件流式传输
- **缓存机制**：静态资源缓存
- **压缩传输**：Gzip压缩
- **数据库优化**：索引和查询优化

## 🔍 监控和日志

### 前端监控
- **错误捕获**：React错误边界
- **性能监控**：Web Vitals指标
- **用户行为**：操作日志记录

### 后端监控
- **访问日志**：Express日志中间件
- **错误日志**：异常捕获和记录
- **性能监控**：响应时间统计
- **系统监控**：资源使用情况

## 📝 开发规范

### 代码规范
- **TypeScript**：严格类型检查
- **ESLint**：代码质量检查
- **Prettier**：代码格式化
- **命名规范**：驼峰命名法

### 文件命名
- **组件文件**：PascalCase (UserProfile.tsx)
- **页面文件**：kebab-case-page.tsx
- **工具文件**：camelCase.ts
- **常量文件**：UPPER_CASE.ts

### 提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

---

**本文档由 Mr.Tony 创建和维护，帮助开发者快速理解项目架构。**