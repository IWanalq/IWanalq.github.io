/**
 * 从 git log 自动生成更新日志
 *
 * 用法: deno run --no-config --allow-all --allow-run scripts/generate-changelog.ts
 *
 * 约定：
 *   - commit message 以 "0.0.0 " 开头 → 标记为版本发布节点
 *   - 无版本号前缀的 commit → 归入上一个版本
 *   - 每个 commit 按日期顺序排列
 */

// ─── 读取 git log ─────────────────────────

async function getGitLog(): Promise<string[]> {
  const cmd = new Deno.Command("git", {
    args: [
      "log",
      "--reverse",
      "--date=short",
      "--format=%H|%ad|%s",
      "--no-merges",
    ],
    cwd: Deno.cwd(),
  });
  const out = await cmd.output();
  if (!out.success) throw new Error("git log failed");
  return new TextDecoder().decode(out.stdout).trim().split("\n").filter(Boolean);
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

// ─── 解析提交 ─────────────────────────────

interface Commit {
  hash: string;
  date: string;
  message: string;
  version: string | null;  // 从 message 中提取的 0.0.0
  isVersionBump: boolean;
}

function parseVersion(msg: string): string | null {
  const m = msg.match(/^(\d+\.\d+\.\d+)/);
  return m ? m[1] : null;
}

function formatMessage(msg: string): string {
  // 去掉版本前缀
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

  // ── 路线图：展示所有版本节点 ──
  const versions = commits.filter(c => c.isVersionBump);
  if (versions.length > 0) {
    lines.push("```text");
    const maxLen = versions.length;
    const labelWidth = 14;
    versions.forEach((v, i) => {
      const label = `${v.version}`.padEnd(labelWidth);
      const isLast = i === maxLen - 1;
      const connector = isLast ? "●" : "●───";
      const tag = tags.get(v.hash) ? ` ← ${tags.get(v.hash)}` : "";
      lines.push(`${v.date}  ${connector}  ${label}${tag}`);
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

  for (const c of commits) {
    if (c.isVersionBump) {
      // 刷出上一个版本
      if (versionLines.length > 0) {
        lines.push(`### ${currentVersion}`);
        lines.push("");
        lines.push(...versionLines);
        lines.push("");
      }
      currentVersion = c.version!;
      versionLines = [];
    }
    const tag = tags.get(c.hash) ? ` \`${tags.get(c.hash)}\`` : "";
    versionLines.push(`- \`${c.hash}\` ${c.date} — ${formatMessage(c.message)}${tag}`);
  }

  // 刷出最后一个版本
  if (versionLines.length > 0) {
    lines.push(`### ${currentVersion}`);
    lines.push("");
    lines.push(...versionLines);
    lines.push("");
  }

  return lines.join("\n");
}

// ─── 主函数 ───────────────────────────────

async function main() {
  const rawLog = await getGitLog();
  const tags = await getGitTags();

  const commits: Commit[] = rawLog.map(line => {
    const [hash, date, ...msgParts] = line.split("|");
    const message = msgParts.join("|");
    const version = parseVersion(message);
    // 如果 commit 有 tag 但没有版本前缀，用 tag 当版本号
    const tagName = tags.get(hash.slice(0, 7));
    const effectiveVersion = version || (tagName ? tagName.replace(/^v/, "") : null);
    return {
      hash: hash.slice(0, 7),
      date,
      message,
      version: effectiveVersion,
      isVersionBump: effectiveVersion !== null,
    };
  });

  // 如果没有任何版本标记，就给第一个 commit 自动分配 0.1.0
  if (!commits.some(c => c.isVersionBump)) {
    if (commits.length > 0) {
      commits[0].version = "0.1.0";
      commits[0].isVersionBump = true;
    }
  }

  const changelog = generateChangelog(commits, tags);
  const outPath = `${Deno.cwd()}/content/changelog.md`;
  await Deno.writeTextFile(outPath, changelog);
  console.log(`✓ 更新日志已生成: content/changelog.md`);
  console.log(`  ${commits.length} commits, ${commits.filter(c => c.isVersionBump).length} versions`);
}

await main();
