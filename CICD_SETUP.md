# 🚀 CI/CD Setup Guide

## Hướng dẫn thiết lập CI/CD cho MetaBoost

### 📋 Prerequisites

- ✅ VPS với IP: 103.110.33.94
- ✅ GitHub repository: https://github.com/khazed-dev/Metaboost
- ✅ SSH access to VPS
- ✅ Domain: metaboost.duckdns.org

---

## 🔧 Step 1: Setup VPS (One-time)

### 1.1 Connect to VPS

```bash
ssh root@103.110.33.94
# hoặc
ssh your_username@103.110.33.94
```

### 1.2 Run VPS Setup Script

```bash
# Copy setup script to VPS
scp setup-vps.sh root@103.110.33.94:/tmp/

# SSH to VPS and run setup
ssh root@103.110.33.94
cd /tmp
chmod +x setup-vps.sh
./setup-vps.sh
```

Hoặc chạy trực tiếp:

```bash
ssh root@103.110.33.94 'bash -s' < setup-vps.sh
```

### 1.3 Setup SSL Certificate

```bash
ssh root@103.110.33.94

# Install SSL certificate
sudo certbot --nginx -d metaboost.duckdns.org

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 🔑 Step 2: Setup SSH Keys for GitHub Actions

### 2.1 Generate and Copy SSH Key

Chạy từ máy local:

```bash
./setup-ssh.sh
```

Script này sẽ:
- Tạo SSH key mới
- Copy key lên VPS
- Hiển thị private key để thêm vào GitHub

### 2.2 Add GitHub Secrets

1. Vào repository Settings:
   ```
   https://github.com/khazed-dev/Metaboost/settings/secrets/actions
   ```

2. Click **"New repository secret"** và thêm:

   **Secret 1:**
   - Name: `VPS_SSH_KEY`
   - Value: (Copy từ output của `setup-ssh.sh`)
   
   **Secret 2:**
   - Name: `VPS_USER`
   - Value: `root` (hoặc username VPS của bạn)

---

## 🚀 Step 3: Test Deployment

### 3.1 Manual Deployment Test

```bash
# Test manual deploy
./deploy.sh
```

### 3.2 Automatic Deployment Test

```bash
# Commit và push code
git add .
git commit -m "test: CI/CD setup"
git push origin main
```

Kiểm tra workflow tại:
```
https://github.com/khazed-dev/Metaboost/actions
```

---

## 📁 Step 4: Deploy Flask API (Optional)

Nếu bạn có Flask API backend:

### 4.1 Create Flask API files on VPS

```bash
ssh root@103.110.33.94

# Navigate to API directory
cd /opt/metaboost-api

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install flask gunicorn requests

# Create app.py (example)
cat > app.py <<'EOF'
from flask import Flask, jsonify
app = Flask(__name__)

@app.route('/api/health')
def health():
    return jsonify({"status": "ok", "service": "metaboost-api"})

@app.route('/api/get-token')
def get_token():
    # Your token logic here
    return jsonify({"tokens": {}})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
EOF

# Start the service
sudo systemctl start metaboost-api
sudo systemctl enable metaboost-api

# Check status
sudo systemctl status metaboost-api
```

---

## ✅ Step 5: Verify Everything Works

### 5.1 Check Website

```bash
curl -I https://metaboost.duckdns.org
```

Expected: `HTTP/2 200`

### 5.2 Check API

```bash
curl https://metaboost.duckdns.org/api/health
```

Expected: `{"status":"ok"}`

### 5.3 Check Deployment Log

```bash
ssh root@103.110.33.94

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check API logs
sudo journalctl -u metaboost-api -f
```

---

## 🔄 Daily Workflow

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes
# Edit files...

# 3. Test locally
# Open index.html in browser

# 4. Commit changes
git add .
git commit -m "feat: add new feature"

# 5. Push to GitHub
git push origin feature/new-feature

# 6. Create Pull Request to main

# 7. After merge, auto-deploy to VPS! 🎉
```

### Hotfix Workflow

```bash
# Quick fix directly to main
git checkout main
git pull

# Make changes
# Edit files...

# Commit and push (will auto-deploy)
git add .
git commit -m "fix: urgent bug fix"
git push origin main

# CI/CD will deploy in ~30 seconds
```

---

## 🐛 Troubleshooting

### Problem: Deployment failed in GitHub Actions

```bash
# Check GitHub Actions logs
# Go to: https://github.com/khazed-dev/Metaboost/actions

# Common issues:
# 1. SSH key not added → Add VPS_SSH_KEY secret
# 2. VPS_USER wrong → Check VPS_USER secret
# 3. Permission denied → Check VPS permissions
```

### Problem: Website not loading after deploy

```bash
# SSH to VPS
ssh root@103.110.33.94

# Check Nginx status
sudo systemctl status nginx

# Check Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check file permissions
ls -la /var/www/metaboost/
```

### Problem: API not working

```bash
# Check API service
ssh root@103.110.33.94
sudo systemctl status metaboost-api

# View API logs
sudo journalctl -u metaboost-api -n 50

# Restart API
sudo systemctl restart metaboost-api
```

---

## 📊 Monitoring

### Check deployment history

```bash
# On VPS, check backups
ssh root@103.110.33.94
ls -la /var/www/metaboost.backup.*
```

### Check Nginx access logs

```bash
ssh root@103.110.33.94
sudo tail -f /var/log/nginx/access.log
```

### Check API logs

```bash
ssh root@103.110.33.94
sudo journalctl -u metaboost-api -f
```

---

## 🎯 Performance Tips

### Enable Gzip compression

Already configured in `setup-vps.sh` Nginx config.

### Enable caching

Static files (CSS, JS, images) are cached for 7 days.

### Monitor resource usage

```bash
ssh root@103.110.33.94

# CPU and memory
htop

# Disk usage
df -h

# Nginx connections
sudo ss -tulpn | grep nginx
```

---

## 🔐 Security Checklist

- [x] SSH key authentication (no password)
- [x] Firewall enabled (ufw)
- [x] SSL certificate (HTTPS)
- [x] Nginx security headers
- [ ] Fail2ban (optional)
- [ ] Regular backups
- [ ] Security updates

---

## 📞 Support

Nếu có vấn đề, kiểm tra:

1. GitHub Actions logs
2. VPS Nginx logs
3. VPS API logs
4. Firebase console logs

---

## 🎉 Done!

CI/CD của bạn đã sẵn sàng! Mỗi lần push code lên GitHub, website sẽ tự động deploy lên VPS.

Happy deploying! 🚀
