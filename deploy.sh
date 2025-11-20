#!/bin/bash

# 🚀 MetaBoost Manual Deploy Script
# Sử dụng: ./deploy.sh

set -e  # Exit on error

echo "🚀 MetaBoost Deployment Script"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="103.110.33.94"
VPS_USER="${VPS_USER:-root}"  # Đọc từ env hoặc dùng root
REMOTE_PATH="/var/www/metaboost"

echo -e "${YELLOW}📍 Target: ${VPS_USER}@${VPS_IP}:${REMOTE_PATH}${NC}"

# Check if SSH key exists
if [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ]; then
    echo -e "${RED}❌ SSH key not found! Please setup SSH key first.${NC}"
    echo "Run: ssh-keygen -t ed25519 -C 'metaboost-deploy'"
    exit 1
fi

# Test SSH connection
echo -e "${YELLOW}🔐 Testing SSH connection...${NC}"
if ssh -o ConnectTimeout=5 ${VPS_USER}@${VPS_IP} "echo 'Connection OK'" 2>/dev/null; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to VPS${NC}"
    exit 1
fi

# Backup on server first
echo -e "${YELLOW}💾 Creating backup on server...${NC}"
ssh ${VPS_USER}@${VPS_IP} "
    if [ -d ${REMOTE_PATH} ]; then
        sudo cp -r ${REMOTE_PATH} ${REMOTE_PATH}.backup.$(date +%Y%m%d_%H%M%S)
        echo 'Backup created'
    fi
"

# Deploy frontend files
echo -e "${YELLOW}📦 Deploying frontend files...${NC}"
rsync -avz --progress --delete \
    --exclude='.git' \
    --exclude='.github' \
    --exclude='node_modules' \
    --exclude='.DS_Store' \
    --exclude='*.sh' \
    --exclude='.gitignore' \
    --exclude='README.md' \
    --exclude='.env*' \
    *.html component/ assets/ \
    ${VPS_USER}@${VPS_IP}:${REMOTE_PATH}/

# Set correct permissions
echo -e "${YELLOW}🔧 Setting permissions...${NC}"
ssh ${VPS_USER}@${VPS_IP} "
    sudo chown -R www-data:www-data ${REMOTE_PATH}
    sudo chmod -R 755 ${REMOTE_PATH}
"

# Reload Nginx
echo -e "${YELLOW}🔄 Reloading Nginx...${NC}"
ssh ${VPS_USER}@${VPS_IP} "sudo systemctl reload nginx"

# Test website
echo -e "${YELLOW}🧪 Testing website...${NC}"
if curl -s -o /dev/null -w "%{http_code}" https://metaboost.duckdns.org | grep -q "200"; then
    echo -e "${GREEN}✅ Website is responding correctly${NC}"
else
    echo -e "${RED}⚠️  Website may have issues${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Visit: https://metaboost.duckdns.org${NC}"
echo ""
