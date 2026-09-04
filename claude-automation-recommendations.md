# Claude Code Automation Recommendations

## Codebase Profile
- **Type**: React 19 + Vite frontend / Python FastAPI backend
- **Key Libraries**: shadcn/ui, Tailwind CSS, react-markdown, Pillow, python-jose (JWT)
- **Testing**: Not detected
- **CI/CD**: Not detected

---

## 🔌 MCP Servers

### context7
**Why**: Uses React, shadcn/ui, Tailwind CSS, FastAPI, and Pillow — context7 provides live documentation lookup so Claude can reference up-to-date API docs without web search.
**Install**: `claude mcp add context7`

### GitHub
**Why**: Project is on GitHub with `gh` CLI available. Lets Claude create issues, review PRs, and check workflows directly.
**Install**: Comes built-in with `gh` CLI — no separate install needed.

---

## 🎯 Skills

### new-page (Custom)
**Why**: All pages follow a consistent pattern (dark theme `bg-neutral-950`, purple/blue backdrop glow, frosted glass card `bg-white/5 backdrop-blur-3xl border border-white/15`, navigation via `useNavigate`). A skill with templates makes adding new pages instant.
**Create**: `.claude/skills/new-page/SKILL.md`
**Invocation**: User-only (`/new-page`)
```yaml
---
name: new-page
description: Create a new page component following the site's dark theme conventions
---
```

### gen-blog (Custom)
**Why**: Blog posts live in `Blogs/<title>/<file>.md` with Markdown supporting GFM, math (KaTeX), and code highlighting. A skill can scaffold new blog folders with frontmatter and placeholders.
**Create**: `.claude/skills/gen-blog/SKILL.md`
**Invocation**: User-only (`/gen-blog`)

---

## ⚡ Hooks

### PostToolUse: auto-lint
**Why**: ESLint is already configured with flat config (`eslint.config.js`) and react-hooks/react-refresh plugins.
**Where**: `.claude/settings.local.json`
```json
{
  "hooks": {
    "PostToolUse": "cd frontend && npx eslint --fix src/"
  }
}
```

### PreToolUse: confirm before editing auth.py
**Why**: `backend/auth.py` contains the JWT `SECRET_KEY` and hardcoded credentials. Accidental edits could break auth or expose secrets.
**Where**: `.claude/settings.local.json`
```json
{
  "hooks": {
    "PreToolUse": "if echo \"$@\" | grep -q 'backend/auth.py'; then echo '⚠️  Editing auth.py — confirm?'; fi"
  }
}
```

---

## 🤖 Subagents

### ui-reviewer
**Why**: Frontend has custom dark theme styling with specific patterns (backdrop blur, border glow, gradient accents). A reviewer can catch visual inconsistencies and CSS regressions.
**Create**: `.claude/agents/ui-reviewer.md`

### security-reviewer
**Why**: Auth is handled with hardcoded credentials and JWT — important to audit auth flows, token handling, and API protection before changes to those areas.
**Create**: `.claude/agents/security-reviewer.md`

---

## 🔌 Plugins

Already have **frontend-design** (claude-plugins-official) installed — the right pick for React component work.

Consider **hookify** (claude-plugins-official) for a more convenient way to manage hooks from within Claude.

---

**Want more?** Ask for additional recommendations in any specific category (e.g., "show me more MCP options" or "what hooks would help with image processing?").
