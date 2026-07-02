/**
 * Agent 临时通道（Inbox）服务
 *
 * 启动: deno run --allow-all inbox.ts
 * 依赖: 零（Deno 内置）
 */

import { dirname, join, basename, extname } from "https://deno.land/std@0.224.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";

const PORT = 3457;
const HOST = "127.0.0.1";
const INBOX_DIR = join(Deno.cwd(), "content", "_inbox");
const RECORDS_DIR = join(Deno.cwd(), "content", "records");
const MAX_BODY = 1_048_576; // 1MB

// ─── 工具函数 ─────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function fileName(agent: string, title: string): string {
  const date = today();
  const slug = slugify(title) || "untitled";
  const agentSlug = slugify(agent) || "unknown";
  return `${date}-${agentSlug}-${slug}.md`;
}

function parseId(pathname: string): string | null {
  const match = pathname.match(/^\/inbox\/(.+?)(\/promote|\/)?$/);
  if (!match) return null;
  const id = decodeURIComponent(match[1]);
  // 防止路径遍历
  if (id.includes("..") || id.includes("/") || id.includes("\\")) return null;
  return id;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}

function errorResponse(msg: string, status = 400): Response {
  return jsonResponse({ error: msg }, status);
}

// ─── 生成 front matter ─────────────────────────

function makeFrontMatter(data: {
  title: string;
  agent: string;
  agent_type: string;
  content: string;
  type?: string;
}): string {
  const date = today();
  const agentType = data.agent_type || "note";
  const tags = data.type === "record" ? `["agent:${data.agent}", "inbox"]` : `["inbox"]`;
  return `---
title: "${data.title.replace(/"/g, '\\"')}"
date: ${date}
agent: "${data.agent}"
agent_type: "${agentType}"
status: inbox
tags: ${tags}
---

${data.content}
`;
}

// ─── 路由处理 ─────────────────────────────────

async function handleGetInbox(): Promise<Response> {
  try {
    await ensureDir(INBOX_DIR);
    const items: Array<{
      id: string;
      title: string;
      agent: string;
      date: string;
      size: number;
      mtime: string;
    }> = [];

    for await (const entry of Deno.readDir(INBOX_DIR)) {
      if (!entry.isFile || !entry.name.endsWith(".md")) continue;
      const path = join(INBOX_DIR, entry.name);
      const stat = await Deno.stat(path);
      const content = await Deno.readTextFile(path);
      const title = content.match(/^title:\s*"(.+?)"/m)?.[1]
        || content.match(/^title:\s*(.+?)$/m)?.[1]
        || entry.name;
      const agent = content.match(/^agent:\s*"(.+?)"/m)?.[1]
        || content.match(/^agent:\s*(.+?)$/m)?.[1]
        || "unknown";

      items.push({
        id: entry.name.replace(/\.md$/, ""),
        title,
        agent,
        date: entry.name.slice(0, 10),
        size: stat.size,
        mtime: stat.mtime?.toISOString() || "",
      });
    }

    items.sort((a, b) => b.date.localeCompare(a.date) || b.mtime.localeCompare(a.mtime));
    return jsonResponse({ count: items.length, items });
  } catch (e) {
    return errorResponse(String(e), 500);
  }
}

async function handleGetInboxItem(id: string): Promise<Response> {
  const path = join(INBOX_DIR, `${id}.md`);
  try {
    const content = await Deno.readTextFile(path);
    return jsonResponse({ id, content });
  } catch {
    return errorResponse("not found", 404);
  }
}

async function handlePostInbox(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    if (!body.title || !body.content) {
      return errorResponse("title 和 content 是必填字段");
    }

    const agent = body.agent || "anonymous";
    const fname = fileName(agent, body.title);
    const filePath = join(INBOX_DIR, fname);

    await ensureDir(INBOX_DIR);
    const frontMatter = makeFrontMatter({
      title: body.title,
      agent,
      agent_type: body.agent_type || "note",
      content: body.content,
      type: body.type,
    });
    await Deno.writeTextFile(filePath, frontMatter);

    return jsonResponse({
      success: true,
      id: fname.replace(/\.md$/, ""),
      path: filePath,
      message: `已写入 _inbox/${fname}`,
    }, 201);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return errorResponse("请求体必须是有效的 JSON");
    }
    return errorResponse(String(e), 500);
  }
}

async function handlePromote(id: string, req: Request): Promise<Response> {
  const inboxPath = join(INBOX_DIR, `${id}.md`);
  try {
    // 1. 读取暂存内容
    const content = await Deno.readTextFile(inboxPath);

    // 2. 解析用户补充的 meta
    const body = await req.json().catch(() => ({}));
    const outcome = body.outcome || "completed";
    const lessons = body.lessons || [];
    const agent = body.agent || content.match(/^agent:\s*"(.+?)"/m)?.[1] || "codebuddy";
    const agentType = body.agent_type || content.match(/^agent_type:\s*"(.+?)"/m)?.[1] || "note";

    // 3. 构建记录 front matter
    const date = today();
    const [y, m] = date.split("-");
    const recordDir = join(RECORDS_DIR, y, m);
    const outName = `${id}.md`;
    const outPath = join(recordDir, outName);

    const title = content.match(/^title:\s*"(.+?)"/m)?.[1] || "Untitled";
    const rawContent = content.replace(/^---[\s\S]*?---\n*/, "").trim();

    const recordContent = `---
title: "${title}"
date: ${date}
agent: "${agent}"
agent_type: "${agentType}"
host: "${body.host || "desktop"}"
outcome: "${outcome}"
state_before: "${(body.state_before || "").replace(/"/g, '\\"')}"
state_after: "${(body.state_after || "").replace(/"/g, '\\"')}"
lessons: ${JSON.stringify(lessons)}
tags: ["agent:${agent}", "inbox"]
---

## 任务

${body.task_description || rawContent.split("\n")[0] || title}

## 过程

${rawContent}

## 反思

${lessons.map((l: string) => `- ${l}`).join("\n")}
`;

    await ensureDir(recordDir);
    await Deno.writeTextFile(outPath, recordContent);

    // 4. git add + commit
    const gitAdd = new Deno.Command("git", {
      args: ["add", outPath],
      cwd: Deno.cwd(),
    });
    const addResult = await gitAdd.output();
    if (!addResult.success) {
      return errorResponse("git add 失败: " + new TextDecoder().decode(addResult.stderr), 500);
    }

    const gitCommit = new Deno.Command("git", {
      args: ["commit", "-m", `[inbox] 固化: ${title}`],
      cwd: Deno.cwd(),
    });
    await gitCommit.output();

    // 5. 清理暂存文件
    await Deno.remove(inboxPath);

    return jsonResponse({
      success: true,
      path: outPath,
      record_url: `/records/${y}/${m}/${outName.replace(/\.md$/, "")}/`,
      message: `已固化到 records/${y}/${m}/${outName}`,
    });
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      return errorResponse("not found", 404);
    }
    return errorResponse(String(e), 500);
  }
}

async function handleDelete(id: string): Promise<Response> {
  const path = join(INBOX_DIR, `${id}.md`);
  try {
    await Deno.remove(path);
    return jsonResponse({ success: true, message: `已删除 ${id}` });
  } catch {
    return errorResponse("not found", 404);
  }
}

// ─── 主服务 ────────────────────────────────────

console.log(`
╔══════════════════════════════════════╗
║  Agent Inbox Server                 ║
║  http://${HOST}:${PORT}                  ║
║                                      ║
║  POST   /inbox          写入暂存     ║
║  GET    /inbox          列出暂存     ║
║  GET    /inbox/:id      查看单条     ║
║  POST   /inbox/:id/promote  固化     ║
║  DELETE /inbox/:id      丢弃         ║
╚══════════════════════════════════════╝
`);

Deno.serve({ hostname: HOST, port: PORT }, async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname;

  // CORS preflight
  if (method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
        "access-control-allow-headers": "content-type",
      },
    });
  }

  try {
    // GET /inbox
    if (method === "GET" && path === "/inbox") {
      return await handleGetInbox();
    }

    // GET /inbox/:id
    if (method === "GET" && path.startsWith("/inbox/")) {
      const id = parseId(path);
      if (!id) return errorResponse("invalid id");
      return await handleGetInboxItem(id);
    }

    // POST /inbox
    if (method === "POST" && path === "/inbox") {
      return await handlePostInbox(req);
    }

    // POST /inbox/:id/promote
    if (method === "POST" && /^\/inbox\/.+\/promote$/.test(path)) {
      const id = parseId(path);
      if (!id) return errorResponse("invalid id");
      return await handlePromote(id, req);
    }

    // DELETE /inbox/:id
    if (method === "DELETE" && path.startsWith("/inbox/")) {
      const id = parseId(path);
      if (!id) return errorResponse("invalid id");
      return await handleDelete(id);
    }

    // 404
    return errorResponse("not found", 404);
  } catch (e) {
    return errorResponse(String(e), 500);
  }
});
