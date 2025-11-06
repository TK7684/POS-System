# POS System - Cloudflare Migration

This is the Cloudflare Pages migration of the POS (Point of Sale) system, originally built with Firebase and migrated to Supabase.

## Features

- Real-time inventory management
- Sales and purchase tracking
- Expense management
- LINE Bot integration
- AI Assistant for expense parsing
- Google Sheets integration

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Deployment**: Cloudflare Pages
- **Functions**: Cloudflare Workers (in `functions/` folder)

## OpenSpec

This project uses [OpenSpec](https://github.com/Fission-AI/OpenSpec) for spec-driven development.

### Quick Start

```bash
# Initialize OpenSpec (if not already done)
openspec init

# View active changes
openspec list

# Show change details
openspec show <change-name>

# Archive completed change
openspec archive <change-name> --yes
```

## Deployment

This project is configured for Cloudflare Pages deployment. It automatically deploys on push to the main branch.

### Environment Variables

Set these in Cloudflare Dashboard → Pages → Settings → Environment Variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `HUGGING_FACE_API_KEY`
- `GOOGLE_CLOUD_API_KEY`

## Project Structure

```
CloudFlare-Migration/
├── functions/          # Cloudflare Workers functions
├── config/             # Configuration files
├── openspec/           # OpenSpec specifications
│   ├── specs/          # Current specifications
│   ├── changes/        # Active change proposals
│   └── archive/        # Archived changes
├── index.html          # Main application
├── pos-app.js          # Main JavaScript
├── supabase-config.js  # Supabase configuration
└── wrangler.toml       # Cloudflare Workers config
```

## Documentation

- See `CLOUDFLARE_MIGRATION_STEPS.md` for detailed migration steps
- See `QUICK_CLOUDFLARE_SETUP.md` for quick setup guide

