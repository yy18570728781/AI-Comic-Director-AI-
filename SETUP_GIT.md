# 将 docker 目录设置为独立 Git 仓库

## 步骤说明

这个文档帮助你将 `docker` 目录从主仓库中分离出来，作为独立的 Git 仓库推送到 GitHub。

---

## 🚀 快速设置（推荐）

### 1. 进入 docker 目录

```bash
cd docker
```

### 2. 初始化为独立 Git 仓库

```bash
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: AI Comic Director Docker deployment"
```

### 3. 关联远程仓库

```bash
# 添加远程仓库
git remote add origin https://github.com/yy18570728781/AI-Comic-Director.git

# 查看远程仓库
git remote -v
```

### 4. 推送到 GitHub

```bash
# 推送到 main 分支
git branch -M main
git push -u origin main
```

---

## 📋 完整命令（复制粘贴）

```bash
# 进入 docker 目录
cd docker

# 删除可能存在的 .git 目录（如果有）
rm -rf .git

# 初始化新仓库
git init
git add .
git commit -m "Initial commit: AI Comic Director Docker deployment"

# 关联远程仓库
git remote add origin https://github.com/yy18570728781/AI-Comic-Director.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

---

## 🔄 后续更新流程

当你修改了 `docker` 目录的文件后：

```bash
cd docker
git add .
git commit -m "Update: 描述你的修改"
git push
```

---

## ✅ 验证是否成功

推送成功后，访问：
https://github.com/yy18570728781/AI-Comic-Director

你应该能看到：
- ✅ `README.md` - 完整的部署文档
- ✅ `docker-compose.yml` - Docker Compose 配置
- ✅ `images/` - 功能截图

---

## 🎯 用户使用方式

用户现在可以这样使用：

```bash
# 克隆仓库
git clone https://github.com/yy18570728781/AI-Comic-Director.git
cd AI-Comic-Director

# 一键启动
docker-compose up -d

# 访问应用
# http://localhost:3005
```

---

## ⚠️ 注意事项

1. **不要在主仓库中删除 docker 目录**
   - 主仓库的 `docker` 目录保留，用于开发
   - 独立仓库用于用户部署

2. **同步更新**
   - 当你在主仓库修改 `docker` 目录后
   - 记得也推送到独立仓库

3. **保持一致**
   - 确保两个仓库的 `docker` 目录内容一致

---

## 🔧 故障排查

### 问题 1：推送失败（仓库不存在）

确保你已经在 GitHub 创建了仓库：
https://github.com/yy18570728781/AI-Comic-Director

### 问题 2：推送失败（权限问题）

```bash
# 使用 HTTPS 方式，会提示输入用户名和密码
git remote set-url origin https://github.com/yy18570728781/AI-Comic-Director.git

# 或者使用 SSH 方式（需要配置 SSH key）
git remote set-url origin git@github.com:yy18570728781/AI-Comic-Director.git
```

### 问题 3：已经存在 .git 目录

```bash
# 删除旧的 .git 目录
rm -rf .git

# 重新初始化
git init
```

---

## 📝 推送后记得更新 README

在 `README.md` 中更新所有链接：

```markdown
# 旧链接
https://github.com/yourname/ai-comic-studio

# 新链接
https://github.com/yy18570728781/AI-Comic-Director
```
