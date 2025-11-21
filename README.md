# 🚀 MetaBoost - Auto Post Facebook System

Hệ thống tự động đăng bài, trả lời tin nhắn và bình luận Facebook.

## 🌟 Tính năng

- ✅ Quản lý bài đăng tự động
- ✅ Tự động trả lời tin nhắn Facebook
- ✅ Tự động trả lời bình luận
- ✅ Quản lý nhiều fanpage
- ✅ Lập lịch đăng bài
- ✅ Theo dõi log lỗi
- ✅ Dashboard thống kê

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6 Modules)
- **Backend**: Firebase (Firestore, Authentication)
- **API**: Flask Python API
- **Hosting**: VPS (103.110.33.94) + DuckDNS
- **CI/CD**: GitHub Actions + rsync

## 🚀 Deployment

### Automatic Deployment (CI/CD)

Mỗi khi push code lên GitHub (branch `main` hoặc `dev-nhat`), GitHub Actions sẽ tự động deploy lên VPS.

```bash
git add .
git commit -m "Update feature"
git push origin main
```

### Manual Deployment

```bash
# Cách 1: Dùng script deploy.sh
./deploy.sh

# Cách 2: Deploy thủ công với rsync
rsync -avz --delete *.html component/ assets/ \
  user@103.110.33.94:/var/www/metaboost/
```

## 📁 Cấu trúc dự án

```
Metaboost/
├── index.html              # Dashboard tổng quan
├── login.html              # Đăng nhập
├── form.html               # Thêm bài đăng
├── posts.html              # Danh sách bài đăng
├── logs.html               # Log lỗi
├── api.html                # Quản lý API token
├── assets/
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript modules
│   └── img/               # Images
├── component/
│   ├── sidebar.html       # Sidebar component
│   └── footer.html        # Footer component
├── .github/
│   └── workflows/
│       └── deploy.yml     # CI/CD pipeline
└── deploy.sh              # Manual deploy script
```

## ⚙️ Setup CI/CD

### 1. Generate SSH Key

```bash
ssh-keygen -t ed25519 -C "metaboost-deploy" -f ~/.ssh/metaboost_deploy
```

### 2. Add SSH Key to VPS

```bash
ssh-copy-id -i ~/.ssh/metaboost_deploy.pub user@103.110.33.94
```

### 3. Add GitHub Secrets

Vào `Settings > Secrets and variables > Actions` và thêm:

- `VPS_SSH_KEY`: Nội dung file `~/.ssh/metaboost_deploy` (private key)
- `VPS_USER`: Username SSH (vd: `root`, `ubuntu`)

### 4. Test Deployment

```bash
# Test manual deployment
./deploy.sh

# Push to trigger CI/CD
git push origin main
```

## 🔧 VPS Configuration

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name metaboost.duckdns.org;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name metaboost.duckdns.org;

    ssl_certificate /etc/letsencrypt/live/metaboost.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/metaboost.duckdns.org/privkey.pem;

    root /var/www/metaboost;
    index index.html;

    # Frontend static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (Flask)
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL Certificate (Let's Encrypt)

```bash
sudo certbot --nginx -d metaboost.duckdns.org
```

## 🔐 Firebase Configuration

File `assets/js/firebase-config.js` chứa config Firebase. Đảm bảo:

- Firebase Authentication đã enable Email/Password
- Firestore Database đã tạo collection `posts`
- Firestore Rules đã cấu hình đúng

## 📊 Monitoring & Logs

### Check deployment logs

```bash
# View Nginx logs
ssh user@103.110.33.94 "sudo tail -f /var/log/nginx/access.log"
ssh user@103.110.33.94 "sudo tail -f /var/log/nginx/error.log"

# View Flask API logs
ssh user@103.110.33.94 "sudo journalctl -u metaboost-api -f"
```

### GitHub Actions logs

Xem tại: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`

## 🐛 Troubleshooting

### Deployment failed

```bash
# Check SSH connection
ssh user@103.110.33.94

# Check Nginx status
ssh user@103.110.33.94 "sudo systemctl status nginx"

# Check permissions
ssh user@103.110.33.94 "ls -la /var/www/metaboost"
```

### Website not loading

```bash
# Test nginx config
ssh user@103.110.33.94 "sudo nginx -t"

# Restart nginx
ssh user@103.110.33.94 "sudo systemctl restart nginx"
```

## 📝 Development

### Local development

```bash
# Clone repository
git clone <repo-url>
cd Metaboost

# Open with live server
# Hoặc dùng VS Code Live Server extension
```

### Branching strategy

- `main`: Production branch (auto-deploy)
- `dev-nhat`: Development branch
- Feature branches: `feature/your-feature-name`

## 🔗 Links

- **Website**: https://metaboost.duckdns.org
- **API Base**: https://metaboost.duckdns.org/api
- **VPS IP**: 103.110.33.94

## 👨‍💻 Author

**Trung Nhật**

## 📄 License

Private Project
