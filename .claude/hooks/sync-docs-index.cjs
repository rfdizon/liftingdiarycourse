#!/usr/bin/env node
// PostToolUse hook (Write|Edit): when a *.md file directly under /docs is
// created or modified, invoke the docs-index-updater subagent to keep
// CLAUDE.md's "Code Generation Guidelines" documentation list in sync.
"use strict";

const { spawnSync } = require("node:child_process");

let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return;
  }

  const filePath = payload?.tool_input?.file_path || "";
  const normalized = filePath.replace(/\\/g, "/");

  // Only react to *.md files directly inside a top-level /docs directory.
  if (!/(^|\/)docs\/[^/]+\.md$/i.test(normalized)) {
    return;
  }

  // The prompt is piped via stdin rather than passed as a trailing
  // positional argument: --allowedTools is a variadic flag and would
  // otherwise swallow the prompt text as an extra (bogus) tool name,
  // leaving `-p` with no prompt at all.
  const result = spawnSync(
    "claude",
    [
      "-p",
      "--agent",
      "docs-index-updater",
      "--permission-mode",
      "acceptEdits",
      "--allowedTools",
      "Read,Edit,Glob",
    ],
    {
      input: `A file was added or changed in /docs: ${filePath}. Sync CLAUDE.md's Code Generation Guidelines documentation list with the current contents of /docs.`,
      stdio: ["pipe", "ignore", "ignore"],
    }
  );

  if (result.status !== 0) {
    // Non-fatal: don't block the triggering tool call on sync failures.
    process.exitCode = 0;
  }
});
