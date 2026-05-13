# AnimePulse Auto-Pilot System

## 🤖 ما هو نظام Auto-Pilot؟

نظام يعمل تلقائياً لـ:
1. 📡 **جلب أخبار الأنمي** من RSS sources
2. ✨ **توليد محتوى AI** باستخدام Gemini / Groq
3. 💬 **نشر على Discord** تلقائياً عبر Webhook
4. 🔄 **تحديث الموقع** بأخبار جديدة

## 📁 الملفات الأساسية

| الملف | الوصف |
|-------|-------|
| `lib/rssParser.ts` | جلب الأخبار من مصادر RSS |
| `lib/gemini.ts` | توليد محتوى AI بـ Gemini |
| `lib/articleGenerator.ts` | توليد المقالات (Groq + Gemini) |
| `app/api/autopilot/route.ts` | API endpoint للـ Auto-Pilot |
| `worker.ts` | Cloudflare Worker للـ Cron |

## 🚀 تشغيل Auto-Pilot

### عبر API (POST):
```bash
curl -X POST https://animepulse.online/api/autopilot \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

### فحص الحالة (GET):
```bash
curl https://animepulse.online/api/autopilot
```

## ⏰ جدولة تلقائية (Cron Job)

### Cloudflare Workers Cron (مستحسن):

في `wrangler.toml`:
```toml
[triggers]
crons = ["0 */6 * * *"]  # كل 6 ساعات
```

### Cron تقليدي (Linux/Mac):

```bash
# فتح crontab
crontab -e

# كل 6 ساعات:
0 */6 * * * curl -X POST https://animepulse.online/api/autopilot -H "x-cron-secret: YOUR_SECRET" >> /var/log/animepulse.log 2>&1
```

### جداول أخرى:

```bash
# كل ساعة
0 * * * *

# مرتين يومياً (6ص و6م)
0 6,18 * * *

# مرة واحدة يومياً
0 9 * * *

# كل 3 ساعات
0 */3 * * *
```

## 📊 ما يفعله النظام

### 1. جلب الأخبار (RSS)
المصادر المستخدمة:
- Anime News Network (credibility: 30)
- Crunchyroll News (credibility: 28)
- MyAnimeList News (credibility: 25)
- Otaku USA (credibility: 22)

### 2. توليد AI
- يُولّد مقالات كاملة بأسلوب "AnimePulse Voice"
- يستخدم **Groq** (أسرع) ثم **Gemini** كـ fallback
- نقاط الجودة: يُنشر فقط ما يتجاوز `PUBLISH_THRESHOLD`

### 3. نشر Discord
- Rich embeds مع صورة المقال
- رابط مباشر للمقال
- تحديثات Trending يومية

### 4. حفظ البيانات
- **Firebase Firestore** – حفظ المقالات (mode: `draft`)
- **Cloudflare KV** – cache للـ Worker

## 🔧 التخصيص

### تغيير مصادر RSS:

في `app/api/autopilot/route.ts`:

```typescript
const RSS_SOURCES = [
  { name: 'Your Source', url: 'https://example.com/feed.xml', credibility: 20 },
  // أضف مصادرك هنا
];
```

### تغيير عدد الأخبار اليومية:

في `lib/scoring.ts`:

```typescript
export const MAX_DAILY_ARTICLES = 10; // غيّر الرقم
export const PUBLISH_THRESHOLD  = 55; // حد الجودة الأدنى
```

### تخصيص Discord Webhook:

في `.env.local`:
```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN
```

## 📋 متطلبات الـ API

### Gemini API:
- من: https://aistudio.google.com
- `.env.local`: `GEMINI_API_KEY=AIza...`

### Groq API (أسرع وأرخص):
- من: https://console.groq.com
- `.env.local`: `GROQ_API_KEY=gsk_...`

### Discord Webhook (اختياري):
- Discord Server → Settings → Integrations → Webhooks → New Webhook
- `.env.local`: `DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...`

## ⚠️ ملاحظات مهمة

### مراقبة السجلات:
- لوحة Admin: `/admin` (triple-click على الشعار)
- API Status: `GET /api/autopilot`

### مشاكل شائعة:

1. **"Cannot find module"**: تأكد من `npm install`
2. **"No Gemini/Groq API key"**: لن يتوقف، يستخدم fallback بسيط
3. **"Discord webhook failed"**: يتجاهل ويكمل
4. **"Daily limit reached"**: عدّل `MAX_DAILY_ARTICLES` في `lib/scoring.ts`

## 🎉 النتيجة

بعد التشغيل:
- ✅ موقعك يتحدث محتواه تلقائياً
- ✅ Discord ينشر أخبار بـ Rich Embeds
- ✅ محتوى AI احترافي بأسلوب AnimePulse
- ✅ نظام تسجيل دقيق (draft → review → publish)
- ✅ لا حاجة لتدخل يدوي!

---

هل تبي تشغل الـ Auto-Pilot يدوياً؟ جرب: `POST /api/autopilot`
