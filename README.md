# 文档管理系统

一个现代化的文档管理系统，基于 React + TypeScript + shadcn/ui 构建，提供完整的文档上传、管理、预览和协作功能。

## 🚀 功能特性

### 核心功能
- **用户认证** - 安全的登录/注册系统
- **文档管理** - 上传、下载、预览、删除文档
- **搜索筛选** - 全文搜索和标签筛选
- **收藏系统** - 收藏重要文档
- **评论协作** - 文档评论和讨论
- **权限管理** - 用户权限和访问控制

### 界面特性
- **响应式设计** - 适配桌面和移动设备
- **现代UI** - 基于 shadcn/ui 的精美界面
- **主题切换** - 支持浅色/深色主题
- **多视图模式** - 网格和列表视图切换

## 🛠 技术栈

- **前端框架**: React 18 + TypeScript
- **UI组件库**: shadcn/ui + Radix UI
- **样式框架**: Tailwind CSS
- **路由管理**: React Router DOM
- **图标库**: Lucide React
- **构建工具**: Vite
- **包管理器**: npm

## 📦 项目结构

```
document-management-system/
├── public/                 # 静态资源
├── src/
│   ├── components/         # 组件目录
│   │   ├── ui/            # shadcn/ui 组件
│   │   ├── header.tsx     # 顶部导航栏
│   │   └── sidebar.tsx    # 侧边栏导航
│   ├── pages/             # 页面组件
│   │   ├── login-page.tsx         # 登录页面
│   │   ├── dashboard-page.tsx     # 仪表盘
│   │   ├── documents-page.tsx     # 文档管理
│   │   ├── document-detail-page.tsx # 文档详情
│   │   └── settings-page.tsx      # 设置页面
│   ├── hooks/             # 自定义 Hooks
│   ├── lib/               # 工具函数
│   ├── App.tsx            # 主应用组件
│   ├── main.tsx           # 应用入口
│   ├── layout.tsx         # 布局组件
│   └── globals.css        # 全局样式
├── components.json        # shadcn/ui 配置
├── tailwind.config.ts     # Tailwind 配置
├── vite.config.ts         # Vite 配置
└── package.json           # 项目依赖
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装依赖
```bash
cd document-management-system
npm install
```

### 启动开发服务器
```bash
npm run dev
```

访问 `http://localhost:5173` 查看应用

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 📱 页面功能

### 1. 登录页面 (`/login`)
- 用户邮箱密码登录
- 密码显示/隐藏切换
- 忘记密码链接
- 响应式设计

### 2. 仪表盘 (`/dashboard`)
- 文档统计数据展示
- 最近访问文档列表
- 收藏文档管理
- 快速操作入口

### 3. 文档管理 (`/documents`)
- 文档列表展示（网格/列表视图）
- 实时搜索功能
- 标签筛选
- 批量操作
- 文档上传

### 4. 文档详情 (`/documents/:id`)
- 文档预览界面
- 文档信息展示
- 评论系统
- 相关文档推荐
- 下载和分享功能

### 5. 设置页面 (`/settings`)
- 个人资料管理
- 通知设置
- 安全设置
- 外观主题设置
- 存储空间管理

## 🎨 设计系统

### 色彩方案
- **主色调**: 深蓝色 (#1e3a8a)
- **辅助色**: 天蓝色 (#3b82f6)
- **背景色**: 浅灰色 (#f3f4f6)
- **文字色**: 深灰色 (#111827)

### 组件规范
- 使用 shadcn/ui 组件库
- 统一的圆角设计 (rounded-lg)
- 一致的间距系统 (Tailwind spacing)
- 优雅的阴影效果

## 🔧 开发指南

### 添加新页面
1. 在 `src/pages/` 目录创建新的页面组件
2. 在 `src/App.tsx` 中添加路由配置
3. 在 `src/components/sidebar.tsx` 中添加导航链接

### 添加新组件
1. 在 `src/components/` 目录创建组件文件
2. 使用 TypeScript 定义组件 Props
3. 遵循现有的命名和样式规范

### 样式开发
- 优先使用 Tailwind CSS 类名
- 复杂样式可在 `globals.css` 中定义
- 保持响应式设计原则

## 📋 部署指南

### 静态部署 (推荐)

#### Vercel 部署
1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 自动构建和部署

#### Netlify 部署
1. 构建项目: `npm run build`
2. 将 `dist` 目录上传到 Netlify
3. 配置重定向规则

#### GitHub Pages 部署
1. 安装 gh-pages: `npm install --save-dev gh-pages`
2. 在 package.json 添加部署脚本:
```json
{
  "scripts": {
    "deploy": "gh-pages -d dist"
  }
}
```
3. 运行: `npm run build && npm run deploy`

### 服务器部署

#### Nginx 配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://your-backend-api;
    }
}
```

## 🔮 后续开发计划

### 功能扩展
- [ ] 文件夹管理系统
- [ ] 文档版本控制
- [ ] 在线文档编辑
- [ ] 团队协作功能
- [ ] 文档分享链接
- [ ] 高级搜索功能

### 技术优化
- [ ] 添加单元测试
- [ ] 性能优化
- [ ] PWA 支持
- [ ] 国际化支持
- [ ] 无障碍访问优化

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -am 'Add new feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 提交 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 邮箱: your-email@example.com
- GitHub Issues: [项目Issues页面]

---

**开发团队** | 2024年1月