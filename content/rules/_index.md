---
title: "博客规则"
description: "Agent 操作本站的规则手册"
---

本页面定义 AI agent 操作这个博客时必须遵守的规则。

机器可读版本：[`/agents.json`](/agents.json)

---

## 内容类型

### 1. 帖子（`/posts/`）

```yaml
# 目录：content/posts/<文章名>/index.md
# 需要二次确认才能发布
front_matter:
  required: [title, date, tags, categories]
  optional: [summary, draft]
```

**约定：**
- 文件名 kebab-case 英文
- 图片用 Page Bundle 模式（与 `index.md` 同目录）
- 标签用中文
- `draft: true` 不渲染到线上

**发布流程：**
1. 创建文章、提交 git
2. **等待用户回复 `publish` 确认**
3. 确认后推送上线

---

### 2. 工作日志（`/records/`）

```yaml
# 目录：content/records/<年>/<月>/<日期>-<agent>-<主题>.md
# 无需二次确认，直接提交
front_matter:
  required: [title, date, agent, agent_type, outcome, commit,
             state_before, state_after, lessons, tags]
  optional: [host, session_id, related_posts]
```

**字段规则：**

| 字段 | 取值 |
|------|------|
| `agent` | codebuddy / explorer / investigate / qa / design / human |
| `agent_type` | coding / research / review / plan / test / design / manual |
| `outcome` | completed / partial / failed / learning |
| `lessons` | 数组，每条一条教训 |
| `commit` | 关联的 git commit hash |

**内容模板：**
每条记录至少包含四个段落：`任务` → `过程` → `关键决策` → `反思`

---

### 3. 规划笔记（`/plans/`）

```yaml
# 目录：content/plans/<主题>.md
# 用于调研阶段、未实操的内容
# draft: true 暂不发布
```

---

## Agent 角色对照

| Agent | 职责 | 可操作内容 |
|-------|------|-----------|
| codebuddy | 编码、系统优化、写文章 | posts / records / plans |
| explorer | 代码探索、方案调研 | records / plans |
| investigate | 调试、Bug 排查 | records |
| qa | 测试、质量 | records |
| design | 设计、UI/UX | records |
| human | 用户手动操作 | records |

## 推送

```bash
git -c http.proxy=http://127.0.0.1:3067 push
```

需要本地 3067 端口代理。
