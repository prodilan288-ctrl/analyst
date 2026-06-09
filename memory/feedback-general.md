---
name: feedback-general
description: How Ilan likes to work — response style, what to avoid, confirmed patterns
metadata:
  type: feedback
---

**Be direct and terse.** No preambles, no "Great question!", no summaries of what was just done. He reads the diff.

**Why:** Ilan works fast, expects fast back. Verbose responses slow him down.

**Commit messages are short and factual.** feat/fix/perf/debug prefix, one line, done.

**Always commit and push when asked.** Don't ask if he wants to commit — if he says "commit and push", just do it.

**Report findings before fixing.** When debugging, gather all data first, show him, then propose fixes. He confirmed this pattern explicitly ("Report all 4 before doing anything else").

**Don't change things not asked about.** Instructions like "Do not change anything else in the sync route" are literal. Touch only what was specified.

**File-based logging trick.** Server stdout isn't visible from the tool. When logs are needed from a running Next.js dev server, temporarily write to `/tmp/some-file.log` with `fs.writeFileSync`, read it after, then clean up (remove fs import and file writes before committing).

**Why:** Next.js dev server runs in a separate terminal; console.log output isn't accessible via Bash tool.
