#!/bin/bash

# 🔑 SSH Key Setup for CI/CD
# Run this script to setup SSH keys for GitHub Actions

set -e

echo "🔑 SSH Key Setup for MetaBoost CI/CD"
echo "======================================"

KEY_PATH="$HOME/.ssh/metaboost_deploy"
VPS_IP="103.110.33.94"

# Check if key already exists
if [ -f "$KEY_PATH" ]; then
    echo "⚠️  SSH key already exists at $KEY_PATH"
    read -p "Do you want to create a new key? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Using existing key..."
    else
        echo "Creating new key..."
        ssh-keygen -t ed25519 -C "metaboost-deploy" -f "$KEY_PATH" -N ""
    fi
else
    echo "📝 Creating new SSH key..."
    ssh-keygen -t ed25519 -C "metaboost-deploy" -f "$KEY_PATH" -N ""
fi

# Get VPS username
read -p "Enter VPS username (default: root): " VPS_USER
VPS_USER=${VPS_USER:-root}

# Copy key to VPS
echo ""
echo "📤 Copying SSH key to VPS..."
echo "You will need to enter VPS password..."
ssh-copy-id -i "${KEY_PATH}.pub" ${VPS_USER}@${VPS_IP}

# Test connection
echo ""
echo "🧪 Testing SSH connection..."
if ssh -i "$KEY_PATH" -o ConnectTimeout=5 ${VPS_USER}@${VPS_IP} "echo 'Connection successful!'" 2>/dev/null; then
    echo "✅ SSH connection working!"
else
    echo "❌ SSH connection failed!"
    exit 1
fi

# Show GitHub Secrets instructions
echo ""
echo "✅ SSH Key Setup Complete!"
echo ""
echo "📋 GitHub Secrets Setup:"
echo "========================"
echo ""
echo "1. Go to your GitHub repository:"
echo "   https://github.com/khazed-dev/Metaboost/settings/secrets/actions"
echo ""
echo "2. Click 'New repository secret' and add:"
echo ""
echo "   Name: VPS_SSH_KEY"
echo "   Value: (copy the private key below)"
echo ""
echo "───────────────────────────────────────"
cat "$KEY_PATH"
echo "───────────────────────────────────────"
echo ""
echo "3. Add another secret:"
echo "   Name: VPS_USER"
echo "   Value: $VPS_USER"
echo ""
echo "🎉 After adding secrets, push your code to trigger CI/CD!"
echo ""
