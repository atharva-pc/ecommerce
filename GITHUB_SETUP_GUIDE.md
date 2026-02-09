# 🚀 CREATE ARTCOMMERCE GITHUB REPOSITORY

## Complete Step-by-Step Guide

Follow these steps to create your private GitHub repository and push your code.

---

## 📋 PART 1: Create GitHub Repository (3 minutes)

### Step 1: Go to GitHub
1. Open browser and go to **https://github.com**
2. Sign in to your GitHub account

### Step 2: Create New Repository
1. Click the **"+"** icon in top-right corner
2. Click **"New repository"**

### Step 3: Repository Settings
Fill in the following:

- **Repository name:** `artcommerce`
- **Description:** "Physical art marketplace - Next.js, TypeScript, Supabase, Razorpay"
- **Visibility:** ✅ **Private** (IMPORTANT!)
- **Initialize repository:** ❌ **DO NOT** check any boxes (no README, no .gitignore, no license)

### Step 4: Create
1. Click **"Create repository"** button
2. You'll see a page with setup instructions
3. **Keep this page open!**

---

## 📋 PART 2: Push Your Code (5 minutes)

### Step 1: Open Terminal/PowerShell
1. Press **Windows + R**
2. Type `powershell` and press Enter

### Step 2: Navigate to Your Project
```powershell
cd C:\ecommerce
```

### Step 3: Check Git Installation
```powershell
git --version
```

**If you see an error:**
1. Download Git from https://git-scm.com/download/win
2. Install it
3. Restart PowerShell
4. Try again

### Step 4: Initialize Git (if not already)
```powershell
git init
```

### Step 5: Add All Files
```powershell
git add .
```

### Step 6: Commit Your Code
```powershell
git commit -m "Initial commit - ArtCommerce marketplace"
```

### Step 7: Set Main Branch
```powershell
git branch -M main
```

### Step 8: Add Remote Repository
**IMPORTANT:** Replace `YOUR_USERNAME` with your actual GitHub username!

```powershell
git remote add origin https://github.com/YOUR_USERNAME/artcommerce.git
```

**Example:**
```powershell
git remote add origin https://github.com/rohan123/artcommerce.git
```

### Step 9: Push to GitHub
```powershell
git push -u origin main
```

**If asked for credentials:**
- Username: Your GitHub username
- Password: **Use Personal Access Token** (not your password!)

---

## 🔑 PART 3: Create Personal Access Token (if needed)

If Git asks for password:

1. Go to **GitHub** → Click your profile picture (top-right)
2. Click **Settings**
3. Scroll down, click **Developer settings** (left sidebar)
4. Click **Personal access tokens** → **Tokens (classic)**
5. Click **Generate new token** → **Generate new token (classic)**
6. Give it a name: "ArtCommerce Push"
7. Select scopes: ✅ **repo** (check the top checkbox)
8. Click **Generate token** (bottom)
9. **COPY THE TOKEN** (you won't see it again!)
10. Use this token as your password when pushing

---

## ✅ VERIFICATION

After pushing, check:

1. Go to **https://github.com/YOUR_USERNAME/artcommerce**
2. You should see all your files!
3. Check the 🔒 icon - repository is PRIVATE ✓

---

## 📝 ALTERNATIVE METHOD: GitHub Desktop (Easier!)

If you prefer a GUI:

### Step 1: Download GitHub Desktop
- Go to https://desktop.github.com
- Download and install

### Step 2: Sign In
- Open GitHub Desktop
- Sign in with your GitHub account

### Step 3: Add Repository
1. Click **File** → **Add local repository**
2. Choose `C:\ecommerce`
3. If it says "not a git repository", click **Create a repository**

### Step 4: Commit
1. You'll see all files listed
2. Write commit message: "Initial commit - ArtCommerce marketplace"
3. Click **Commit to main**

### Step 5: Publish
1. Click **Publish repository** (top)
2. Name: `artcommerce`
3. Description: "Physical art marketplace"
4. ✅ Check **Keep this code private**
5. Click **Publish repository**

**Done!** ✓

---

## 🎯 QUICK CHECKLIST

- [ ] GitHub account ready
- [ ] Created private repository named "artcommerce"
- [ ] Git installed on your computer
- [ ] Navigated to C:\ecommerce in terminal
- [ ] Ran `git init`
- [ ] Ran `git add .`
- [ ] Ran `git commit -m "Initial commit"`
- [ ] Added remote origin
- [ ] Pushed to GitHub
- [ ] Verified repository is private
- [ ] All files visible on GitHub

---

## 🆘 COMMON ISSUES

### "git: command not found"
**Solution:** Install Git from https://git-scm.com/download/win

### "Permission denied"
**Solution:** Use Personal Access Token instead of password

### "Repository not found"
**Solution:** Check the remote URL:
```powershell
git remote -v
```
Make sure your username is correct!

### "Failed to push"
**Solution:** Make sure you committed first:
```powershell
git status
git commit -m "Initial commit"
git push
```

---

## 📞 NEXT STEPS

After repository is created:

1. ✅ Update README.md with your details
2. ✅ Add collaborators (if any)
3. ✅ Set up branch protection (optional)
4. ✅ Deploy to Vercel
5. ✅ Share repository link (for competition)

---

## 🎉 SUCCESS!

Your code is now safely stored in a private GitHub repository!

**Repository URL:** https://github.com/YOUR_USERNAME/artcommerce

You can now:
- ✅ Access code from anywhere
- ✅ Track changes with Git
- ✅ Deploy to Vercel
- ✅ Share with judges (give them access)
- ✅ Collaborate with others

---

**Need help?** Run these commands to check status:

```powershell
cd C:\ecommerce
git status
git remote -v
git log --oneline
```
