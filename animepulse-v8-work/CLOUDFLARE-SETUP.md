# Cloudflare Setup Guide for AnimePulse

## 🎯 الهدف: نظام Auto-Pilot مع Cloudflare

النظام الجديد يعمل كالتالي:
```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  RSS Feeds  │────▶│  Cloudflare      │────▶│   Telegram  │
│  (News)     │     │  Worker (AI)     │     │   Channel   │
└─────────────┘     └──────────────────┘     └─────────────┘
                            │
                            ▼
                    ┌─────────────┐
                    │  Cloudflare │
                    │  KV Storage │
                    └─────────────┘
```

## 📋 المكونات

### 1. Cloudflare Pages (الموقع الثابت)
- ✅ جميع الصفحات HTML/CSS/JS
- ✅ لا يحتاج server-side rendering
- ✅ سريع جداً من أي مكان

### 2. Cloudflare Worker (المعالج الخلفي)
- ✅ يجلب RSS
- ✅ يولد AI content
- ✅ ينشر Telegram
- ✅ يحفظ في KV

### 3. Cloudflare KV (قاعدة البيانات)
- ✅ تخزين News
- ✅ تخزين Trending
- ✅ تخزين الإعدادات

## 🚀 خطوات الإعداد

### الخطوة 1: إنشاء Cloudflare KV

1. اذهب لـ https://dash.cloudflare.com
2. Workers & Pages → KV
3. Create a namespace
4. سمها `ANIMEPULSE_KV`
5. انسخ الـ ID

### الخطوة 2: تعديل wrangler.toml

```toml
name = "animepulse"
main = "worker.ts"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "ANIMEPULSE_KV"
id = "YOUR_KV_NAMESPACE_ID"  # <-- ضع الـ ID هنا
preview_id = "YOUR_PREVIEW_ID"

[env.production.vars]
CRON_SECRET = "animepulse-cron-secret-2024"
GEMINI_API_KEY = "AIzaSyB0zLp7XtZt1YXbkcMPbqDA4hLzD17sL8s"
TELEGRAM_BOT_TOKEN = "8619875811:AAEOOLGCadWLdXcOjts7wIcBRVsV7lZJrV8"
TELEGRAM_CHANNEL_ID = "-1003730635887"

[triggers]
crons = ["0 */6 * * *"]  # كل 6 ساعات
```

### الخطوة 3: نشر الـ Worker

```bash
# تثبيت Wrangler
npm install -g wrangler

# تسجيل الدخول
wrangler login

# نشر الـ Worker
cd /home/neyflex/.openclaw/workspace/animepulse
wrangler deploy

# أو مع environment محدد
wrangler deploy --env production
```

### الخطوة 4: إعداد Cron Job

في wrangler.toml تم إضافة:
```toml
[triggers]
crons = ["0 */6 * * *"]
```

هذا يشغل الـ Worker تلقائياً كل 6 ساعات.

### الخطوة 5: اختبار يدوي

```bash
# اختبار الـ Worker محلياً
wrangler dev

# ثم افتح في المتصفح:
# http://localhost:8787/auto-pilot?secret=animepulse-cron-secret-2024
```

### الخطوة 6: نشر الموقع (Pages)

#### الطريقة 1: Direct Upload
```bash
cd /home/neyflex/.openclaw/workspace/animepulse

# بناء الموقع
npm install
npm run build

# رفع المجلد dist
# اذهب لـ dash.cloudflare.com → Pages → Create project → Upload assets
# ارفع مجلد dist
```

#### الطريقة 2: Git Integration
```bash
# GitHub repo
git init
git add .
git commit -m "AnimePulse with Cloudflare Worker"
git remote add origin https://github.com/YOUR_USERNAME/animepulse.git
git push -u origin main

# في Cloudflare dashboard:
# Pages → Create project → Connect to GitHub
# Build command: npm run build
# Output directory: dist
```

### الخطوة 7: ربط الموقع بالـ Worker

في موقعك (Pages)، استدعِ الـ Worker للحصول على الأخبار:

```javascript
// في صفحة News
async function getNews() {
  const response = await fetch('https://your-worker.animepulse.workers.dev/news');
  const data = await response.json();
  return data.news;
}
```

## 🔧 الملفات المهمة

| الملف | الوصف |
|-------|-------|
| `worker.ts` | Cloudflare Worker الرئيسي |
| `wrangler.toml` | إعدادات Wrangler |
| `app/` | صفحات Next.js |
| `dist/` | المخرجات للرفع |

## 🕐 جداول Cron

### تعديل التوقيت في wrangler.toml:

```toml
# كل ساعة
[triggers]
crons = ["0 * * * *"]

# كل 3 ساعات
[triggers]
crons = ["0 */3 * * *"]

# مرتين يومياً
[triggers]
crons = ["0 9,21 * * *"]

# مرة واحدة يومياً
[triggers]
crons = ["0 9 * * *"]
```

## 📊 ما يفعله النظام

### كل 6 ساعات:

1. ⏰ **Cron Trigger** يشغل الـ Worker
2. 📡 **يحدث الصفحة (Fetch RSS)**
3. 🔍 **يتحقق من التكرارات**
4. ✨ **يولد محتوى AI** (Gemini)
5. 💾 **يحفظ في KV**
6. 📱 **ينشر على Telegram**

### النتيجة:
- ✅ موقعك يتحدث تلقائياً
- ✅ Telegram ينشر كل الجديد
- ✅ محتوى AI احترافي
- ✅ لا تدخل يدوي!

## 🧪 اختبار النظام

### اختبار Worker:
```bash
curl "https://your-worker.animepulse.workers.dev/auto-pilot?secret=animepulse-cron-secret-2024"
```

### اختبار API:
```bash
curl "https://your-worker.animepulse.workers.dev/news"
```

### عرض السجلات:
```bash
wrangler tail
```

## 🛠️ استكشاف الأخطاء

### "Unauthorized":
- تأكد من إضافة `?secret=...` صحيح

### "KV Error":
- تأكد من ربط KV namespace في wrangler.toml

### "Telegram Failed":
- تأكد من صحة TOKEN
- تأكد أن البوت عضو في القناة

### "Gemini Failed":
- يستخدم fallback تلقائياً
- محتوى يتولد بدون AI

## 💰 التكلفة (Cloudflare Free Tier)

| Service | Limit | استخدامك |
|---------|-------|----------|
| Worker requests | 100,000/day | ✅ كافي |
| KV reads | 100,000/day | ✅ كافي |
| KV writes | 1,000/day | ✅ كافي |
| Cron triggers | 1 per minute | ✅ كافي |

**المجاني يكفي تماماً!**

## ✅ ملخص الخطوات النهائية

1. ✅ إنشاء KV Namespace
2. ✅ تعديل wrangler.toml
3. ✅ `wrangler deploy`
4. ✅ بناء الموقع `npm run build`
5. ✅ رفع الموقع لـ Pages
6. ✅ اختبار الـ Worker

هل تبي أبدأ التنفيذ الآن؟
