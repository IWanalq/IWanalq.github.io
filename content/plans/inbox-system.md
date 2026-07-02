---
title: "Agent 临时通道（Inbox）方案"
date: 2026-07-02
draft: true
tags: ["博客", "agent", "inbox", "规划"]
categories: ["规划笔记"]
summary: "为 agent 设计一个免 git 的临时写入通道：POST/GET 接口 → 暂存区 → 审核后固化到 records 并提交 git。"
---

## 问题

当前 agent 写日志的流程：

```
写文件 → git add → git commit → git push
```

对于临时笔记、半成品想法、agent 间的消息传递来说太重了。需要一条**轻量通道**：

```
curl POST /inbox → 暂存到 _inbox/ → 审核后一键固化
```

## 设计

### 数据流

```
Agent                    Inbox Server                Git Repo
  │                          │                          │
  ├─ POST /inbox ────────────┤                          │
  │                          ├─ 写入 _inbox/             │
  │                          │  （不入 git）              │
  │                          │                          │
  ├─ GET /inbox ─────────────┤                          │
  │                          ├─ 返回列表                  │
  │                          │                          │
  ├─ GET /inbox/:id ────────┤                          │
  │                          ├─ 返回详情                  │
  │                          │                          │
  ├─ POST /inbox/:id/promote┤                          │
  │                          ├─ 移入 records/ ──────────┤
  │                          ├─ 提交 git ───────────────┤
  │                          │                          │
  ├─ DELETE /inbox/:id ─────┤                          │
     （丢弃）                  ├─ 删文件                    │
```

### 存储

```
content/_inbox/           ← 暂存区（.gitignore 已忽略）
├── 2026-07-02-codebuddy-quick-note.md
├── 2026-07-02-explorer-draft-finding.md
└── ...
```

文件格式与 records 相同（Markdown + front matter），多加一个 `status: inbox` 标记。

### API 设计

| 方法 | 路径 | 说明 | 请求体 |
|------|------|------|--------|
| POST | `/inbox` | 写入一条 | `{"title","agent","content","type"}` |
| GET | `/inbox` | 列出全部 | — |
| GET | `/inbox/:id` | 查看单条 | — |
| POST | `/inbox/:id/promote` | 固化到 records | `{"agent","outcome","lessons"}` |
| DELETE | `/inbox/:id` | 丢弃 | — |

### 前端（可选）

一条极简的 Web UI，列出 inbox 条目，支持 promote / delete 操作。

### 技术选型

| 维度 | 选择 | 原因 |
|------|------|------|
| 运行时 | **Deno** | 单文件零依赖，import from URL，TypeScript 内置 |
| HTTP | Deno 内置 `Deno.serve` | 标准库，够用 |
| 端口 | `3456` | 不占常见端口，不容易冲突 |
| 启动方式 | 手动 `deno run --allow-all inbox.ts` | 简单直接 |

### 依赖管理

零 npm install。Deno 从 URL 直接导入：

```typescript
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
// 或直接用 Deno.serve (2.x 内置)
```

### 安全

| 风险 | 措施 |
|------|------|
| 路径遍历 | 校验 filename，拒绝 `../` |
| 任意文件写入 | 限定目录到 `content/_inbox/` |
| 端口暴露 | 只绑定 `127.0.0.1`，不暴露到局域网 |
| 大文件 DoS | 限制 Body 大小为 1MB |

### Agent 发现

更新 `agents.json`，加入 inbox 端点信息：

```json
"inbox": {
  "endpoint": "http://localhost:3456",
  "description": "临时通道，免 git 提交",
  "endpoints": [
    "POST /inbox                  写入一条暂存记录",
    "GET  /inbox                  列出所有暂存",
    "GET  /inbox/{id}             查看单条详情",
    "POST /inbox/{id}/promote     固化到 records 并提交 git",
    "DELETE /inbox/{id}           丢弃暂存"
  ]
}
```

### 与现有系统的关系

```
git 工作流 ←── promote ──→ Inbox 暂存区
   │                            │
   │                         POST /inbox
   │                            │
   v                            v
records/ 目录              agent 临时输出
（永久、版本化）            （临时、可丢弃）
```

两条通道互补：正式任务走 git，随手记走 inbox。

## 待实现

- [x] 需求分析
- [x] 架构设计
- [x] API 设计
- [ ] 实现 inbox.ts 服务
- [ ] 更新 agents.json 加入端点
- [ ] 更新 .gitignore
- [ ] 测试：写一条 → 查看 → 固化 → 验证 git 提交
