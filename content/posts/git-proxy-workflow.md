---
title: "Git 代理推送工作流：绕过封锁的几种姿势"
date: 2026-07-03
draft: false
tags: ["git", "proxy", "workflow", "github"]
categories: ["工具"]
summary: "网络环境不允许直连 GitHub 时，如何用反代站 safely 完成 git push，以及凭据管理的关键注意事项。"
---

## 背景

推送 Hugo 博客到 GitHub Pages 时发现 `github.com:443` 直连不通。本机有本地代理（比如 3067 端口），但 git 默认不走系统代理，需要额外配置。

## 方案对比

### 方案 A：本地代理端口

如果有本地代理（Clash/v2ray/Tun），直接配给 git：

```bash
# HTTP 代理
git config --global http.proxy http://127.0.0.1:3067

# 或 SOCKS5 代理
git config --global http.proxy socks5://127.0.0.1:3067
```

**优点**：token 只在本机和 GitHub 之间传递，没有中间人。
**缺点**：依赖本地代理进程持续运行。

### 方案 B：公网 GitHub 反代站

通过第三方反代站转发请求，比如 `gh-proxy.com`、`likeyou.it.eu.org` 等。

利用 git 的 `insteadof` 机制，自动将 `github.com` 的 URL 重写到反代站：

```bash
git config --global url.https://likeyou.it.eu.org/https://github.com/.insteadof https://github.com/
```

`insteadof` 是 git 内置的 URL 重写规则。设置后所有原本指向 `https://github.com/...` 的 remote URL 都会被自动替换为 `https://likeyou.it.eu.org/https://github.com/...`，对用户透明。

**优点**：不依赖本地代理进程，配置一次永久生效。
**缺点**：反代站能看到你的 token（见下文注意事项）。

## 凭据管理

### git-credentials 文件

git 的凭据默认存储在 `~/.git-credentials`（Linux/macOS）或 `%USERPROFILE%\.git-credentials`（Windows），每行一个 URL + 凭证：

```
https://user:token@github.com
https://user:token@likeyou.it.eu.org
```

使用 `git config --global credential.helper store` 启用。凭证按**域名**匹配，反代站用的是 `likeyou.it.eu.org` 域名，所以必须额外存一条给这个域名的凭证，git 才知道往那发 token。

查看当前凭据：

```bash
cat ~/.git-credentials
```

删除某一行：

```bash
grep -v "某个域名" ~/.git-credentials > /tmp/creds.tmp && mv /tmp/creds.tmp ~/.git-credentials
```

## 关键风险

### Token 对反代站可见

反代站作为中间人，TLS 在其服务器终止，因此**反代站可以读取请求头中携带的 token**。即使走 HTTPS，端到端加密也只到你到反代站这一段，反代站到 GitHub 是另一段独立的 TLS 连接。

如果信任反代站，这是可接受的。如果不信任，优先用方案 A（本地代理）。

### 一旦泄露立即吊销

如果怀疑 token 已泄露，立即到 GitHub Settings → Developer settings → Personal access tokens 吊销并重新生成。

## 实际操作示例

以下是通过 `likeyou.it.eu.org` 推送博客的完整流程：

```bash
# 1. 设置 insteadof 规则（一次配置永久生效）
git config --global url.https://likeyou.it.eu.org/https://github.com/.insteadof https://github.com/

# 2. 把凭证加入凭据存储
#    注意：不要往代码或博客里写入原始 token，用变量代替
echo "https://user:${GITHUB_TOKEN}@likeyou.it.eu.org" >> ~/.git-credentials

# 3. 推送到 GitHub（自动走反代）
git push

# 4. 验证 remote URL 已被重写
git remote -v
# 输出应为：
#   origin  https://likeyou.it.eu.org/https://github.com/user/repo.git
```

## remote URL 的坑

之前踩过一个坑：remote URL 里如果嵌着 token（`https://user:token@github.com/...`），`insteadof` 规则匹配不到，因为 URL 前缀是 `https://user:token@github.com/` 而不是 `https://github.com/`。

解决方法：remote URL 保持干净的 `https://github.com/user/repo.git`，让 `insteadof` 规则统一重写，凭证交给 `credential.helper` 管理。
