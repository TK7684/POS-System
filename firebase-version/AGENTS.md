# Agents Hand-off

This repository uses OpenSpec for spec-driven development.

- Primary specs: `openspec/specs/`
- Active changes: `openspec/changes/`

Workflow (see OpenSpec):
- Create change: ask your assistant to create an OpenSpec change (or use CLI)
- Implement: follow tasks in `changes/<name>/tasks.md`
- Archive: when done, archive the change and merge deltas into `specs/`

Notes for Cursor/AI tools:
- Keep code edits aligned with the requirements in `openspec/specs/`
- Update deltas in `openspec/changes/` when modifying behavior

Reference: https://github.com/Fission-AI/OpenSpec
