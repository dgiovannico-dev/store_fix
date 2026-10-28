# Project skills — FacilityFlow Retail

This directory intentionally holds **pointers only**, not full skill packs.

## Why nothing is copied here

Personal/global skills already cover the software lifecycle (Addy Osmani pack, Matt Pocock pack, Vercel agent-skills, LangChain/LangGraph/Deep Agents, SOLID, clean-DDD-hexagonal, TDD, review, security, etc.) under:

- `~/.cursor/skills/` — Cursor-visible skills (dirs + symlinks)
- `~/.agents/skills/` — skills CLI global copies (often symlinked into Cursor)

Duplicating large `SKILL.md` trees into the repo would drift and break updates (`npx skills update`).

## What agents must do

1. Open **`docs/product/SKILLS_MAP.md`** for phase → path → when.
2. Follow mandatory routing in **`AGENTS.md`**.
3. **Read** `~/.cursor/skills/<skill-name>/SKILL.md` (skill tool) before applying that workflow.
4. Respect always-on rules in `../rules/`.

## Optional: symlink critical skills into this folder

Not required for Cursor (personal skills are already available). If a teammate wants project-local discovery, symlink without copying:

```bash
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)/.cursor/skills"
ln -s "$HOME/.cursor/skills/using-agent-skills" using-agent-skills
ln -s "$HOME/.cursor/skills/solid" solid
ln -s "$HOME/.cursor/skills/clean-ddd-hexagonal" clean-ddd-hexagonal
ln -s "$HOME/.cursor/skills/test-driven-development" test-driven-development
ln -s "$HOME/.cursor/skills/verification-before-completion" verification-before-completion
ln -s "$HOME/.cursor/skills/security-and-hardening" security-and-hardening
# …add more as needed; never replace a working symlink with a copy
```

## Install gaps (global)

See “Install / update commands” in `docs/product/SKILLS_MAP.md`. Prefer `-g -a cursor` so all projects benefit.
