#!/bin/bash

# 🎯 Quick Start - MetaBoost CI/CD Setup
# Chạy script này để setup CI/CD nhanh chóng

set -e

echo "🚀 MetaBoost CI/CD Quick Setup"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -f "deploy.sh" ]; then
    echo "❌ Error: Please run this script from the MetaBoost project directory"
    exit 1
fi

echo "📋 This script will help you setup CI/CD in 3 steps:"
echo ""
echo "Step 1: Setup SSH keys for deployment"
echo "Step 2: Show GitHub secrets configuration"
echo "Step 3: Test deployment"
echo ""

read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 STEP 1: Setup SSH Keys"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

./setup-ssh.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 STEP 2: GitHub Secrets Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ SSH keys are ready!"
echo ""
echo "Now, add the following secrets to GitHub:"
echo ""
echo "1. Open: https://github.com/khazed-dev/Metaboost/settings/secrets/actions"
echo ""
echo "2. Add VPS_SSH_KEY (already shown above)"
echo ""
echo "3. Add VPS_USER secret"
echo ""

read -p "Have you added both secrets to GitHub? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "⚠️  Please add secrets to GitHub first, then run this script again."
    echo "Or continue with Step 3 manually later."
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 STEP 3: Test Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Do you want to test manual deployment now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Starting manual deployment..."
    ./deploy.sh
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 CI/CD is now configured!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Commit and push your code:"
echo "   git add ."
echo "   git commit -m 'your message'"
echo "   git push origin main"
echo ""
echo "2. Check GitHub Actions:"
echo "   https://github.com/khazed-dev/Metaboost/actions"
echo ""
echo "3. Your website will auto-deploy! 🎊"
echo "   https://metaboost.duckdns.org"
echo ""
