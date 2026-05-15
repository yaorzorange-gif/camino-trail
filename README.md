# 旷野众生 · 部署指南

## 项目结构
```
camino-trail/
├── api/
│   ├── pilgrims.js     ← 读取所有朝圣者
│   └── checkin.js      ← 新朝圣者打卡
├── src/
│   ├── App.jsx
│   └── CaminoTrail.jsx ← 主组件
├── .env.local          ← 数据库密钥（不上传GitHub）
├── vercel.json         ← Vercel路由配置
└── .gitignore
```

## 部署步骤

### 1. 创建 Upstash 数据库（免费）
1. 去 https://console.upstash.com 注册/登录
2. 点 "Create Database"
3. 名字填 `camino-trail`，选 `Global` 区域
4. 创建后复制 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN`
5. 粘贴到 `.env.local`

### 2. 推到 GitHub
```bash
git init
git add .
git commit -m "init: 旷野众生"
git branch -M main
git remote add origin https://github.com/你的用户名/camino-trail.git
git push -u origin main
```

### 3. 部署到 Vercel
1. 去 https://vercel.com，用 GitHub 账号登录
2. 点 "Add New Project"，选 `camino-trail` 仓库
3. 在 "Environment Variables" 里填入：
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. 点 Deploy，等 1 分钟

### 4. 生成二维码
部署成功后得到类似 `camino-trail.vercel.app` 的网址
去 https://qr.io 或 https://www.qrcode-monkey.com 生成二维码
打印出来，路上给遇到的人扫！

## 更新代码
每次修改后：
```bash
git add .
git commit -m "update"
git push
```
Vercel 自动重新部署，1分钟内生效。
