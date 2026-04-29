---
name: git-commit-convention
description: |
  Git commit message generation skill. Analyzes current staged changes and outputs a well-formed commit message.
  Responsible only for generating the message text — never executes any git commands (including git commit).
  The commit action is controlled by the caller (user or git hook).
---

# Git Commit Message Generation Skill

This skill's responsibility: **analyze changes → generate a conforming commit message → output text**. It does not commit, and does not operate git.

> ⚠️ **Core constraint**: This skill must never execute any `git commit` command. After generating the message, output it directly. Committing is the caller's decision.

> ⚠️ **Output format constraint**: Output only the plain-text commit message itself. Do not include any explanation, analysis, markdown code fences (` ``` `), dividers, or other content. The output will be written directly into a git commit message file by a script — any extra content will corrupt the commit record.

---

## ⚡ Execution Flow (must follow in order)

```
Step 1: Inspect changes (git diff --cached / git status)
Step 2: Understand the functional scope of this change
Step 3: Determine whether a split is needed (if so, generate multiple messages)
Step 4: Generate a conforming message for each commit, in Chinese, and output directly
```

> ❌ There is no Step 5 — executing `git commit` is forbidden. Outputting the message is the end of this skill.

---

## 1. Commit Message Convention

### 1.1 Format

```
<type>(<scope>): <short description(Chinese)>

[optional: detailed explanation — explain "why", not "what"]

Commit-By: AI
```

- `type`: change type (required)
- `scope`: affected area, e.g. module name or file name (optional, recommended)
- `short description`: no more than 50 characters(Chinese), starts with a verb, no trailing period
- `Commit-By: AI`: **footer required**, identifies the message as AI-generated

### 1.2 Type Reference

| Type | Meaning | Example |
|------|---------|---------|
| `feat` | New feature | `feat(auth): add user login` |
| `fix` | Bug fix | `fix(payment): fix incorrect amount calculation` |
| `refactor` | Code refactor (no behavior change) | `refactor(order): split large function` |
| `chore` | Build, dependency, or tooling changes | `chore: upgrade webpack to v5` |
| `docs` | Documentation updates | `docs(api): add login endpoint description` |
| `test` | Test-related changes | `test(user): add unit tests for registration` |
| `perf` | Performance improvements | `perf(list): optimize list rendering` |
| `style` | Code formatting (no logic change) | `style: unify indentation to 2 spaces` |
| `revert` | Revert a previous commit | `revert: revert feat(auth) login feature` |

### 1.3 Forbidden Commit Messages

The following are **strictly forbidden** and must never be generated:

| ❌ Forbidden |
|-------------|
| `update` |
| `fix bug` |
| `modify` / `adjust` |
| `tmp` / `temp` |
| `wip` (unless the user explicitly requests a work-in-progress marker) |
| Empty description |
| Description unrelated to the actual change |

---

## 2. Split Rules for Multi-Scope Changes

If a change touches **multiple independent features or modules**, it must be split into multiple messages rather than merged.

### Split Decision Table

| Situation | Handling |
|-----------|----------|
| Related changes within the same feature | Merge into one message |
| Changes across different feature modules | Split into multiple messages |
| Feature code + documentation update | May be merged or split |
| Feature code + bug fix | Must split |
| New feature + refactor | Must split |

---

## 3. Output Format

The first line of each commit block must be `FILES: ` followed by space-separated relative file paths. The remaining lines are the commit message itself.
Multiple commit blocks are separated by a single line containing only `---`. Do not add any explanatory text before or after the format lines.

**Single commit:**
```
FILES: path/to/file1 path/to/file2
feat(auth): add user login

Commit-By: AI
```

**Multiple commits (when a split is required):**
```
FILES: src/auth/login.js src/auth/types.js
feat(auth): add username/password login

Commit-By: AI
---
FILES: docs/api.md
docs(api): add login endpoint documentation

Commit-By: AI
```

---

## 4. Special Scenarios

### 4.1 Hotfix
```
fix(<module>): hotfix <description>

Reason: <brief explanation of urgency>
```

### 4.2 Breaking Change
```
feat(api)!: refactor user API, remove legacy login fields

BREAKING CHANGE: removed `username` field; login now uses `email`
```

### 4.3 Linked Issue
```
fix(order): fix duplicate charge issue

Close #123
```

---

## 5. Prohibited Actions

| # | Prohibited behavior |
|---|---------------------|
| 1 | ❌ Execute any `git commit` command — committing is the caller's responsibility |
| 2 | ❌ Generate meaningless commit messages |
| 3 | ❌ Merge unrelated changes into a single message |
| 4 | ❌ Include debug code or temporary comment descriptions in the message (warn the caller to review) |
| 5 | ❌ Include sensitive information in the message (must warn when detected) |
| 6 | ❌ Omit the `Commit-By: AI` footer |
| 7 | ❌ Push to a remote repository |

---

## Pre-output Checklist

```
[ ] Ran git status / git diff --cached to inspect all changes
[ ] Understood the functional scope of this change
[ ] Determined whether a split into multiple messages is needed
[ ] Message follows the required format
[ ] Message contains no forbidden terms
[ ] No debug code or temporary comments mixed into the description
[ ] No sensitive information mixed into the description
[ ] Every message ends with Commit-By: AI
[ ] No git commit command was executed
```
