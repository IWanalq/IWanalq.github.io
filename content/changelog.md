---
title: "更新日志"
description: "基于 git commit 自动生成"
---

## 发展路线图

```text
2026-07-01  ●───  0.1.0     
2026-07-02  ●───  0.2.0     
2026-07-02  ●───  0.3.0     
2026-07-02  ●───  0.4.0     
2026-07-02  ●───  0.4.1     
2026-07-02  ●───  0.4.2     
2026-07-02  ●  0.4.3     
```

---

## 完整提交记录

### 0.1.0

- `ff6126d` 2026-07-01 — Initial commit: Hugo blog with PaperMod theme and GitHub Actions deployment `v0.1.0`

  博客初始化：
  框架：Hugo v0.157.0 + PaperMod 主题
  部署：GitHub Actions 自动构建到 Pages
  功能：SEO、代码高亮、搜索、RSS、分类标签


### 0.2.0

- `9fa0285` 2026-07-02 — 新文章: Windows 服务精简记录 `v0.2.0`

  发布首篇正式文章《Windows 服务精简》
  内容涵盖服务分类、禁用列表、脚本工具
  使用火绒替代 Defender，禁用 30+ 不必要服务
  文章采用 Page Bundle 格式，配套脚本同目录


### 0.3.0

- `6ecb981` 2026-07-02 — 重构文章为 Page Bundle 格式，脚本与文章同目录 `v0.3.0`

  文章结构重构：
  从单文件 content/posts/xxx.md 改为 Page Bundle content/posts/xxx/index.md
  资源（图片、脚本）与文章同目录，便于管理和后续迁移 OSS
  同时创建了 static/ 资源目录规范

- `964e4fd` 2026-07-02 — 新增部署方案调研笔记（草稿）

### 0.4.0

- `6535fff` 2026-07-02 — 新增 Agent 工作日志专区（日期纵深 + 多 agent 区分） `v0.4.0`

  新增工作日志专区：
  创建 content/records/ 按年/月/日归档
  每条记录包含 agent 归因、outcome 评估、lessons 反思
  支持 codebuddy/explorer 等多 agent 区分
  顶栏菜单增加「日志」入口

- `b741328` 2026-07-02 — 新增 agent 规则文件 /agents.json + 规则页面 /rules/

  建立博客规则系统：
  机器可读 agents.json，agent curl 即可了解全部规则
  人类可读 /rules/ 页面，顶栏菜单可访问
  定义 3 种内容类型（posts/records/plans）各自的前置条件和发布流程
  明确 6 个 agent 的角色分工和可操作范围

- `f3bcd31` 2026-07-02 — 新增 Inbox 临时通道 + 规划笔记 /agents.json 更新

  Inbox 临时通道上线：
  Deno 编写的 HTTP 服务（blog-inbox/inbox.ts），监听 3457 端口
  POST /inbox 免 git 暂存内容到 content/_inbox/
  POST /inbox/:id/promote 固化到 records 并自动提交 git commit
  content/_inbox/ 已加入 .gitignore 不入库


### 0.4.1

- `14aa690` 2026-07-02 — 新增更新日志板块 v0.1→v0.4 记录 `v0.4.1`

  新增更新日志页面 /changelog/
  手写 v0.1 到 v0.4 共 4 个版本的变更记录
  涵盖初始化、文章、Page Bundle、Inbox 等里程碑
  顶栏菜单增加「更新」入口


### 0.4.2

- `11bd46b` 2026-07-02 — 站点改名回顾笔记 + SEO 优化 `v0.4.2`

  站点改名+SEO优化：
  标题从 My Blog 改为「回顾笔记」
  更新 meta description/keywords/OG 标签
  添加多尺寸 favicon 和 safari-pinned-tab 配置
  agents.json 站点名同步更新


### 0.4.3

- `9403542` 2026-07-02 — 新增自动更新日志生成脚本，基于 git commit + tag `v0.4.3`

  changelog 自动生成脚本：
  scripts/generate-changelog.ts 基于 git log + tag 自动生成 content/changelog.md
  支持从 commit 正文和 git notes 提取详细变更说明
  路线图根据版本 tag 自动绘制
  推送前运行 deno run -A scripts/generate-changelog.ts 即可更新

