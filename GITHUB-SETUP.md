# GitHub 设置指南

## 第一步：在 GitHub 上创建仓库

### 选项 A：使用 GitHub CLI（推荐）

如果你安装了 GitHub CLI (`gh`)，我可以直接帮你创建：

```bash
# 安装 GitHub CLI（如果没有）
# Ubuntu/Debian: sudo apt install gh
# macOS: brew install gh

# 登录 GitHub
gh auth login

# 创建仓库
gh repo create three-provinces-six-ministries --public --description "三省六部 Agent 系统 - 基于 Claude Code 自迭代机制"
```

### 选项 B：手动创建（更简单）

1. 访问 https://github.com/new
2. 填写信息：
   - Repository name: `three-provinces-six-ministries`
   - Description: `三省六部 Agent 系统 - 基于 Claude Code 自迭代机制`
   - Public 或 Private（你选择）
   - **不要勾选** "Add a README file"
   - **不要勾选** "Add .gitignore"
   - **不要勾选** "Choose a license"
3. 点击 "Create repository"

## 第二步：推送代码

创建仓库后，GitHub 会显示推送命令。我帮你准备好了：

```bash
cd /home/admin/.openclaw

# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/three-provinces-six-ministries.git

# 推送代码
git branch -M main
git push -u origin main
```

## 第三步：Clone 到本地

推送成功后，你可以在任何电脑上 clone：

```bash
git clone https://github.com/YOUR_USERNAME/three-provinces-six-ministries.git
cd three-provinces-six-ministries
npm install
npm run example
```

---

## 你想用哪种方式？

**选项 A**: 你有 GitHub CLI，我可以帮你自动创建
**选项 B**: 你手动创建，告诉我仓库地址，我帮你推送

告诉我你的 GitHub 用户名和选择的方式！
