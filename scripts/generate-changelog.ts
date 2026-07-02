/**
 * 从 git log 自动生成更新日志
 *
 * 用法: deno run --no-config -A scripts/generate-changelog.ts
 *
 * 约定：
 *   - commit message 首行以 "X.Y.Z " 开头 → 标记为版本发布节点
 *   - 首行之后空一行写正文（4-5 行），会完整展示在 changelog 中
 *   - 无版本号前缀的 commit → 归入上一个版本
 *   - git tag (vX.Y.Z) 也作为版本标记
 */

interface Commit {
  hash: string;
  date: string;
  subject: string;
  body: string;       // 正文（首行之后的内容，不含空行前后空白）
  version: string | null;
  isVersionBump: boolean;
}

// ─── 读取 git log ─────────────────────────

async function getCommits(): Promise<Commit[]> {
  // 逐条读取，用 null 分隔，避免正文中的特殊字符干扰
  const cmd = new Deno.Command("git", {
    args: [
      "log",
      "--reverse",
      "--date=short",
      "--format=%x00%H%n%ad%n%B%N%x00",
      "--no-merges",
    ],
    cwd: Deno.cwd(),
  });
  const out = await cmd.output();
  if (!out.success) throw new Error("git log failed");

  const raw = new TextDecoder().decode(out.stdout);
  const blocks = raw.split("\x00").filter(b => b.trim().length > 0);

  const commits: Commit[] = [];
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;

    const hash = lines[0].trim();
    const date = lines[1].trim();
    const subject = lines[2].trim();
    const bodyLines = lines.slice(3).filter(l => l.trim().length > 0);
    const body = bodyLines.join("\n");

    const version = parseVersion(subject);
    const tagName = await getTagForCommit(hash);
    const effectiveVersion = version || (tagName ? tagName.replace(/^v/, "") : null);

    commits.push({
      hash: hash.slice(0, 7),
      date,
      subject,
      body,
      version: effectiveVersion,
      isVersionBump: effectiveVersion !== null,
    });
  }

  return commits;
}

async function getGitTags(): Promise<Map<string, string>> {
  const cmd = new Deno.Command("git", {
    args: ["tag", "--sort=creatordate", "--format=%(objectname)|%(refname:short)"],
    cwd: Deno.cwd(),
  });
  const out = await cmd.output();
  if (!out.success) return new Map();
  const map = new Map<string, string>();
  for (const line of new TextDecoder().decode(out.stdout).trim().split("\n").filter(Boolean)) {
    const [hash, tag] = line.split("|");
    map.set(hash.slice(0, 7), tag);
  }
  return map;
}

async function getTagForCommit(hash: string): Promise<string | null> {
  const cmd = new Deno.Command("git", {
    args: ["tag", "--points-at", hash, "--sort=creatordate"],
    cwd: Deno.cwd(),
  });
  const out = await cmd.output();
  if (!out.success) return null;
  const tags = new TextDecoder().decode(out.stdout).trim().split("\n").filter(Boolean);
  return tags.length > 0 ? tags[0] : null;
}

// ─── 解析 ─────────────────────────────────

function parseVersion(msg: string): string | null {
  const m = msg.match(/^(\d+\.\d+\.\d+)/);
  return m ? m[1] : null;
}

function stripVersion(msg: string): string {
  return msg.replace(/^\d+\.\d+\.\d+\s*/, "");
}

// ─── 生成 changelog ───────────────────────

function generateChangelog(commits: Commit[], tags: Map<string, string>): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push('title: "更新日志"');
  lines.push('description: "基于 git commit 自动生成"');
  lines.push("---");
  lines.push("");
  lines.push("## 发展路线图");
  lines.push("");

  // ── 路线图 ──
  const versions = commits.filter(c => c.isVersionBump);
  if (versions.length > 0) {
    lines.push("```text");
    versions.forEach((v, i) => {
      const isLast = i === versions.length - 1;
      const label = `${v.version}`.padEnd(10);
      const connector = isLast ? "●" : "●───";
      lines.push(`${v.date}  ${connector}  ${label}`);
    });
    lines.push("```");
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("## 完整提交记录");
  lines.push("");

  // ── 按版本分组 ──
  let currentVersion = "0.0.0";
  let versionLines: string[] = [];

  function flushVersion() {
    if (versionLines.length > 0) {
      lines.push(`### ${currentVersion}`);
      lines.push("");
      lines.push(...versionLines);
      lines.push("");
      versionLines = [];
    }
  }

  for (const c of commits) {
    if (c.isVersionBump) {
      flushVersion();
      currentVersion = c.version!;
    }

    const tagLabel = tags.get(c.hash) ? ` \`${tags.get(c.hash)}\`` : "";
    const subjectClean = stripVersion(c.subject);
    const bodyPreview = c.body
      .split("\n")
      .filter(l => l.trim().length > 0)
      .slice(0, 5)
      .map(l => `  ${l.trim()}`)
      .join("\n");

    if (bodyPreview) {
      versionLines.push(`- \`${c.hash}\` ${c.date} — ${subjectClean}${tagLabel}`);
      versionLines.push("");
      versionLines.push(bodyPreview);
      versionLines.push("");
    } else {
      versionLines.push(`- \`${c.hash}\` ${c.date} — ${subjectClean}${tagLabel}`);
    }
  }

  flushVersion();

  return lines.join("\n");
}

// ─── 主函数 ───────────────────────────────

async function main() {
  const commits = await getCommits();
  const tags = await getGitTags();

  // 如果没有任何版本标记，给第一个 commit 自动分配 0.1.0
  if (!commits.some(c => c.isVersionBump) && commits.length > 0) {
    commits[0].version = "0.1.0";
    commits[0].isVersionBump = true;
  }

  const changelog = generateChangelog(commits, tags);
  const outPath = `${Deno.cwd()}/content/changelog.md`;
  await Deno.writeTextFile(outPath, changelog);
  console.log(`✓ 更新日志已生成: content/changelog.md`);
  console.log(`  ${commits.length} commits, ${commits.filter(c => c.isVersionBump).length} versions`);
}

await main();
