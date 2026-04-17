# AI 漫剧工作台 | AI 短剧生成 | 小说转视频 | 开源漫剧制作工具

> 🎬 **从小说到短剧，一站式 AI 漫剧创作平台** | 支持文本生成、分镜设计、图像生成、视频制作全流程

[![Docker Pulls](https://img.shields.io/docker/pulls/paopaoyuy/ai-comic-web)](https://hub.docker.com/r/paopaoyuy/ai-comic-web)
[![GitHub Stars](https://img.shields.io/github/stars/yy18570728781/AI-Comic-Director)](https://github.com/yy18570728781/AI-Comic-Director)
[![License](https://img.shields.io/badge/license-CC%20BY--NC--SA%204.0-blue)](LICENSE)

---

## 🎯 为什么选择 AI 漫剧工作台？

### 传统漫剧制作的痛点

❌ **人工成本高** - 编剧、分镜师、画师、剪辑师，团队成本动辄数万
❌ **制作周期长** - 一集 3 分钟短剧，传统流程需要 1-2 周
❌ **技术门槛高** - 需要掌握 Photoshop、Premiere、After Effects 等专业软件
❌ **素材难获取** - 角色一致性难保证，场景素材需要大量采购

### AI 漫剧工作台的解决方案

✅ **AI 全流程自动化** - 从小说到视频，AI 自动完成 80% 工作
✅ **10 分钟出片** - 输入小说大纲，10 分钟生成完整分镜视频
✅ **零技术门槛** - 网页操作，无需专业软件，小白也能用
✅ **角色一致性保证** - AI 角色库，确保同一角色在不同镜头中保持一致
✅ **成本降低 90%** - 无需雇佣团队，按需使用 AI 服务

---

## 🚀 30 秒快速体验

### 方式一：Docker Compose 一键部署（推荐）

```bash
# 1. 下载配置文件
curl -O https://raw.githubusercontent.com/yy18570728781/AI-Comic-Director/main/docker-compose.yml

# 2. 一键启动（自动拉取镜像）
docker-compose up -d

# 3. 访问应用
# http://localhost:3005
```

> 💡 首次启动会自动拉取镜像，请耐心等待

### 方式二：克隆仓库部署

```bash
# 1. 克隆项目
git clone https://github.com/yy18570728781/AI-Comic-Director.git
cd AI-Comic-Director

# 2. 启动服务
docker-compose up -d

# 3. 访问应用
# http://localhost:3005
```

### 方式三：Docker Run（快速测试）

```bash
docker run -d -p 3005:80 --name ai-comic-web paopaoyuy/ai-comic-web:latest
```

---

## 🎬 功能演示

### 1️⃣ 小说生成 → 剧本转换

AI 自动将小说转换为结构化剧本，智能提取角色、场景、对话

![小说生成 → 剧本转换](./images/1小说生成%20→%20剧本转换.jpg)

![小说生成 → 剧本转换2](./images/1小说生成%20→%20剧本转换2.jpg)

### 2️⃣ 剧本管理

剧本列表管理，支持新建 编辑 删除，一键转换为分镜脚本

![剧本管理](./images/2剧本管理.jpg)

### 3️⃣ 智能分镜设计

AI 自动拆分剧本为分镜脚本，生成镜头号、画面描述、提示词, 一键绑定角色

![智能分镜设计](./images/3智能分镜设计.jpg)

### 4️⃣ 角色场景生成

AI 生成一致性角色形象和场景背景，保存到资源库

![角色场景生成](./images/4角色场景生成.jpg)

### 5️⃣ 首页概览

一站式 AI 漫剧创作平台，从小说到视频的全流程工具

![首页](./images/首页.jpg)

### 6️⃣ 创作工作台

智能分镜设计，AI 自动拆分剧本为分镜脚本

![创作工作台](./images/seedance2创作工作台.jpg)

### 7️⃣ 图生图功能

AI 图像生成，支持文生图、图生图、图像融合

![图生图](./images/图生图.jpg)

### 8️⃣ 图生视频功能

批量生成视频，自动合成完整短剧

![图生视频](./images/图生视频.jpg)

---

## ✨ 核心功能

### 📝 AI 内容创作

- ✅ **小说生成** - 根据主题/大纲生成完整小说
- ✅ **剧本转换** - 小说自动转换为结构化剧本
- ✅ **分镜脚本** - AI 自动生成详细分镜（镜头号、画面描述、提示词）
- ✅ **提示词优化** - 智能优化图像和视频生成提示词

### 🎨 AI 视觉生成

- ✅ **角色生成** - AI 生成一致性角色形象
- ✅ **场景生成** - AI 生成场景背景
- ✅ **图像生成** - 支持文生图、图生图、图像融合
- ✅ **视频生成** - 支持图生视频、文生视频

### 🎞️ 智能制作工具

- ✅ **角色库管理** - 保存角色 ID，确保人物一致性
- ✅ **资源库管理** - 永久保存生成的图像和视频
- ✅ **批量生成** - 一键批量生成所有分镜
- ✅ **实时预览** - 实时查看生成进度和结果

### 🤖 支持的 AI 模型

- **文本生成** - DeepSeek、OpenAI GPT、豆包
- **图像生成** - Stable Diffusion、DALL-E、Midjourney
- **视频生成** - Sora、Vidu、Runway、Luma

---

## 🎯 适用场景

### 📱 短视频创作者

- 快速生成短剧内容，日更不是梦
- 降低制作成本，提高产出效率
- 适合抖音、快手、视频号等平台

### 📚 网文作者

- 将小说改编为漫剧，扩大影响力
- 多渠道变现，增加收入来源
- 吸引更多读者关注

### 🎬 MCN 机构

- 批量生产短剧内容
- 降低人力成本
- 提高内容产出效率

### 🏢 企业营销

- 快速制作产品宣传短剧
- 降低营销成本
- 提高传播效果

---

## 💰 使用成本

### 免费试用

- ✅ 完整功能体验
- ✅ 无需科学上网

## 🔧 部署指南

### 系统要求

- Docker 20.10+
- 2GB 可用内存
- 1GB 可用磁盘空间

### 快速部署

#### 方式 1：Docker Run（最简单）

适合快速体验，一条命令启动：

```bash
docker pull paopaoyuy/ai-comic-web:latest
docker run -d -p 3005:80 --name ai-comic-web paopaoyuy/ai-comic-web:latest
```

访问：`http://localhost:3005`

#### 方式 2：Docker Compose（推荐）

适合生产环境，支持自动重启和健康检查：

```bash
# 下载配置文件
curl -O https://raw.githubusercontent.com/yourname/ai-comic-studio/main/docker/docker-compose.yml

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

访问：`http://localhost:3005`

#### 方式 3：从源码构建（开发者）

适合需要自定义或二次开发的场景：

```bash
# 1. 克隆仓库
git clone https://github.com/yourname/ai-comic-studio.git
cd ai-comic-studio/web

# 2. 构建镜像
docker build -t ai-comic-web:local .

# 3. 运行容器
docker run -d -p 3005:80 --name ai-comic-web ai-comic-web:local
```

访问：`http://localhost:3005`

### 常用命令

```bash
# 查看运行状态
docker ps

# 查看日志
docker logs -f ai-comic-web

# 停止容器
docker stop ai-comic-web

# 启动容器
docker start ai-comic-web

# 删除容器
docker rm -f ai-comic-web

# 更新到最新版本
docker pull paopaoyuy/ai-comic-web:latest
docker stop ai-comic-web
docker rm ai-comic-web
docker run -d -p 3005:80 --name ai-comic-web paopaoyuy/ai-comic-web:latest
```

### 端口配置

默认端口是 `3005`，如果需要修改，可以更改映射端口：

```bash
# 使用 8080 端口
docker run -d -p 8080:80 --name ai-comic-web paopaoyuy/ai-comic-web:latest
```

### 故障排查

#### 问题 1：端口被占用

```bash
# 查看端口占用
netstat -ano | findstr :3005  # Windows
lsof -i :3005                 # Linux/Mac

# 使用其他端口
docker run -d -p 8080:80 --name ai-comic-web paopaoyuy/ai-comic-web:latest
```

#### 问题 2：无法访问

```bash
# 检查容器是否运行
docker ps

# 查看容器日志
docker logs ai-comic-web

# 检查防火墙设置
# Windows: 控制面板 -> 防火墙 -> 允许应用通过防火墙
# Linux: sudo ufw allow 3005
```

#### 问题 3：API 请求失败

前端会自动连接到我们的后端服务 `https://mj.server.yjaippt.top`，请确保：
- 网络连接正常
- 没有代理或防火墙拦截

### 访问应用

部署成功后，打开浏览器访问：`http://localhost:3005`

---

## 📖 使用教程

### 第一步：创建项目

1. 点击"新建项目"
2. 输入项目名称和描述
3. 选择项目类型（小说、剧本、分镜）

### 第二步：生成内容

1. 输入小说主题或大纲
2. AI 自动生成完整小说
3. 一键转换为剧本和分镜

### 第三步：生成素材

1. AI 自动提取角色和场景
2. 批量生成角色形象和场景背景
3. 保存到资源库

### 第四步：生成视频

1. 为每个分镜添加参考图
2. 批量生成视频
3. 下载或在线预览

---

## 🤝 商业合作

### 个人使用（免费）

- ✅ 学习、研究、个人创作
- ✅ 非商业用途
- ✅ 遵守 CC BY-NC-SA 4.0 协议

### 商业使用（付费）

- 💼 **商业授权** - 联系作者，包含完整源码
- 💼 **企业定制** - 定制开发、私有化部署
- 💼 **技术支持** - 7x24 小时技术支持

### 联系方式

- 📧 **邮箱** - yy18570728781@163.com
- 💬 **微信** - yy18570728781
- 🔗 **官网** - http://paopaomj.yjaippt.top

---

## 🌟 为什么选择我们的 API 服务？

### 价格优势

- 💰 **比官方便宜 50%** - 我们提供批发价格
- 💰 **无隐藏费用** - 透明计费，按量付费
- 💰 **新用户优惠** - 注册送 ¥50 体验金

### 服务优势

- ⚡ **速度快** - 国内服务器，响应速度提升 3 倍
- 🔒 **更稳定** - 99.9% 可用性保证
- 🛡️ **更安全** - 数据加密传输，隐私保护

### 模型优势

- 🤖 **模型全** - 支持 20+ 主流 AI 模型
- 🔄 **自动切换** - 模型故障自动切换备用
- 📊 **实时监控** - 实时查看生成进度和状态

---

## 📊 用户案例

### 案例 1：短视频创作者

> "使用 AI 漫剧工作台后，我的日更从 1 条提升到 5 条，粉丝增长了 300%！" - @抖音创作者小王

### 案例 2：网文作者

> "我的小说改编成漫剧后，阅读量翻了 10 倍，还多了一份收入来源。" - @起点作者小李

### 案例 3：MCN 机构

> "团队从 10 人缩减到 3 人，成本降低 70%，产出效率提升 5 倍。" - @某 MCN 机构负责人

---

## 🔗 相关链接

- 🏠 [项目主页](https://github.com/yy18570728781/AI-Comic-Director)
- 📦 [Docker Hub](https://hub.docker.com/r/paopaoyuy/ai-comic-web)
- 📖 [使用文档](https://github.com/yy18570728781/AI-Comic-Director#readme)
- 💬 [问题反馈](https://github.com/yy18570728781/AI-Comic-Director/issues)
- 🌐 [官方网站](http://paopaomj.yjaippt.top)

---

## 🎁 限时优惠

### 新用户福利

- 🎉 **注册送 ¥50** - 立即注册，免费体验
- 🎉 **首月 5 折** - 首月套餐享受 5 折优惠
- 🎉 **推荐有奖** - 推荐好友注册，双方各得 ¥20

### 活动时间

即日起至 2026 年 5 月 31 日

---

## 📄 开源协议

本项目采用 **CC BY-NC-SA 4.0** 协议：

- ✅ **允许** - 学习、研究、个人创作
- ✅ **允许** - 修改、分发（需署名）
- ❌ **禁止** - 商业使用（需购买授权）
- ❌ **禁止** - 闭源分发

商业使用请联系我们获取授权。

---

## 🙏 致谢

感谢以下开源项目：

- [React](https://reactjs.org/)
- [Ant Design](https://ant.design/)
- [Midway.js](https://midwayjs.org/)
- [Docker](https://www.docker.com/)

---

## 📞 联系我们

### 技术支持

- 📧 **邮箱** - yy18570728781@163.com
- 💬 **微信** - wslyy3399

### 商务合作

- 📧 **邮箱** - yy18570728781@163.com
- 📞 **电话** - 18570728781

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！⭐**

[立即体验](http://localhost:3005) | [查看文档](https://github.com/yy18570728781/AI-Comic-Director#readme) | [联系我们](mailto:yy18570728781@163.com)

</div>

---

## 🔍 SEO 关键词

AI 漫剧 | AI 短剧生成 | 小说转视频 | 漫剧制作工具 | AI 视频生成 | 短剧创作 | 文生视频 | 图生视频 | AI 导演 | 自动分镜 | 角色一致性 | 场景生成 | 批量生成 | 短视频制作 | 抖音短剧 | 快手短剧 | 视频号短剧 | MCN 工具 | 网文改编 | AI 创作工具

---

<div align="center">
<sub>Built with ❤️ by AI Comic Studio Team</sub>
</div>
