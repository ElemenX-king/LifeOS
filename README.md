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

## 🐳 Docker 部署

```bash
# 拉取镜像并启动（含 Watchtower 自动更新）
docker compose up -d

# 访问 http://localhost:8080
```

- **Watchtower** 每小时自动检查 `ghcr.io/elemenx-king/lifeos:latest` 更新并重启容器
- 数据保存在 `./data/` 目录，重启不丢失
- 要求：Docker + Docker Compose

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
