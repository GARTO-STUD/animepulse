# Deploy AnimePulse to Cloudflare Pages

## ✅ Prerequisites

- Cloudflare account (free)
- Node.js 18+ installed locally
- Wrangler CLI (optional, for deploying from terminal)

## 🚀 Method 1: Direct Upload (Easiest)

### Step 1: Build the Project Locally

```bash
cd /home/neyflex/.openclaw/workspace/animepulse

# Install dependencies
npm install

# Build the project
npm run build
```

### Step 2: Create Cloudflare Pages Project

1. Go to: https://dash.cloudflare.com
2. Click **Pages** in the left sidebar
3. Click **Create a project**
4. Click **Upload assets**

### Step 3: Upload the dist folder

1. Drag and drop the `dist` folder (created in the project root)
2. Wait for upload to complete
3. Click **Save and Deploy**

### Step 4: Configure Environment Variables

1. Go to your project → **Settings** → **Environment Variables**
2. Add all variables from `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD8Ss2-lexlQ_LbWZRPtBQD9a8ua62181I
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=animepulse-42588.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=animepulse-42588
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=animepulse-42588.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=333512090733
NEXT_PUBLIC_FIREBASE_APP_ID=1:333512090733:web:89d7c6788c8553c80dcb64
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-7KS266T9ZQ
NEXT_PUBLIC_APP_URL=https://animepulse.pages.dev
TELEGRAM_BOT_TOKEN=8619875811:AAEOOLGCadWLdXcOjts7wIcBRVsV7lZJrV8
TELEGRAM_CHANNEL_ID=-1003730635887
GEMINI_API_KEY=AIzaSyB0zLp7XtZt1YXbkcMPbqDA4hLzD17sL8s
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-7944585824292210
```

⚠️ **Important**: For Cloudflare Pages, add variables to **Production** environment

## 🚀 Method 2: Wrangler CLI

### Step 1: Install Wrangler

```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate.

### Step 3: Create wrangler.toml

Create file `wrangler.toml` in project root:

```toml
name = "animepulse"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"
```

### Step 4: Build and Deploy

```bash
# Build
cd /home/neyflex/.openclaw/workspace/animepulse
npm install
npm run build

# Deploy
wrangler pages deploy dist
```

## 🚀 Method 3: Git Integration (Auto-deploy)

### Step 1: Push to GitHub

```bash
cd /home/neyflex/.openclaw/workspace/animepulse

git init
git add .
git commit -m "Initial commit - AnimePulse"

# Create repo on https://github.com/new first
git remote add origin https://github.com/YOUR_USERNAME/animepulse.git
git push -u origin main
```

### Step 2: Connect GitHub to Cloudflare

1. Go to: https://dash.cloudflare.com → Pages
2. Click **Create a project**
3. Select **Connect to Git**
4. Choose **GitHub**
5. Select your `animepulse` repository

### Step 3: Configure Build Settings

| Setting | Value |
|---------|-------|
| Framework preset | Next.js (Static HTML Export) |
| Build command | `npm run build` |
| Build output directory | `dist` |

### Step 4: Add Environment Variables

Add all the environment variables from `.env.local`:

- Go to project → Settings → Environment Variables
- Add all variables
- Set to **Production** environment

### Step 5: Deploy

Every push to `main` branch will auto-deploy!

## 📁 Project Structure for Cloudflare

```
animepulse/
├── dist/                 # Build output (upload this)
│   ├── index.html
│   ├── _next/
│   └── ...
├── wrangler.toml         # Cloudflare config (optional)
├── next.config.mjs       # Should have: output: 'export', distDir: 'dist'
└── .env.local           # Environment variables
```

## ⚙️ Configuration Already Done

Your `next.config.mjs` already has the correct settings:

```javascript
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};
```

## 🔄 Re-deploy After Changes

### Manual Update:
```bash
npm run build
# Upload new dist folder to Cloudflare Pages
```

### With Wrangler:
```bash
npm run build
wrangler pages deploy dist
```

### With Git:
```bash
git add .
git commit -m "Update content"
git push origin main
# Auto-deploys to Cloudflare Pages
```

## 🌐 Custom Domain (Optional)

1. In Cloudflare Pages dashboard → project → **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain: `animepulse.com`
4. Follow DNS setup instructions

## 🛠️ Troubleshooting

### Build Fails?
```bash
rm -rf .next dist node_modules
npm install
npm run build
```

### Images Not Loading?
- Already configured: `images: { unoptimized: true }`
- All images must be in `/public` folder or use external URLs

### Environment Variables Not Working?
- Must be in **Production** environment
- Variables with `NEXT_PUBLIC_` prefix are accessible in browser
- Re-deploy after adding variables

## 🎉 Done!

Your site will be live at:
- `https://animepulse.pages.dev`
- Or your custom domain

## 📊 Comparison: Vercel vs Cloudflare Pages

| Feature | Vercel | Cloudflare Pages |
|---------|--------|------------------|
| **Build Limit (Free)** | 6,000hr/month | 500/month |
| **Bandwidth** | 100GB | Unlimited |
| **Speed** | Fast | Very Fast (CDN) |
| **Auto Deploy** | Yes | Yes |
| **Serverless Functions** | Yes | Yes |
| **Static Sites** | ✅ Yes | ✅ Yes |

**Recommendation**: Both are great! Choose based on your needs:
- **Vercel**: Better Next.js integration, serverless functions
- **Cloudflare Pages**: Unlmited bandwidth, faster global CDN

---

## 🔗 Useful Links

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Next.js Export Mode](https://nextjs.org/docs/pages/building-your-application/deploying/static-exports)
