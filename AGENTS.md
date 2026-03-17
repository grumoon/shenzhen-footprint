# AGENTS.md — AI 协作规则

> 本文件定义了 AI Agent 在本项目中工作时必须遵守的约定。使用任何 AI 工具操作本项目前，请先阅读此文件。

## 项目简介

**深圳足迹** — 我的深圳私人地图。个人项目，用于标记和展示深圳的足迹、公园、山峰、远足径等地理信息。

- GitHub: https://github.com/grumoon/shenzhen-footprint
- 线上地址: http://119.29.94.232:3002

## 项目架构

Monorepo 前后端分离：

```
├── client/          # 前端：React 18 + TypeScript 5.5 + Vite 5 + 高德地图 JS API
│   ├── public/      # 静态 GeoJSON 数据文件（地图图层）
│   ├── dist/        # 构建产物（含 GeoJSON 副本）
│   └── src/
│       ├── components/   # React 组件（MapView 为核心）
│       ├── hooks/        # 自定义 Hooks（useAMap, useIsMobile）
│       ├── types/        # TypeScript 类型定义
│       └── utils/        # API 封装
├── server/          # 后端：Fastify 4 + TypeScript + JSON 文件存储
│   ├── src/         # 服务端源码
│   └── data/        # JSON 数据文件（categories.json, footprints.json）
├── data/            # 原始地理数据源（GeoJSON、Excel、JSON）
├── scripts/         # Python 数据处理脚本（坐标转换、数据清洗）
└── tools/           # 辅助 HTML 工具页
```

### 关键文件

- `client/src/components/MapView.tsx` — 核心地图组件（~27KB，最大文件）
- `client/src/components/TopBar.tsx` — 顶栏，一级/二级分类联动
- `client/src/utils/api.ts` — RESTful API 封装（/api/footprints, /api/categories）
- `server/src/routes/footprints.ts` — 后端 CRUD 路由

### 端口约定

| 环境 | 端口 | 说明 |
|------|------|------|
| 本地前端 | 3000 | Vite dev server |
| 本地后端 | 3001 | Fastify (tsx watch) |
| 线上服务 | 3002 | 3000 被 GruCGI 占用 |

## 坐标系（重要）

**`client/public/` 中所有 GeoJSON 必须使用 GCJ02（火星坐标系）**，因为高德地图使用 GCJ02。

处理数据时注意：

- **WGS84 来源**（如 OSM Overpass API）→ 必须转换为 GCJ02
- **已经是 GCJ02 的数据**（如两步路 APP、国内地图服务）→ **不要再转换**，否则双重偏移
- 转换前务必确认数据源的坐标系，写注释说明

## 地图图层数据

`client/public/` 下的 GeoJSON 文件：

| 文件 | 图层 | 说明 |
|------|------|------|
| shenzhen-districts.geojson | 行政区边界 | ~74KB |
| shenzhen-streets.geojson | 街道边界 | ~654KB |
| shenzhen-communities.geojson | 社区边界 | 已废弃，待删除 |
| shenzhen-parks.geojson | 公园（1320个） | ~1MB，含自然/城市/社区三类 |
| shenzhen-peaks.geojson | 山峰（77座） | ~26KB，含海拔/难度/描述等 |
| shenzhen-trails.geojson | 远足径（36条轨迹） | ~1MB，三径三线 |

### 数据处理规范

1. 数据处理脚本统一放 `scripts/`，使用 Python
2. 原始数据放 `data/`，最终版放 `client/public/`
3. 修改 GeoJSON 后，**必须同步更新 `client/public/` 和 `client/dist/` 两份**

## 部署

### 服务器信息

- IP: 119.29.94.232，用户: grumoon，SSH 免密（ed25519 密钥）
- Nginx root: `~/web/shenzhen-footprint/client/dist`
- PM2 进程名: `footprint-api`

### 前端部署

```bash
cd ~/project/shenzhen-footprint/client && npm run build
scp -r client/dist/* grumoon@119.29.94.232:~/web/shenzhen-footprint/client/dist/
```

### 后端部署

```bash
rsync -avz --exclude='node_modules' server/ grumoon@119.29.94.232:~/web/shenzhen-footprint/server/
ssh grumoon@119.29.94.232 "cd ~/web/shenzhen-footprint/server && npm install && pm2 restart footprint-api"
```

### 仅更新数据文件

不需要重新构建前端，直接 scp：

```bash
scp client/public/shenzhen-xxx.geojson grumoon@119.29.94.232:~/web/shenzhen-footprint/client/dist/shenzhen-xxx.geojson
```

### 部署后必须验证

```bash
curl -sI http://119.29.94.232:3002/shenzhen-xxx.geojson  # 检查 HTTP 200
```

## 操作安全约定

1. **安装/卸载软件、修改工具链版本、修改 shell 配置** — 必须先跟我确认再执行
2. **修改 Nginx 配置** — 先备份，改完 `nginx -t` 验证语法后再 reload
3. **Git push** — 仅 push main 分支，确认 SSH 密钥配置正确
4. **覆盖数据文件** — public/ 和 dist/ 必须同步更新，不要漏一份

## 代码风格

- TypeScript strict 模式
- 函数式组件 + Hooks，不用 class 组件
- API 调用统一走 `utils/api.ts`，不直接 fetch
- 中文注释，中文 commit message
- Python 脚本加注释说明数据来源和坐标系
