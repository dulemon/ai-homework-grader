# 🎓 AI 作业批改系统

基于人工智能的作业批改与反馈分析平台，支持客观题自动评分 + 主观题 AI 智能批改。

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![SQLite](https://img.shields.io/badge/SQLite-3-blue?logo=sqlite)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ 功能特性

- 🤖 **AI 智能批改** — 接入 Gemini / DeepSeek / SiliconFlow 等免费 AI 模型
- 📋 **客观题自动评分** — 选择题 + 填空题模板匹配，即时出分
- ✍️ **主观题 AI 批改** — 8 学科差异化 Prompt，语义级评价
- 📷 **拍照识别 OCR** — 上传手写作业照片，Tesseract.js 自动识别文字
- 📱 **多端适配** — 桌面 / 平板 / 手机端全适配，支持底部导航
- 🎨 **亮色主题** — 现代化 UI 设计，渐变色 + 玻璃拟态

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/你的用户名/ai-homework-grader.git
cd ai-homework-grader
```

### 2. 安装依赖

```bash
# 后端
cd server && npm install

# 前端
cd ../client && npm install
```

### 3. 配置 AI（可选）

编辑 `server/.env`，填入任一免费 AI 的 API Key：

```bash
# 推荐 — Google Gemini（完全免费）
GEMINI_API_KEY=your_key_here
# 申请: https://aistudio.google.com/apikey
```

> 不配置也可运行，系统会使用模拟批改。

### 4. 启动

```bash
# 终端1: 启动后端
cd server && node server.js

# 终端2: 启动前端
cd client && npm run dev
```

访问 http://localhost:5173 即可使用。

## 🤖 支持的 AI 模型

| 提供商        | 免费额度     | 中文效果 | 申请地址                                                  |
| ------------- | ------------ | -------- | --------------------------------------------------------- |
| Google Gemini | 1500次/天    | 优秀     | [aistudio.google.com](https://aistudio.google.com/apikey) |
| DeepSeek      | 500万 token  | 最佳     | [platform.deepseek.com](https://platform.deepseek.com)    |
| SiliconFlow   | 2000万 token | 优秀     | [cloud.siliconflow.cn](https://cloud.siliconflow.cn)      |
| OpenAI        | 付费         | 优秀     | [platform.openai.com](https://platform.openai.com)        |

## 📁 项目结构

```
ai-homework-grader/
├── client/                 # 前端 (React + Vite)
│   └── src/
│       ├── components/     # 可复用组件
│       ├── pages/          # 页面
│       └── index.css       # 设计系统
├── server/                 # 后端 (Node.js + Express)
│   ├── routes/             # API 路由
│   ├── services/           # AI 批改 + OCR 服务
│   └── db.js               # 数据库
└── docs/                   # 项目文档
```

## 📖 文档

- [部署指南](docs/部署指南.md) — 环境安装、配置、生产部署
- [代码架构说明](docs/代码架构说明.md) — 技术栈、数据库设计、模块说明
- [功能介绍](docs/功能介绍.md) — 完整功能清单

## 🛠 技术栈

**前端**: React 18 · Vite 5 · React Router · CSS 设计系统

**后端**: Node.js · Express · SQLite · JWT

**AI**: Google Gemini · DeepSeek · SiliconFlow · OpenAI

**OCR**: Tesseract.js

## 📄 License

MIT
