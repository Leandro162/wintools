# WinTools — Cloudflare Pages 部署与使用说明

WinTools 是一个原创 Windows 小工具分享站，使用 Astro 构建静态页面，工具文章存放在 Markdown 文件中，并预留 Decap CMS 后台入口。

## 项目结构

```text
wintools/
├── src/
│   ├── content/
│   │   └── tools/                  # 每篇工具文章是一个 .md 文件
│   ├── components/
│   │   ├── ToolCard.astro          # 工具卡片
│   │   └── DownloadCard.astro      # 下载区域
│   ├── layouts/
│   │   └── BaseLayout.astro        # SEO、导航、页脚
│   ├── pages/
│   │   ├── index.astro             # 首页
│   │   ├── about.astro             # 关于页
│   │   ├── search.astro            # 搜索页
│   │   ├── rss.xml.js              # RSS
│   │   ├── admin/login.astro       # 后台登录页
│   │   ├── admin/editor.astro      # 图文编辑器
│   │   ├── category/index.astro    # 分类入口页
│   │   ├── category/[category].astro
│   │   └── tools/[slug].astro      # 工具详情页
│   └── styles/
│       └── global.css
├── functions/                      # Cloudflare Pages Functions
│   ├── _auth.js                    # 后台会话签名
│   ├── _middleware.js              # 保护后台路由
│   └── api/                        # 登录与图片上传接口
└── public/
    ├── admin/                      # Decap CMS 后台
    ├── images/                     # 文章截图
    ├── favicon.svg
    ├── og-default.svg
    └── _headers                    # Cloudflare Pages 响应头
```

## 本地开发

```bash
npm install
npm run dev
```

打开 `http://localhost:4321`。

## 构建

```bash
npm run build
```

构建产物在 `dist/`。

## 部署到 Cloudflare Pages

1. 在 GitHub 新建仓库，例如 `wintools`。
2. 将项目推送到 GitHub。
3. 打开 Cloudflare Dashboard，进入 **Workers & Pages**。
4. 选择 **Create application** -> **Pages** -> **Connect to Git**。
5. 选择 GitHub 仓库。
6. 构建配置填写：

```text
Framework preset: Astro
Build command: npm run build
Build output directory: dist
Root directory: /
```

7. 在 Cloudflare Pages 项目的环境变量里添加：

```text
SITE_URL=https://winstools.com
```

如果暂时还没有正式域名，可以先用 Cloudflare Pages 默认的 `*.pages.dev` 域名；绑定正式域名后再把 `SITE_URL` 改成正式域名并重新部署。

建议同时添加：

```text
ASTRO_TELEMETRY_DISABLED=1
```

## 在 Cloudflare 购买并绑定域名

1. 在 Cloudflare Registrar 购买域名。
2. 进入当前 Pages 项目。
3. 打开 **Custom domains**。
4. 添加你的根域名或子域名，例如：

```text
wintools.example.com
```

5. 按 Cloudflare 的提示完成 DNS 记录。
6. 绑定成功后，确认 `SITE_URL` 环境变量和 `astro.config.mjs` 生成的 sitemap/canonical 使用同一个正式域名。

## Decap CMS 后台

后台入口是：

```text
https://winstools.com/admin
```

上线前需要修改 `public/admin/config.yml`：

```yaml
backend:
  name: github
  repo: Leandro162/wintools
  branch: main
```

Decap CMS 的 GitHub 登录需要 OAuth 服务。Cloudflare Pages 不内置 Netlify Identity，因此可选方案是：

- 先本地写 Markdown，再通过 Git 提交发布。
- 自行部署 Decap CMS OAuth 服务。
- 使用第三方 GitHub OAuth 网关。

如果只是你一个人维护，初期最省心的方式是直接编辑 `src/content/tools/*.md`，提交到 GitHub 后让 Cloudflare Pages 自动构建。

## 写一篇工具文章

在 `src/content/tools/` 下新增 Markdown 文件，例如 `quick-launcher.md`：

```markdown
---
title: "快捷启动器 — 一键打开常用软件"
description: "自定义快捷键秒开常用程序，支持搜索和分组。"
category: "效率工具"
version: "v1.0.0"
fileSize: "约 2 MB"
compatibility: "Windows 10 / 11（64位）"
publishDate: "2026-06-03"
coverEmoji: "⚡"
featured: false
tags: ["免安装", "效率"]
downloadLinks:
  - name: "百度网盘"
    url: "https://pan.baidu.com/s/xxxxxx"
    extractCode: "abcd"
---

正文写在这里。
```

## 图文编辑器

登录入口：

```text
https://winstools.com/admin/login/
```

编辑器入口：

```text
https://winstools.com/admin/editor/
```

它适合从微信公众号、网页或其他富文本编辑器直接复制整篇图文，然后粘贴到后台继续编辑。

当前逻辑：

1. 使用后台账号和密码登录。
2. 填写文章 slug，例如 `file-renamer`。
3. 直接把图文内容粘贴到 TinyMCE 编辑器。
4. 粘贴进来的 base64 图片或剪贴板图片会在浏览器里压缩成 WebP。
5. 图片通过 Pages Function 上传到 Cloudflare R2。
6. 图片地址会替换为 `https://img.winstools.com/articles/<slug>/001.webp` 这类长期地址。
7. 编辑完成后复制最终 HTML。

远程图片 URL，例如微信公众号的 `mmbiz.qpic.cn`，第一版只会标记为“远程待处理”。后续可以接 Worker 代下载远程图片并上传到 R2。

### R2 与后台登录配置

编辑器需要以下 Cloudflare Pages 配置：

```text
R2 binding:
  Variable name: WINSTOOLS_IMAGES
  Bucket: winstools-images

Environment variables:
  ADMIN_USERNAME=你的后台账号
  ADMIN_PASSWORD=你的后台密码
  ADMIN_SESSION_SECRET=一段随机长密钥
  IMAGE_BASE_URL=https://img.winstools.com
```

这些后台登录配置只放在 Cloudflare Pages 环境变量里，不要写入 GitHub 仓库。登录成功后，Pages Function 会设置 HttpOnly 会话 Cookie；编辑器前端不会保存后台密码，也不会再要求填写发布令牌。

## Google Search Console

网站上线后建议做：

1. 打开 Google Search Console。
2. 添加你的正式域名。
3. 使用 Cloudflare DNS 验证所有权。
4. 提交 sitemap：

```text
https://winstools.com/sitemap-index.xml
```

## 注意事项

- 不要提交 `.env`、私钥、token 或下载网盘账号凭据。
- `node_modules/`、`dist/`、`.astro/` 不需要提交。
- 文章中引用的截图请放到 `public/images/`。
- 修改正式域名后，记得更新 Cloudflare Pages 的 `SITE_URL` 环境变量并重新部署。
