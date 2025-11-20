# 🔄 CI/CD Workflow Guide

## 📋 Workflow Strategy

Dự án sử dụng **GitFlow** với CI/CD tự động:

```
feature/dev branches → Check only ✅
       ↓
    main branch → Check + Deploy 🚀
```

---

## 🌿 Branch Strategy

### **Development Branches** (Check only)
- `dev-*` - Development branches
- `feature/*` - Feature branches
- Any other non-main branches

**Khi push:**
- ✅ Run validation checks
- ✅ Verify file structure
- ❌ **NO deployment**

### **Main Branch** (Check + Deploy)
- `main` - Production branch

**Khi merge vào main:**
- ✅ Run validation checks
- ✅ **Auto-deploy to VPS**
- ✅ Website updates live

---

## 🚀 Workflow Details

### Job 1: Check & Validate
**Triggers:** All pushes and PRs
**Purpose:** Validate code quality

```yaml
✓ Check HTML files exist
✓ Verify directory structure
✓ Validate required files
```

### Job 2: Deploy
**Triggers:** Only when pushing to `main`
**Purpose:** Deploy to production VPS

```yaml
✓ SSH to VPS
✓ Backup current version
✓ Deploy new files
✓ Reload Nginx
✓ Verify deployment
```

### Job 3: Summary
**Triggers:** Always (after other jobs)
**Purpose:** Show workflow results

```yaml
✓ Branch info
✓ Check status
✓ Deploy status
```

---

## 💻 Development Workflow

### 1️⃣ **Working on Feature**

```bash
# Create feature branch
git checkout -b feature/add-new-page

# Make changes
# Edit files...

# Commit and push
git add .
git commit -m "feat: add new page"
git push origin feature/add-new-page

# ✅ GitHub Actions will CHECK your code
# ❌ Will NOT deploy (because not main branch)
```

### 2️⃣ **Create Pull Request**

```bash
# Go to GitHub and create PR to main
# CI will run checks on PR
```

### 3️⃣ **Merge to Main = Auto Deploy**

```bash
# After PR approved and merged to main
# ✅ Checks will run
# 🚀 Auto-deploy to VPS
# 🌐 Website updates at https://metaboost.duckdns.org
```

---

## 🔥 Hotfix Workflow

For urgent production fixes:

```bash
# Checkout main
git checkout main
git pull

# Make quick fix
# Edit files...

# Commit and push (will auto-deploy)
git add .
git commit -m "fix: urgent bug fix"
git push origin main

# 🚀 Auto-deploy in ~30 seconds
```

---

## 📊 Check Workflow Status

### View on GitHub
```
https://github.com/khazed-dev/Metaboost/actions
```

### Workflow Badge
Add to README:
```markdown
![CI/CD](https://github.com/khazed-dev/Metaboost/workflows/CI%2FCD%20MetaBoost/badge.svg)
```

---

## 🎯 Examples

### ✅ Example 1: Feature Development
```bash
Branch: feature/add-dashboard
Push: ✅ Checks run
Deploy: ❌ Skipped
Result: Safe to develop without affecting production
```

### ✅ Example 2: Merge to Main
```bash
Branch: main
Push: ✅ Checks run
Deploy: ✅ Auto-deploy
Result: Production updated automatically
```

### ✅ Example 3: Pull Request
```bash
PR: feature/new-page → main
Action: ✅ Checks run on PR
Deploy: ❌ Not yet (until merged)
Result: Can review before deploy
```

---

## 🛠️ Troubleshooting

### Deploy not running after merge?

**Check:**
1. Are GitHub Secrets added? (`VPS_SSH_KEY`, `VPS_USER`)
2. Is branch exactly `main`? (case-sensitive)
3. Check Actions tab for errors

### Want to deploy manually?

```bash
./deploy.sh
```

### Want to skip checks?

Add `[skip ci]` to commit message:
```bash
git commit -m "docs: update README [skip ci]"
```

---

## 📝 Configuration

### Enable/Disable Jobs

Edit `.github/workflows/deploy.yml`:

```yaml
# Deploy only on main
if: github.ref == 'refs/heads/main'

# Deploy on multiple branches
if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging'

# Skip deploy entirely
if: false
```

### Add More Branches

```yaml
on:
  push:
    branches:
      - main
      - staging      # Add staging branch
      - dev-*        # All dev-* branches
      - feature/*    # All feature branches
```

---

## 🎓 Best Practices

1. ✅ **Always work on feature branches**
2. ✅ **Create PR before merging to main**
3. ✅ **Test with `./deploy.sh` locally first**
4. ✅ **Write clear commit messages**
5. ✅ **Review changes before merging**
6. ❌ **Never push directly to main** (unless hotfix)

---

## 📞 Need Help?

- Check workflow logs in Actions tab
- Review this guide
- Test locally with `./deploy.sh`
