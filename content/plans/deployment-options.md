---
title: "博客国内访问方案调研"
date: 2026-07-02
draft: true
tags: ["博客", "部署", "规划"]
categories: ["规划笔记"]
summary: "GitHub Pages 博客在国内无法直接访问，调研三种替代方案：Cloudflare Pages、Gitee 镜像、自定义域名 + CDN。"
---

当前博客托管在 GitHub Pages，大陆读者需要特殊网络环境才能访问。以下是三个可行方案的调研笔记。

---

## 方案 A：Cloudflare Pages

**原理**：将 GitHub 仓库连接到 Cloudflare Pages，Cloudflare 自动拉取 Hugo 构建并部署到其全球 CDN。

| 维度 | 说明 |
|------|------|
| 费用 | 免费（免费套餐足够个人博客） |
| 迁移成本 | 低，5 分钟完成 |
| 国内访问 | 部分区域直连，比 GitHub Pages 好很多 |
| 构建 | 自动从 GitHub 拉取，Hugo 构建命令：`hugo --gc --minify` |
| 自定义域名 | 支持，且自带 SSL |
| ICP 备案 | 不需要（走海外节点） |

**操作步骤**：

1. Cloudflare Dashboard → Pages → 连接 GitHub
2. 选择 `IWanalq.github.io` 仓库
3. 构建命令填 `hugo --gc --minify`，输出目录填 `public`
4. 可选：绑定自定义域名
5. 部署完成后访问 `<项目名>.pages.dev` 验证

**优点**：免费、自动部署、全球 CDN 加速、无需备案
**缺点**：国内访问速度取决于当地运营商到 Cloudflare 边缘节点的质量

---

## 方案 B：Gitee Pages 镜像

**原理**：在 Gitee（码云）上镜像 GitHub 仓库，用 Gitee Pages 服务托管。

| 维度 | 说明 |
|------|------|
| 费用 | 免费 |
| 迁移成本 | 低，但每次更新需手动同步 |
| 国内访问 | 最好，国内服务器直连 |
| 构建 | Gitee Pages 支持 Hugo |
| 自定义域名 | 支持，但需要 ICP 备案 |

**操作步骤**：

1. 在 Gitee 新建仓库 → 导入已有仓库 → 填入 `https://github.com/IWanalq/IWanalq.github.io`
2. 仓库设置 → Pages 服务 → 部署分支 `main`，目录 `/`
3. 每次 GitHub 更新后，在 Gitee 仓库点「同步」→ 重新部署 Pages

**优点**：国内访问最快、最稳定
**缺点**：需要手动同步（无法自动）、需要 ICP 备案才能绑定自定义域名

---

## 方案 C：自定义域名 + Cloudflare CDN（半代理）

**原理**：买一个域名，DNS 托管到 Cloudflare，开启 Proxy 模式，回源到 GitHub Pages。

| 维度 | 说明 |
|------|------|
| 费用 | 域名几十元/年 + Cloudflare 免费 |
| 迁移成本 | 需要买域名、改 DNS |
| 国内访问 | 配合优选 IP 技术可达可接受速度 |
| 构建 | 仍走 GitHub Actions，不变 |
| ICP 备案 | 不需要（Cloudflare 走海外节点） |

**操作步骤**：

1. 购买域名（如 `card.dev`）
2. 在 Cloudflare 添加域名 → 将 NS 记录改为 Cloudflare 的
3. DNS 记录添加 CNAME 到 `IWanalq.github.io`，开启 Proxy（橙色云朵）
4. 在 GitHub 仓库 Settings → Pages → 填入自定义域名
5. 可选：通过 Cloudflare 优选工具获取延迟最低的 IP

**优点**：保留现有 GitHub Actions 工作流不变、免费 CDN、有 SSL
**缺点**：需要额外购买域名、优选 IP 需要定期维护

---

## 综合对比

| | Cloudflare Pages | Gitee Pages | 自定义域名 + CDN |
|--|:-:|:-:|:-:|
| 费用 | 免费 | 免费 | 域名费 |
| 迁移难度 | ★☆☆ | ★★☆ | ★★★ |
| 国内访问 | ★★☆ | ★★★ | ★★☆ |
| 自动部署 | ✓ | ✗（手动同步） | ✓ |
| 自定义域名 | ✓ | ✓（需备案） | ✓ |
| 技术门槛 | 低 | 低 | 中 |

## 下一步

决定选哪个方案后，实际部署再写实操帖子更新。
