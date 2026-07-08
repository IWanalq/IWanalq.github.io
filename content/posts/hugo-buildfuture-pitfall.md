---
title: "Hugo 踩坑：--buildFuture 让当天文章"消失"了"
date: 2026-07-09
draft: false
tags: ["Hugo", "踩坑", "CI/CD", "GitHub Actions"]
categories: ["踩坑"]
summary: "Hugo 默认不构建 publishDate 为未来的文章。当天写的文章 date 设为当天时，CI 构建会静默跳过，页面 404 不报错。"
---

## 现象

写了两篇新文章，`hugo list all` 能看到它们（draft: false），但 `hugo --gc --minify` 构建后 `public/posts/` 里没有生成对应的目录。

访问页面返回 404，Hugo 构建日志没有任何错误。

## 排查过程

1. **检查 draft 状态** — 确认 `draft: false`，排除 draft 问题
2. **检查文件编码** — 怀疑 GBK/UTF-8 BOM 问题，反复转码
3. **检查 Hugo 配置** — `buildDrafts: false` 正确
4. **最后发现**：`hugo list future` 列出两篇文章

## 根因

Hugo 把 `publishDate` 晚于当前时间的文章视为 "future" 文章。默认构建命令 `hugo --gc --minify` **不会**构建 future 文章，需要显式加 `--buildFuture` 标志。

当天的文章 `date: 2026-07-09` 在构建时被认为是"未来的"，所以被静默跳过。

```bash
# 默认行为 — 跳过当天文章
hugo --gc --minify

# 修复 — 包含当天文章
hugo --gc --minify --buildFuture
```

## 修复

在 CI 工作流 `.github/workflows/hugo.yaml` 中：

```yaml
- name: Build with Hugo
  run: hugo --gc --minify --buildFuture
```

## 教训

- `hugo list future` 可以快速排查文章是否被归为 future
- `hugo list all` 默认包含 future 文章，容易误导
- 写当天文章时，CI 构建命令必须加 `--buildFuture`
- Hugo 静默跳过，不报错，只能从构建产物的 pages 数变化察觉
