# GitHub Recap

一个赛博朋克风格的 GitHub 年度总结生成器，帮助你回顾在 GitHub 上的贡献历程。

![GitHub Recap Preview](images/preview.jpg)

## ✨ 功能特性

- 🎯 **年度贡献统计** - 查看 Commits、Pull Requests、Issues、Reviews 等核心指标
- 📊 **贡献热力图** - 可视化展示全年/全部时间的贡献分布
- 🏆 **开发者人格匹配** - 根据贡献模式匹配专属开发者人格标签
- 📈 **年度对比** - 与上一年数据对比，了解成长轨迹
- 🌐 **多语言分析** - 展示你最常用的编程语言分布
- ⏰ **全时间线支持** - 可查看从账号创建至今的全部贡献数据
- 🎨 **赛博朋克 UI** - 炫酷的终端风格界面设计

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn 或 pnpm

### 安装

```bash
# 克隆仓库
git clone https://github.com/Smartuil/Github-Recap.git
cd Github-Recap

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 查看应用。

### 配置 GitHub Token（可选）

为获取完整的年度贡献数据（包括 commit、PR、issue、review、连击等），建议配置 GitHub Token：

1. 访问 [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. 生成一个新的 Token（Classic），勾选 `read:user` 权限
3. 创建 `.env.local` 文件：

```env
GITHUB_TOKEN=ghp_your_token_here
```

> 💡 不配置 Token 也可以使用，但只能获取公开的仓库概览数据。

## 📦 技术栈

- **框架**: [Next.js 16](https://nextjs.org/) + React 19
- **样式**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI 组件**: [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **动画**: [Framer Motion](https://www.framer.com/motion/)
- **数据源**: GitHub REST API + GraphQL API
- **语言**: TypeScript

## 🏗️ 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/recap/          # API 路由
│   ├── layout.tsx          # 根布局
│   └── page.tsx            # 首页
├── components/
│   ├── recap/              # Recap 核心组件
│   │   ├── pages/          # 各页面组件
│   │   │   ├── IntroPage.tsx       # 输入页
│   │   │   ├── StatsPage.tsx       # 统计页
│   │   │   ├── LanguagePage.tsx    # 语言页
│   │   │   ├── PersonalityPage.tsx # 人格页
│   │   │   ├── OutroPage.tsx       # 结束页
│   │   │   └── HeatmapCard.tsx     # 热力图组件
│   │   ├── fullpage.tsx    # 全屏滚动组件
│   │   └── recap-app.tsx   # 主应用组件
│   └── ui/                 # 通用 UI 组件
└── lib/
    └── recap/
        ├── api.ts          # 前端 API 调用
        ├── types.ts        # 类型定义
        ├── personality.ts  # 人格匹配逻辑
        └── server/         # 服务端逻辑
            ├── github.ts   # GitHub API 封装
            └── recap.ts    # 数据处理
```

## 🌍 部署

### Vercel（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Smartuil/Github-Recap)

1. Fork 本仓库
2. 在 Vercel 导入项目
3. 配置环境变量 `GITHUB_TOKEN`（可选）
4. 部署完成

### EdgeOne Pages

1. 在 EdgeOne Pages 控制台创建项目
2. 连接 GitHub 仓库
3. 构建命令：`npm run build`
4. 输出目录：`.next`
5. 配置环境变量后部署

### 其他平台

支持任何能运行 Node.js 的平台，如 Cloudflare Pages、Netlify、Railway 等。

## 📝 使用说明

1. **输入用户名** - 在首页输入 GitHub 用户名
2. **选择年份** - 可选择特定年份或"所有时间"
3. **填写 Token**（可选）- 填写 GitHub Token 获取更完整数据
4. **加载报告** - 点击按钮加载数据
5. **浏览报告** - 上下滑动或使用键盘浏览各页面

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT License

## 🙏 致谢

- [GitHub API](https://docs.github.com/en/rest) - 数据来源
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Vercel](https://vercel.com/) - 部署平台

---

Made with ❤️ by [Smartuil](https://github.com/Smartuil)
