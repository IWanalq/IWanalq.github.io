---
title: "GitHub Pages 部署踩坑：环境分支策略拦住了 deploy job"
date: 2026-07-03
draft: false
tags: ["github-pages", "github-actions", "ci/cd", "debug"]
categories: ["踩坑"]
summary: "build 成功但 deploy 失败，排查发现是 github-pages 环境的自定义分支策略阻止了 main 分支的部署。"
---

## 现象

Hugo 博客走 GitHub Actions 自动部署，`build` job 一切正常：

```
Checkout        ✅
Setup Pages     ✅
Install Hugo    ✅
Build           ✅
Upload artifact ✅
```

但接下来的 `deploy` job 直接失败，`actions/deploy-pages@v4` 返回非零退出码。

## 排查

### 1. 确认 Pages 配置

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/pages
```

返回：

```json
{
  "build_type": "workflow",
  "source": { "branch": "main", "path": "/" }
}
```

Pages 确实配置为 workflow 模式，没错。

### 2. 查看环境保护规则

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/environments/github-pages
```

关键字段：

```json
{
  "protection_rules": [
    { "type": "branch_policy" }
  ],
  "deployment_branch_policy": {
    "protected_branches": false,
    "custom_branch_policies": true
  }
}
```

`custom_branch_policies: true` 意味着只有白名单里的分支才允许部署到这个环境。但白名单是**空的**——连 `main` 都没加进去。

### 3. 为什么之前成功过？

翻看历史，run #9、#10、#11 都部署成功，run #12、#13 开始失败。可能是某次 GitHub 界面操作不小心修改了环境配置，或者环境重建时默认策略变了。

## 修复

### 立即生效（绕过）

在 GitHub Actions 页面点 **Re-run all jobs**，有时重跑就能绕过这个问题。

### 根治方案

**方案 A** — 将 `main` 加入部署分支白名单：
1. 仓库 → Settings → Environments → `github-pages`
2. 在 **Deployment branches** 中添加 `main`

**方案 B** — 放开限制（如果不需要分支控制）：
```json
{
  "deployment_branch_policy": {
    "protected_branches": false,
    "custom_branch_policies": false
  }
}
```
通过 API 修改或在 UI 中取消 "Protected branches" 选项。

## 教训

> `build` 成功 ≠ 部署成功。`deploy` job 失败时，先查环境配置，别急着怀疑构建产物。

特别是 `actions/deploy-pages@v4` 这个 action，它的错误信息很简略，不会告诉你"环境策略拒绝了这次部署"，你得自己去看 `github-pages` 环境的保护规则。
