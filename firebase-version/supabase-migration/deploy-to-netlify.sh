#!/bin/bash

# Quick Netlify Deployment Script
# This script helps you deploy your POS system to Netlify

echo "🚀 POS System - Netlify Deployment Helper"
echo "=========================================="
echo ""

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Netlify CLI not found. Installing..."
    npm install -g netlify-cli
    echo "✅ Netlify CLI installed!"
else
    echo "✅ Netlify CLI is already installed"
fi

echo ""
echo "Choose deployment method:"
echo "1. Quick Deploy (using Netlify Drop - no CLI needed)"
echo "2. Deploy via CLI (requires login)"
echo "3. Check current deployment status"
echo ""

read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📋 Quick Deploy Instructions:"
        echo "=============================="
        echo ""
        echo "1. Open: https://app.netlify.com/drop"
        echo "2. Drag and drop this folder: $(pwd)"
        echo "3. Wait 30-60 seconds"
        echo "4. You'll get a URL like: https://random-name.netlify.app"
        echo ""
        echo "✅ That's it! Your app is live!"
        echo ""
        echo "📝 Don't forget to:"
        echo "   - Add your Netlify URL to Supabase redirect URLs"
        echo "   - Test authentication on the deployed site"
        ;;
    2)
        echo ""
        echo "🔐 Logging in to Netlify..."
        netlify login
        
        echo ""
        echo "🏗️  Initializing Netlify site..."
        netlify init
        
        echo ""
        echo "🚀 Deploying to production..."
        netlify deploy --prod
        
        echo ""
        echo "✅ Deployment complete!"
        echo ""
        echo "📝 Next steps:"
        echo "   1. Add your Netlify URL to Supabase redirect URLs"
        echo "   2. Test the deployed site"
        echo "   3. Share the URL with your team"
        ;;
    3)
        echo ""
        echo "📊 Checking deployment status..."
        netlify status
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📚 For more details, see: NETLIFY_DEPLOYMENT_GUIDE.md"

