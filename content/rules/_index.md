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
- **当天文章注意**：CI 构建命令已配置 `--buildFuture`，无需额外操作

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

### 部署踩坑：github-pages 环境分支策略

**现象：** `build` job 成功，`deploy` job 失败（`actions/deploy-pages@v4` 报错）。

**根因：** 仓库的 `github-pages` 环境开启了自定义部署分支策略（`custom_branch_policies: true`），但未将 `main` 加入白名单。CI 的 `deploy` job 引用了该环境：
```yaml
deploy:
  environment:
    name: github-pages
```
因此 deployment 被环境策略拒绝。

**解决：**
1. 重跑 workflow（`gh run rerun <run-id>` 或 GitHub 网页上点 Re-run）— 有时可绕过
2. 根治：在 GitHub → Settings → Environments → `github-pages` 中，将 `main` 加入部署分支白名单
3. 或改为 `protected_branches: false` + `custom_branch_policies: false` 放开限制

**识别方法：** API 查询环境配置：
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/environments/github-pages
```
如果 `deployment_branch_policy.custom_branch_policies: true` 且白名单为空，部署必然被拒。

### 部署踩坑：Hugo --buildFuture 导致当天文章 404

**现象：** 文章 `draft: false`，`hugo list all` 能识别，但构建后 `public/posts/` 没有页面，访问 404。

**根因：** Hugo 默认不构建 `publishDate` 晚于当前时间的文章。当天的文章 date 设为当天时，被归为 "future" 文章静默跳过，不报错。

**解决：** CI 构建命令已改为 `hugo --gc --minify --buildFuture`

**排查方法：** `hugo list future` 列出所有被归为 future 的文章
