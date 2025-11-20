#!/bin/bash

# 🔧 MetaBoost VPS Setup Script
# Chạy script này trên VPS để cài đặt môi trường

set -e

echo "🚀 MetaBoost VPS Setup"
echo "======================="

# Update system
echo "📦 Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install nginx -y

# Install Certbot for SSL
echo "🔐 Installing Certbot..."
sudo apt install certbot python3-certbot-nginx -y

# Install Python & Flask dependencies
echo "🐍 Installing Python dependencies..."
sudo apt install python3 python3-pip python3-venv -y

# Create web directory
echo "📁 Creating web directory..."
sudo mkdir -p /var/www/metaboost
sudo chown -R $USER:$USER /var/www/metaboost

# Create Nginx config
echo "⚙️  Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/metaboost > /dev/null <<'EOF'
server {
    listen 80;
    server_name metaboost.duckdns.org;

    root /var/www/metaboost;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to Flask
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static files
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
}
EOF

# Enable site
echo "✅ Enabling site..."
sudo ln -sf /etc/nginx/sites-available/metaboost /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

# Setup Flask API directory
echo "🐍 Setting up Flask API..."
sudo mkdir -p /opt/metaboost-api
sudo chown -R $USER:$USER /opt/metaboost-api

# Create Flask systemd service
echo "⚙️  Creating Flask service..."
sudo tee /etc/systemd/system/metaboost-api.service > /dev/null <<EOF
[Unit]
Description=MetaBoost Flask API
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/metaboost-api
Environment="PATH=/opt/metaboost-api/venv/bin"
ExecStart=/opt/metaboost-api/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 app:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable Flask service (will start when app.py is deployed)
sudo systemctl daemon-reload

# Setup SSL (if domain is ready)
echo ""
echo "🔐 SSL Setup"
echo "To setup SSL certificate, run:"
echo "  sudo certbot --nginx -d metaboost.duckdns.org"
echo ""

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
echo "y" | sudo ufw enable || true

echo ""
echo "✅ VPS Setup Complete!"
echo ""
echo "📝 Next steps:"
echo "1. Setup DuckDNS:"
echo "   Visit https://www.duckdns.org/"
echo "   Create subdomain: metaboost"
echo "   Point to this server IP"
echo ""
echo "2. Get SSL certificate:"
echo "   sudo certbot --nginx -d metaboost.duckdns.org"
echo ""
echo "3. Deploy Flask API to /opt/metaboost-api/"
echo "   Then: sudo systemctl start metaboost-api"
echo ""
echo "4. Deploy frontend:"
echo "   Run ./deploy.sh from your local machine"
echo ""
