# 三省六部 Agent 系统

> 基于 Claude Code 自迭代机制的智能 Agent 系统

## 📦 项目状态

✅ 已完成所有开发（38 个文件，9500+ 行代码）

## 🚀 使用方式

### 方式 1: SSH 访问（推荐）

```bash
# SSH 到服务器
ssh root@120.77.80.229

# 进入项目目录
cd /home/admin/.openclaw

# 查看文件
ls -la

# 运行示例
npm install
npm run example
```

### 方式 2: 打包下载

```bash
# 在服务器上打包
ssh root@120.77.80.229 "cd /home/admin && tar -czf openclaw-agent.tar.gz .openclaw/"

# 下载到本地
scp root@120.77.80.229:/home/admin/openclaw-agent.tar.gz ./

# 解压
tar -xzf openclaw-agent.tar.gz
```

### 方式 3: GitHub 仓库

如果你想要 GitHub 仓库，我可以帮你：
1. 初始化 Git 仓库
2. 推送到 GitHub
3. 你可以 clone 到本地

## 📁 项目结构

```
.openclaw/
├── agents/          # 核心 Agent 代码（38 个文件）
├── rules/           # 规则系统
├── examples.ts      # 使用示例
├── package.json     # 依赖配置
├── tsconfig.json    # TypeScript 配置
├── START-HERE.md    # 快速开始
└── README.md        # 项目说明
```

## 🎯 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置 API Key
cp .env.example .env
# 编辑 .env 设置 GLM_API_KEY

# 3. 运行示例
npm run example
```

## 📊 项目统计

- 文件数: 38
- 代码行数: 9500+
- Git 提交: 10 次
- 完成度: 100%

## 📚 文档

- [快速开始](START-HERE.md)
- [使用文档](workspace/QUICK-START.md)
- [API 文档](workspace/USAGE.md)

## 🌐 服务器信息

- IP: 120.77.80.229
- 用户: root
- 项目路径: /home/admin/.openclaw

---

**需要哪种使用方式？**
