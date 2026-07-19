# Deployment Guide - Step by Step

## What We're Deploying

| Part | Platform | URL |
|------|----------|-----|
| Frontend (React) | Vercel | https://your-app.vercel.app |
| Backend (FastAPI) | Railway | https://your-api.up.railway.app |
| Database (PostgreSQL) | Railway | (internal, connected to backend) |

---

## Step 1: Create a GitHub Account (if you don't have one)

1. Go to https://github.com
2. Sign up for free
3. Verify your email

---

## Step 2: Install Git (if you don't have it)

Open your terminal and run:
```bash
sudo apt install git -y
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

---

## Step 3: Create a GitHub Repository

1. Go to https://github.com/new
2. Repository name: `running-planner`
3. Make it **Public** (or Private, your choice)
4. Do NOT check any "Add README" boxes (we already have one)
5. Click **Create repository**
6. Copy the repository URL (it looks like `https://github.com/YOUR_USERNAME/running-planner.git`)

---

## Step 4: Upload Your Code to GitHub

Open a terminal in your project folder and run these commands one by one:

```bash
cd "/home/fadh/Documents/Running Planner"

# Initialize git
git init
git add .
git commit -m "Initial commit - Running Planner"

# Connect to your GitHub repository (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/running-planner.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Replace YOUR_USERNAME** with your actual GitHub username.

---

## Step 5: Deploy Backend to Railway

### 5.1 Create Railway Account
1. Go to https://railway.app
2. Click **Login** and sign in with your GitHub account
3. Authorize Railway to access your repositories

### 5.2 Create a New Project
1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. Select your `running-planner` repository
4. Railway will detect it's a monorepo - click **Add Root Directory** and set it to `backend`
5. Click **Deploy**

### 5.3 Add PostgreSQL Database
1. In your Railway project dashboard, click **+ New**
2. Select **Database** → **PostgreSQL**
3. Railway creates a PostgreSQL instance automatically
4. Click on the PostgreSQL service → **Variables** tab
5. Copy the `DATABASE_URL` value (it looks like `postgresql://postgres:xxx@xxx.railway.cloud:5432/railway`)

### 5.4 Set Environment Variables
1. Click on your backend service (the one running your code)
2. Go to **Variables** tab
3. Click **+ New Variable**
4. Add these variables:

| Variable Name | Value |
|---------------|-------|
| `DATABASE_URL` | The PostgreSQL URL you copied (Railway may auto-set this) |

### 5.5 Set the Start Command
1. Go to **Settings** tab of your backend service
2. Under **Build Command**, enter: `pip install -r requirements.txt`
3. Under **Start Command**, enter: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Railway will redeploy automatically

### 5.6 Get Your Backend URL
1. Go to **Settings** → **Networking**
2. Click **Generate Domain**
3. You'll get a URL like: `https://running-planner-production.up.railway.app`
4. **Copy this URL** - you'll need it for the frontend

### 5.7 Test Your Backend
1. Open your browser and go to: `https://YOUR-RAILWAY-URL/api/health`
2. You should see: `{"status": "ok"}`
3. Also try: `https://YOUR-RAILWAY-URL/docs` to see the API docs

---

## Step 6: Deploy Frontend to Vercel

### 6.1 Create Vercel Account
1. Go to https://vercel.com
2. Click **Sign Up** and sign in with your GitHub account

### 6.2 Import Your Project
1. Click **Add New** → **Project**
2. Find your `running-planner` repository and click **Import**
3. Set the **Root Directory** to `frontend`
4. Framework: **Vite** (should auto-detect)
5. Click **Deploy** (it will fail the first time - that's OK, we need to set env vars)

### 6.3 Set Environment Variables
1. In your Vercel project, go to **Settings** → **Environment Variables**
2. Add this variable:

| Variable Name | Value |
|---------------|-------|
| `VITE_API_URL` | `https://YOUR-RAILWAY-URL/api` |

**Replace YOUR-RAILWAY-URL** with your actual Railway backend URL.

**Important:** Make sure it ends with `/api` - for example:
`https://running-planner-production.up.railway.app/api`

3. Click **Save**

### 6.4 Redeploy
1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Wait for it to finish

### 6.5 Get Your Frontend URL
1. Go to **Settings** → **Domains**
2. Vercel gives you a URL like: `https://running-planner.vercel.app`
3. **Open this URL in your browser**

---

## Step 7: Test Everything

1. Open your Vercel URL
2. The app should load with the dashboard
3. Go to Calendar → Add a workout → It should save
4. Go to Plan Generator → Generate a plan → Go to Calendar to see the workouts
5. Go to Templates → Should show running and strength templates

---

## Quick Reference - Your URLs

After deployment, you'll have:

| Service | URL |
|---------|-----|
| Frontend | `https://YOUR-APP.vercel.app` |
| Backend API | `https://YOUR-APP.up.railway.app` |
| API Docs | `https://YOUR-APP.up.railway.app/docs` |
| Health Check | `https://YOUR-APP.up.railway.app/api/health` |

---

## Updating the App After Deployment

When you make changes and want to update the live app:

```bash
cd "/home/fadh/Documents/Running Planner"

# Stage all changes
git add .

# Commit
git commit -m "Description of your changes"

# Push to GitHub
git push
```

Both Vercel and Railway auto-deploy when you push to GitHub!
- **Vercel** deploys the frontend in ~30 seconds
- **Railway** deploys the backend in ~1-2 minutes

---

## Troubleshooting

### "Application failed to start" on Railway
- Check the **Deploy Logs** in Railway
- Make sure `DATABASE_URL` is set
- Make sure the start command is: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend shows "Failed to fetch" or "Network Error"
- Check that `VITE_API_URL` is set correctly in Vercel
- Make sure it ends with `/api`
- Make sure your Railway backend is deployed and running (check the health endpoint)

### CORS errors in browser console
- The backend CORS settings include common origins
- If needed, update `backend/app/main.py` to add your Vercel URL:
  ```python
  allow_origins=["http://localhost:5173", "https://YOUR-APP.vercel.app"],
  ```

### Database tables not created
- The backend auto-creates tables on startup
- Check Railway logs for any database connection errors
- Make sure `DATABASE_URL` points to the Railway PostgreSQL instance

### "Module not found" errors
- Make sure you committed `package.json` and `package-lock.json`
- For the backend, make sure `requirements.txt` is committed

---

## Free Tier Limits

### Vercel (Frontend)
- 100 GB bandwidth/month
- Unlimited deployments
- Custom domains supported

### Railway (Backend + Database)
- $5 credit/month free (enough for a hobby project)
- PostgreSQL included in free tier
- Sleeps after inactivity (wakes on first request, ~30s cold start)

---

## Cost Estimate

For a personal/hobby project:
- **Vercel**: Free
- **Railway**: Free (within $5 credit)
- **Total**: $0/month

For heavier usage:
- Vercel Pro: $20/month
- Railway Hobby: $5/month + usage
