# 仿黑客松在线竞壳平台 - Hackathon Platform

## 项目简介
仿黑客松在线竞壳平台，支持选手报名参赛、AI自动评分、专家打分、观众投票、成绩排行等功能。

## 技术栈
- **后端**：Spring Boot 2.7 + JPA + MySQL 9.7
- **前端**：React 18 + TypeScript + Vite + Tailwind CSS + Axios
- **构建工具**：Maven (后端) / npm (前端)

## 项目结构
```
hackathon-platform/
├── backend/                 # Spring Boot 后端
├── frontend/                # React + TypeScript 前端
├── sql/                     # 数据库脚本
├── docs/                    # 项目文档
└── README.md
```

## 快速启动（推荐）

**Windows 用户**：双击根目录下的 `start-all.bat` 即可一键启动后端和前端服务。

启动后访问：
- 前端：`http://localhost:5173`
- 后端：`http://localhost:8080`

**注意**：首次运行需确保 MySQL 已启动，并执行数据库初始化脚本（见下方）。

---

## 本地运行

### 前置要求
- JDK 8+
- MySQL 9.7（需提前启动服务）
- Node.js 18+
- Maven 3.9+（已配置在 `D:\tools\apache-maven-3.9.9`）

### 数据库初始化
```bash
# 连接 MySQL 后执行建库脚本
mysql -u root -p < sql/init.sql
```

### 手动启动后端
```bash
cd backend
mvn spring-boot:run
# 访问 http://localhost:8080
```

### 手动启动前端
```bash
cd frontend
npm install
npm run dev
# 访问 http://localhost:5173
```

## 团队
- 组员1（组长/PM）
- 组员2（后端-业务模块）
- 组员3（后端-计分&AI）
- 组员4（前端）
- 组员5（测试&部署&数据库）
- 组员6（前端辅助&素材）

## 开发规范
- 分支命名：`feature/xxx`、`fix/xxx`
- 提交信息：中文，简短描述改动
- 每日 15 分钟站会，同步进度

111
