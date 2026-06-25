# 🌅 LifeOS · 人生管理系统

一个基于 **React 19 + TypeScript + Tailwind CSS 4 + Dexie.js** 构建的个人操作系统，帮助你优雅地管理项目、日程、习惯与目标。

> 设计语言：暖色大地系 · 陶土橘 × 琥珀金 — 像一本有温度的手帐

---

## ✨ 功能模块

| 模块 | 说明 |
|------|------|
| 📊 **项目总览** | 甘特图 + 树形列表 + 所有项目视图，支持拖拽调整时间、父子项目、执行记录 |
| 📅 **日程管理** | 今日任务、重要日程、周日程，支持优先级排序、分页、编辑弹窗 |
| ✅ **习惯打卡** | 每日习惯打卡 + 月度热力图（正向/反向打卡） |
| 📆 **迷你日历** | 当月日历，标记重要日程和今日锚点 |
| 🧾 **全部日程** | 全量日程表格，优先级自动排序，分页浏览 |

---

## 🛠 技术栈

| 技术 | 版本 |
|------|------|
| React | 19.x |
| TypeScript | 6.0 |
| Vite | 8.0 |
| Tailwind CSS | 4.3 |
| Dexie.js | 4.4 (IndexedDB) |
| Lucide React | 1.21 (图标) |

---

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

---

## 💻 本地部署（免 Docker）

### 第一步：安装 Node.js

1. 打开 https://nodejs.org
2. 点左边的 **LTS** 下载（长期稳定版）
3. 双击安装，一路「下一步」
4. 验证：按 **Win + R**，输入 `powershell`，回车，输入 `node --version`，看到版本号就行

### 第二步：安装 Git

1. 打开 https://git-scm.com/download/win
2. 下载安装，一路默认选项
3. 验证：同一个 PowerShell 输入 `git --version`

### 第三步：下载 LifeOS

按 **Win + R**，输入 `powershell`，回车。在蓝色窗口里粘贴：

```powershell
cd $env:USERPROFILE\Documents
git clone https://github.com/ElemenX-king/LifeOS.git
cd LifeOS
```

桌面上不会有任何东西，代码安静地放在「文档」里。

### 第四步：安装并启动

```powershell
npm install
npm run build
npm run start:local
```

看到 `🚀 LifeOS on :3000` 就行。**别关这个窗口。**

### 第五步：打开浏览器

访问 http://localhost:3000

---

> 🆕 之后有更新，打开页面会自动提示，点「一键更新」即可。

---

## 🐳 Docker 部署（推荐，带自动更新）

### 第一步：安装 Docker Desktop

1. 打开浏览器，访问 https://www.docker.com/products/docker-desktop/
2. 点击 **Download for Windows**，下载安装包
3. 双击运行，一路「下一步」安装完成
4. 安装后可能需要**重启电脑**
5. 重启后 Docker Desktop 会自动启动，任务栏右下角出现鲸鱼图标 🐳
   - 等待鲸鱼图标停止转动（大约 1 分钟），说明 Docker 已就绪

### 第二步：下载部署文件

1. 打开文件资源管理器，进入「文档」文件夹（`C:\Users\你的用户名\Documents`），新建一个文件夹叫 `LifeOS`
2. 打开浏览器，访问这个链接下载配置文件：
   
   👉 https://raw.githubusercontent.com/ElemenX-king/LifeOS/main/docker-compose.yml
   
   右键 → **另存为**，保存到刚才建的 `LifeOS` 文件夹里

### 第三步：启动

1. 按键盘 **Win + R**，输入 `powershell`，回车
在蓝色窗口里输入以下命令（可以复制粘贴）：

```powershell
cd $env:USERPROFILE\Documents\LifeOS
docker compose up -d
```

3. 等待下载完成（第一次需要下载镜像，大约 3-5 分钟）

### 第四步：打开

浏览器访问 👉 http://localhost:8080

---

> 💡 **自动更新**：Watchtower 每小时检查 `:stable` 镜像，仅在发布新版本时自动更新，日常代码改动不会触发。
>
> 📁 **数据位置**：所有数据存在 `LifeOS` 文件夹下的 `data` 目录，备份这个文件夹即可。

---

## 🎨 色板

| 用途 | 颜色 | 色值 |
|------|------|------|
| 🟠 主色（按钮 / 选中态） | 暖陶土橘 | `#D97D48` |
| 🟡 高亮 / 辅助 | 琥珀金 | `#F2B33D` |
| 🥐 标签衬底 | 柔杏黄 | `#F2BF80` (15% 透明) |
| 🧱 警示 / 今日锚点 | 复古砖红 | `#A64833` |
| 🤎 深度文字 / 标题 | 深可可棕 | `#593325` |

---

## 📁 项目结构

```
src/
├── App.tsx                  # 主应用入口
├── main.tsx                 # ReactDOM 挂载
├── index.css                # 全局样式 (Tailwind + 自定义)
├── components/
│   ├── Banner.tsx           # 顶部封面横幅
│   ├── ModuleCards.tsx      # 5 模块导航卡片
│   ├── MiniCalendar.tsx     # 迷你日历
│   ├── DailyUpdates.tsx     # 每日更新
│   ├── DailyHabits.tsx      # 每日习惯打卡
│   ├── DataTable.tsx        # 今日日程表格
│   ├── MonthlyHeatmap.tsx   # 月度打卡热力图
│   ├── ProjectOverview.tsx  # 仪表盘甘特图
│   ├── ProjectPage.tsx      # 项目管理完整页
│   ├── GanttBar.tsx         # 甘特图可拖拽条
│   ├── ImportantReminder.tsx# 重要日程提醒
│   ├── WeeklySchedule.tsx   # 周日程视图
│   └── SchedulePage.tsx     # 全部日程页
├── hooks/
│   ├── useTodos.ts          # 任务 CRUD
│   ├── useHabits.ts         # 习惯 CRUD
│   ├── useProjects.ts       # 项目 CRUD + 执行记录
│   └── useJournal.ts        # 日志相关
├── db/
│   └── db.ts                # Dexie 数据库定义
└── types/
    └── index.ts             # TypeScript 类型定义
```

---

## 🗄 数据存储

浏览器直连模式使用 **Dexie.js** (IndexedDB 封装)，所有数据存储在浏览器本地。

Docker 部署模式使用 **sql.js**（SQLite 编译为 WebAssembly），数据持久化到 `./data/` 目录。

- 📋 `todos` — 任务表（含优先级、日期、重要标记）
- 📦 `projects` — 项目表（支持树形父子结构、归档）
- 📝 `executions` — 执行记录表
- ✅ `habits` — 习惯定义表
- 📊 `habitRecords` — 习惯打卡记录表

---

## 📄 License

MIT
