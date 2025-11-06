# OpenSpec Agent Instructions

This project uses OpenSpec for spec-driven development with AI coding assistants.

## Quick Commands

- `/openspec:proposal <description>` - Create a new change proposal
- `/openspec:apply <change-name>` - Implement a change
- `/openspec:archive <change-name>` - Archive a completed change

## Project Context

This is a POS (Point of Sale) system migrated from Firebase to Supabase, deployed on Cloudflare Pages.

## Tech Stack

- Frontend: Vanilla JavaScript, HTML, Tailwind CSS
- Backend: Supabase (PostgreSQL)
- Deployment: Cloudflare Pages
- Functions: Cloudflare Workers (Functions folder)

## OpenSpec Workflow

1. Create a proposal: Ask AI to create an OpenSpec change proposal
2. Review specs: Use `openspec show <change>` to review
3. Implement: Ask AI to apply the change
4. Archive: Archive when complete

For more information, visit: https://openspec.dev

