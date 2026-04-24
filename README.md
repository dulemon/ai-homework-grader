# 🎓 AI 作业批改系统

基于人工智能的作业批改与反馈分析平台，支持客观题自动评分、主观题 AI 智能批改，以及移动端 H5 图片识别导入。

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![SQLite](https://img.shields.io/badge/SQLite-3-blue?logo=sqlite)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ 功能特性

- 🤖 **AI 智能批改** — 接入 Gemini / DeepSeek / SiliconFlow 等免费 AI 模型
- 📋 **客观题自动评分** — 选择题 + 填空题模板匹配，即时出分
- ✍️ **主观题 AI 批改** — 8 学科差异化 Prompt，语义级评价
- 📷 **图片识别 OCR** — 教师可导入题目图片，学生可上传答案图片，Tesseract.js 自动识别文字
- 📱 **移动端 H5 适配** — 桌面 / 平板 / 手机端全适配，支持抽屉导航与底部导航
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

### 5. 手机热点 / 局域网演示

如果用于毕业设计答辩，可以直接让电脑连接手机热点，手机与电脑在同一网络下访问前端 H5 页面。

```bash
# 终端1: 启动后端
cd server && node server.js

# 终端2: 启动前端（已默认监听 0.0.0.0）
cd client && npm run dev
```

然后在电脑上查看局域网 IP：

- macOS: `ifconfig`
- Windows: `ipconfig`

假设电脑 IP 为 `172.20.10.2`，则手机浏览器访问：

```text
http://172.20.10.2:5173
```

注意：

- 手机和电脑必须在同一个热点或局域网下
- 如果手机打不开页面，优先检查电脑防火墙是否拦截 `5173` 或 `3001` 端口
- OCR 和 AI 批改仍由电脑上运行的后端提供

## 📱 当前形态

本项目当前形态为：

- 前端：React + Vite 构建的 H5 页面
- 后端：Node.js + Express API
- 访问方式：PC 浏览器和手机浏览器均可访问

因此它更适合作为毕业设计的“移动端可访问 Web 系统”进行演示；如需后续扩展为 App 或小程序，可继续复用后端接口。

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
│       ├── utils/ocr.js    # 前端 OCR 上传工具
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
- [主观题评分说明](docs/主观题评分说明.md) — 主观题评分逻辑、AI/Mock 差异说明

## 🛠 技术栈

**前端**: React 18 · Vite 5 · React Router · CSS 设计系统 · 移动端 H5 适配

**后端**: Node.js · Express · SQLite · JWT

**AI**: Google Gemini · DeepSeek · SiliconFlow · OpenAI

**OCR**: Tesseract.js

## 📄 License

MIT
