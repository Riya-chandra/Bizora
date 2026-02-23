# 🚀 Vercel Deployment Guide for Bizora

This guide will help you deploy Bizora to Vercel in 15 minutes.

---

## 📋 Prerequisites

✅ Vercel account (free at [vercel.com](https://vercel.com))  
✅ GitHub account with your Bizora repo  
✅ PostgreSQL database (Vercel Postgres - free tier)  
✅ Node.js 18+ installed locally  

---

## Step 1: Prepare Your Project

### 1.1 Push to GitHub

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit - ready for Vercel"
git remote add origin https://github.com/yourusername/bizora.git
git branch -M main
git push -u origin main
```

### 1.2 Verify Build Works Locally

```bash
# Clean build
rm -r dist node_modules
npm install
npm run build

# Check if dist folder has both index.cjs and public/
ls dist/
```

✅ Should see:
```
dist/
  ├── index.cjs       (server bundle)
  └── public/         (frontend files)
```

---

## Step 2: Create Vercel Postgres Database

### 2.1 Go to Vercel Dashboard
1. Visit [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Storage"** (top menu)
3. Click **"Create Database"** → **"Postgres"** → **"Create"**
4. Choose:
   - **Name**: `bizora-db`
   - **Region**: Closest to your users

### 2.2 Copy Connection String
- Click on database → **".env.local"** button
- Copy the `POSTGRES_URL` (this is your DATABASE_URL)
- Keep this safe ✅

---

## Step 3: Create Vercel Project

### 3.1 Import from GitHub
1. Visit [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Paste your GitHub repo URL
4. Click **"Import"**

### 3.2 Configure Project
Vercel will auto-detect your `package.json`:
- **Build Command**: (Leave as auto-detected or set to) `npm run build`
- **Output Directory**: (Leave blank - uses dist/public)
- **Install Command**: (Leave as auto-detected)

Click **"Continue"**

---

## Step 4: Set Environment Variables

In the **Environment Variables** section, add:

| Variable | Value | Source |
|----------|-------|--------|
| `DATABASE_URL` | `postgresql://...` | From Vercel Postgres |
| `NODE_ENV` | `production` | Type manually |
| `AI_PARSER_MODE` | `free` | Type manually |
| `TWILIO_ACCOUNT_SID` | Your SID | From Twilio Console |
| `TWILIO_AUTH_TOKEN` | Your token | From Twilio Console |
| `TWILIO_PHONE_NUMBER` | Your WhatsApp number | From Twilio Console |

✅ Click **"Deploy"** 

---

## Step 5: Wait for Deployment

Vercel will:
1. Clone your repo
2. Run `npm install`
3. Run `npm run build`
4. Deploy to production

⏳ Takes 2-3 minutes

Once done, you'll see:
```
✅ Production deployment successful
🔗 Visit: https://bizora-xxxxx.vercel.app
```

---

## Step 6: Test Your Deployment

### 6.1 Test API Endpoints
```bash
# Get stats
curl https://bizora-xxxxx.vercel.app/api/stats

# Get invoices
curl https://bizora-xxxxx.vercel.app/api/invoices

# Get orders
curl https://bizora-xxxxx.vercel.app/api/orders
```

### 6.2 Test Dashboard
Visit: `https://bizora-xxxxx.vercel.app`

You should see the dashboard loading!

---

## Step 7: Configure Twilio Webhook

### 7.1 Update Twilio Settings
1. Go to [Twilio Console](https://console.twilio.com)
2. Phone Numbers → Active Numbers → Your WhatsApp number
3. **Messaging** section → **Webhook URL**:
   ```
   https://bizora-xxxxx.vercel.app/api/ingest-chat
   ```
4. Save ✅

### 7.2 Test Message Ingestion
Send WhatsApp message to your number:
```
"2 kurti aur 1 duppatta"
```

Check Vercel logs:
```
vercel logs --follow
```

---

## 🔧 Common Issues & Fixes

### ❌ Build fails: "Cannot find module 'X'"
**Fix**: Make sure all dependencies are in `package.json`:
```bash
npm install
npm run build
```
Then push to GitHub and redeploy.

### ❌ Database connection error
**Fix**: 
1. Verify `DATABASE_URL` is correct
2. Copy from Vercel Postgres → Environment Variables
3. Redeploy after setting variable

### ❌ Invoices return 404 for PDF
**Fix**: Invoices table might be empty. Create some test orders first:
```bash
curl -X POST https://bizora-xxxxx.vercel.app/api/ingest-chat \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+919876543210",
    "message": "2 kurtis 400 each",
    "channel": "whatsapp"
  }'
```

### ❌ Cascade delete not working
**Fix**: Make sure you're using `deleteMessageWithRelated()` in routes.ts (already done ✅)

### ❌ Static files return 404
**Fix**: Vercel needs `vercel.json` rewrites configured. Your current setup should work - check file exists.

---

## 📈 Monitor Your Deployment

### View Logs
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# View logs
vercel logs --follow
```

### View Analytics
In Vercel Dashboard:
- **Deployments** tab - see all versions
- **Analytics** tab - traffic stats
- **Logs** tab - error messages

---

## 🔄 Update Deployment

### When you update code:

```bash
# Make changes
git add .
git commit -m "Update features"
git push origin main
```

Vercel auto-deploys from main branch! ✅

---

## 💡 Pro Tips

1. **Test locally first**
   ```bash
   npm run dev
   # Test everything locally before pushing
   ```

2. **Use Environment Variables**
   - Never commit API keys
   - Use `NEXT_PUBLIC_` prefix for client-side vars

3. **Monitor Database**
   - Vercel Postgres has free tier: 2GB storage
   - Check usage in Vercel Dashboard → Storage

4. **Scale if needed**
   - Vercel free tier handles ~100 API calls/sec
   - Upgrade to Pro if hitting limits

---

## 🎉 Success Checklist

✅ GitHub repo created and pushed  
✅ Vercel Postgres database created  
✅ Vercel project deployed  
✅ Environment variables set  
✅ Twilio webhook configured  
✅ API endpoints responding  
✅ Dashboard loads  
✅ WhatsApp messages being parsed  
✅ Invoices generating  

---

## 🆘 Still Having Issues?

### Check Deployment Logs:
```bash
vercel logs --follow
```

### Rebuild:
1. Go to Vercel Dashboard
2. **Deployments** tab
3. Click "..." menu → **Redeploy**

### Full Reset:
```bash
# Delete everything and redeploy
vercel remove --safe
vercel deploy --prod
```

---

## 📞 Support

- **Vercel Docs**: https://vercel.com/docs
- **Database Issues**: Check Vercel Storage tab
- **Build Issues**: Check Deployment log in dashboard
- **Runtime Issues**: Use `vercel logs --follow`

---

**🎊 Congratulations! Your app is live!**

Share your deployed URL:
```
https://bizora-xxxxx.vercel.app
```

