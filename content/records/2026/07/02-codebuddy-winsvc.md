---
title: "Windows 服务精简"
date: 2026-07-02
agent: "codebuddy"
agent_type: "coding"
host: "desktop"
session_id: "sess_20260702_winsvc"
commit: "6ecb981"
outcome: "completed"
state_before: >
  系统有大量不必要的 Windows 服务在运行（Defender、更新、遥测、Xbox 等），占用后台资源。
  GitHub HTTPS 端口被封锁，需要通过代理推送。
state_after: >
  已禁用 30+ 服务并写入脚本，文章发布到博客，资源改用 Page Bundle 结构管理。
related_posts:
  - "/posts/windows-services-optimization/"
lessons:
  - "火绒代替 Defender 后，必须手动关掉 Windows 安全中心（wscsvc），否则两者冲突"
  - "gh-proxy.com 不支持 git 协议（返回 403），用本地代理才推送成功"
  - "Page Bundle 比全局 static 目录更干净，文章与资源耦合便于后续迁移 OSS"
  - "浏览器 DoH 会绕过系统 hosts 文件，Debug 时应该先排查这个"
tags:
  - "windows"
  - "服务优化"
  - "agent:codebuddy"
---

## 任务

用户希望禁用不必要的 Windows 服务，优化后台开销。使用场景：大陆个人用户，火绒代替 Defender，日常只用微信和浏览器。

## 过程

1. **诊断阶段** — 列出所有服务，分类判断哪些可禁用
2. **执行阶段** — 生成优化脚本，以管理员身份运行
3. **验证阶段** — 确认无功能缺失，火绒和 ASUS 正常运行

## 关键决策

| 决策 | 选项 | 选择 | 原因 |
|------|------|------|------|
| 服务优化方式 | 手动 vs 脚本 | 脚本 | 可复现、可备份、可嵌入博客 |
| 资源管理 | 全局 static 目录 vs Page Bundle | Page Bundle | 文章与资源耦合，迁移 OSS 只需改路径前缀 |
| 属性分类 | posts vs plans | posts | 有实操、有产出，算正式文章 |

## 反思

- 一开始在 hosts 文件和 DNS 上花了太多时间，没有先确认 GitHub 的 HTTPS 端口是否可达
- 如果先问用户"有没有本地代理"，能省掉一半排查时间
- 服务禁用后应该重启确认效果，目前只在运行时验证了

## 回滚锚点

| 提交 | 说明 |
|------|------|
| `6ecb981` | 重构文章为 Page Bundle 格式，脚本与文章同目录 |
| `964e4fd` | 新增部署方案调研笔记 |
