# بلوک پلاس · `bolok_plus`

سایت استاتیک رسمی **[bolokapp.ir](https://bolokapp.ir)** — لایهٔ وب اکوسیستم بلوک.

بدون بیلد. فقط HTML · CSS · JS. دادهٔ زنده از API بک‌اند لیارا (`iraniplanner.ir` / اپ `backendpy`).

| | |
|---|---|
| **دامنه** | [bolokapp.ir](https://bolokapp.ir) |
| **API** | `https://iraniplanner.ir` |
| **پشتیبانی** | sanjaporg@gmail.com |
| **فونت** | Vazirmatn FD خودمیزبان (`assets/fonts/vazirmatn-fd/`) — ارقام فارسی |
| **اینماد** | کد پیگیری `5130850` → باید `https://bolokapp.ir/5130850.txt` باز شود |

> **دیپلوی را خودت بزن.** ایجنت `liara deploy` / آپلود استاتیک اجرا نمی‌کند. بعد از تغییر بک‌اند یا مایگریشن، خودت `backendpy` را دیپلوی کن.

---

## نیچ محصول

محور رشد و پیام‌رسانی سایت:

1. **تیزهوشان · ششم → هفتم**
2. **تیزهوشان · نهم → دهم**

کنکور سراسری، ارشد، بدون‌آزمون و بقیهٔ مطالب آموزشی **حذف نیستند**؛ ولی اولویت کپی، کاتالوگ، جزوه‌سرا و CTA روی این دو گذر است.

---

## این پوشه چیست؟

`bolok_plus` ریشهٔ هاست استاتیک است (نه ریشهٔ مونوریپو). روی لیارا با `liara.json` (`platform: static`) و در صورت نیاز Cloudflare Pages سرو می‌شود.

```
bolok_plus/
├── index.html              خانه · معرفی اپ · هاب آموزشی
├── styles.css · app.js     اسکلت کل سایت (هدر، منو، رفتار عمومی)
├── site-api.js             API_BASE + نشست سایت
├── education/              ~۱۱۶ مقاله/هاب آموزشی
├── resources/              بانک منابع کمک‌درسی (کاتالوگ ادمین)
├── jomhehsara/             فروشگاه و انتشار جزوه
├── assets/                 لوگو، فونت، vendor (pdf.js، …)
├── liara.json              اپ استاتیک لیارا
├── liara_nginx.conf        کش · هدر امنیتی · CSP
└── scripts/                ابزار کمکی (مثلاً sitemap منابع)
```

اسکریپت‌های `_*.py` فقط ژنراتور/پچ لوکال‌اند — روی سرور اجرا نمی‌شوند و جزو سایت زنده نیستند.

---

## نقشهٔ محصول (چهار ستون)

| ستون | مسیر | نقش |
|------|------|-----|
| **خانه و برند** | `/` | معرفی اپ، دانلود، Smart Sticky Header، CTA جزوه‌سرا و مطالب |
| **مطالب آموزشی** | `/education/` | کنکور · مشاوره · ارشد · بدون‌آزمون · مشاوره تحصیلی/روانشناسی |
| **بانک منابع** | `/resources/` | کاتالوگ منتشرشدهٔ ادمین؛ فیلتر نوع، جزئیات، مقایسه |
| **جزوه‌سرا** | `/jomhehsara/` | فروشگاه جزوه تیزهوشان/پیراپزشکی، ثبت، خرید، مطالعه، داشبورد نویسنده |

صفحات حقوقی: `about.html` · `terms.html` · `privacy.html` · `404.html`  
جستجو: `search.html` (+ `search-index.json`)

---

## UX و رفتارهای مهم سایت

### هدر هوشمند (Smart Sticky)

- اسکرول پایین → هدر دسکتاپ نرم مخفی می‌شود (`0.3s`)
- اسکرول بالا → بلافاصله برمی‌گردد
- حالت Sticky: glass (`backdrop-filter`) + compact
- موبایل: هدر کامل مخفی نمی‌شود؛ جستجو و پروفایل همیشه در دسترس‌اند
- فایل‌ها: `styles.css` · `app.js`

### منوی موبایل

- دراور به `body` پورتال می‌شود تا `transform`/`filter` هدر آن را حبس نکند
- قفل اسکرول بدون پرش به بالای صفحه
- بعد از باز شدن، زیر هدر تمام‌صفحه پر می‌شود

### جزوه‌سرا (ظاهر Gumroad / neo-brutal)

- کپسول «روش جزوه‌سرا» + Lottie `gumhead` (`assets/gumhead.json` + `assets/vendor/lottie-player.js`)
- ابر درس‌ها: جریان دائمی ۳ ردیف، تگ گرد، آیکون‌های Discover (مثل `education.svg`) از `jomhehsara/assets/discover/`
- پیش‌نمایش PDF: دکمه‌های قبل/بعد دایره‌ای فقط با فلش RTL؛ بدون متن اضافهٔ پیش‌نمایش
- ثبت جزوه: با خطای اعتبارسنجی → لرزش گوشی (`navigator.vibrate`) + بنر ثابت بالا + اسکرول به فیلد

---

## دارایی مشترک

| فایل | نقش |
|------|-----|
| `styles.css` | اسکلت بصری کل سایت (به‌جز پوست اختصاصی جزوه‌سرا) |
| `app.js` | هدر v36، Smart Sticky، دراور موبایل، اکانت هدر، رفتار عمومی |
| `site-api.js` | `API_BASE`، `bolok_site_session`، `api` / `apiForm` / پیشرفت آپلود |
| `catalog-menu.js` | پنل بانک منابع از هدر |
| `download-menu.js` | پنل دانلود اپ (بازار / مایکت) |
| `comments.js` | نظرات (در صورت اتصال صفحه) |
| `assets/fonts/vazirmatn-fd.css` | فونت محلی |
| `assets/vendor/pdfjs/` | پیش‌نمایش PDF در ثبت جزوه |

### کش‌باست (`?v=`)

عدد واحد برای کل سایت نیست. بعد از هر تغییر CSS/JS، `?v=` همان صفحه‌هایی که فایل را لود می‌کنند را **بالا ببر**؛ وگرنه مرورگر نسخهٔ قبلی را می‌کشد (مخصوصاً با `expires 7d` روی لیارا).

نمونهٔ فعلی (ممکن است صفحه به صفحه کمی فرق کند):

| سطح | نمونه |
|-----|--------|
| خانه | `styles.css?v=79` · `app.js?v=79` · `site-api.js?v=22` |
| بانک منابع | `styles.css?v=79` · `app.js?v=79` · `resources.js?v=71` |
| جزوه‌سرا | `jomhehsara.css?v=81` · `jomhehsara.js?v=81` · `lottie-player.js?v=2` |

---

## مطالب آموزشی · `education/`

| مسیر | محتوا |
|------|--------|
| `education/index.html` | ورودی هاب |
| `education/konkour/` | کنکور سراسری (ثبت‌نام، انتخاب رشته، کارنامه، تغییرات، …) |
| `education/konkour/moshavere/` | مشاوره کنکور (چند صفحه) |
| `education/konkour/arshad/` | کارشناسی ارشد |
| `education/konkour/gheyr-entefaee/` | پذیرش بدون آزمون / شهریه |
| `education/konkour/maghalat.html` | فهرست مقالات کامل‌تر |
| `education/consult/` | مشاوره تحصیلی و روانشناسی |

مقاله‌های خالی یا خیلی نازک حذف می‌شوند؛ لینک‌ها به صفحات کامل‌تر ریتارگت می‌شوند. تاریخ و عدد رسمی را **داخل خود مقاله** بنویس، نه به‌صورت نوت سراسری فوتر.

---

## بانک منابع · `resources/`

- لیست/فیلتر: `resources/index.html` و صفحات نوع (`book.html`، `video.html`، `flashcards.html`، `official_textbook.html`، …)
- جزئیات: `resources/item.html?id=<catalog_id>`
- داده از `/api/site/catalog/…` (کاتالوگ منتشرشدهٔ ادمین)

در صفحهٔ منبع: شناسنامه، کاور، گالری، نمونه PDF، امتیاز/رادار، فصل‌ها، برنامهٔ مطالعه (اولویت صفحه، بعد تست)، مقایسهٔ دو منبع.

متا را در **بلوک ادمین → محتوا → منابع → شناسنامه** پر کن.  
قبل از دیپلوی سایت، در صورت نیاز:

```powershell
pwsh ./scripts/sync-resources-sitemap.ps1
```

---

## جزوه‌سرا · `jomhehsara/`

پایلوت فعلی: **پیراپزشکی · علوم پزشکی شهید بهشتی**، با پیام تیزهوشان روی خانهٔ فروشگاه.

UI جدا: `jomhehsara.css` + `jomhehsara.js` روی همان فونت و `site-api.js`.

| صفحه | کار |
|------|-----|
| `index.html` | فروشگاه · جستجو · فیلتر · ابر درس · روش جزوه‌سرا |
| `item.html` | خرید جزوه · نظرات · پیش‌نمایش ورق‌خور |
| `read.html` | مطالعه بعد از خرید |
| `login.html` · `verify.html` | ورود با موبایل |
| `account.html` | داشبورد نویسنده/خریدار |
| `submit.html` | ثبت سه‌مرحله‌ای |
| `guide.html` | راهنمای انتشار (متن از API) |
| `learn.html` | آموزش صفحه‌آرایی |
| `payment.html` | بازگشت پرداخت |

### ثبت جزوه (۳ مرحله)

1. **اطلاعات** — رشته، درس، توضیح محتوا، ترم/سال، …
2. **عنوان و فایل** — PDF اجباری؛ Word و پاسخنامه اختیاری؛ نوار آپلود + پیش‌نمایش صفحهٔ اول
3. **تعهد و ارسال**

سهم فروش پولی: **نویسنده ۸۰٪ / پلتفرم ۲۰٪**. ثبت برای داوری رایگان است. خرید خدمات آماده‌سازی = تأیید انتشار نیست.

متن سیاست/راهنما در بک‌اند (`pamphlet_taxonomy.py`، `pamphlet_marketplace_api.py`). تا `backendpy` دیپلوی نشود، `guide.html` ممکن است متن قدیمی نشان دهد.

تصاویر آموزش: فقط از `jomhehsara/guide/learn/*.webp`.

### API جزوه‌سرا (خلاصه)

**عمومی**

- `GET /api/site/pamphlets/meta`
- `GET /api/site/pamphlets`
- `GET /api/site/pamphlets/item/{id}`
- نظرات · خرید · دانلود · گزارش

**نویسنده** (هدر `X-Bolok-Site-Session`)

- `POST/PATCH /api/site/pamphlets/mine`
- `POST /api/site/pamphlets/mine/{id}/upload` — `file_role`: `original` | `editable` | `answer`
- `POST …/submit`
- کتابخانه · کیف پول · تسویه · گواهی · تیکت

**ادمین:** `/api/admin/pamphlets/…`

نشست سایت: `localStorage` → کلید `bolok_site_session`.  
قفل ورود بعد از تلاش ناموفق سمت بک‌اند است.

---

## بک‌اند وابسته

سایت استاتیک است؛ این قابلیت‌ها فقط بعد از دیپلوی `backendpy` + مایگریشن **Postgres لیارا** زنده می‌شوند:

- کاتالوگ و سئوی منبع
- جستجوی سایت
- ورود سایت و lockout
- جزوه‌سرا، نظرات، کیف پول
- متن راهنمای انتشار

`DATABASE_URL` را از env لیارا بگیر. Postgres لوکال اولویت ندارد مگر صریحاً بخواهی.

---

## پیش‌نمایش لوکال

```powershell
cd bolok_plus
npx --yes serve .
```

API همچنان `iraniplanner.ir` است. برای دیدن API جدید، بک‌اند لیارا باید نسخهٔ جدید باشد.

---

## دیپلوی

دو کار جدا:

### ۱) سایت استاتیک (`bolok_plus`)

کل **محتویات** این پوشه را روی هاست استاتیک بگذار (ریشهٔ مونوریپو را آپلود نکن).

اگر فونت، pdf.js، `discover/*.svg`، `gumhead.json` یا Lottie عوض شده، حتماً پوشهٔ `assets/` و `jomhehsara/assets/` را هم بفرست.

**لیارا Static**

- `liara.json` → `"platform": "static"`
- در صورت استفاده: `liara_nginx.conf` برای کش ۷روزهٔ دارایی‌ها و هدرهای امنیتی/CSP

**Cloudflare Pages (اختیاری)**

1. Upload static files یا Git با Root = `bolok_plus`
2. Build command خالی
3. دامنهٔ `bolokapp.ir`

### ۲) API (`backendpy`)

اگر `backend/` عوض شده:

```powershell
# از ریشهٔ مونوریپو — خودت اجرا کن
.\deploy-liara.ps1
# یا: liara deploy
```

سپس مایگریشن‌های جدید را روی Postgres لیارا اجرا کن.

---

## اینماد و اعتماد

- فایل: `5130850.txt` در ریشهٔ استاتیک
- متاتگ پشتیبان در `index.html`: `<meta name="enamad" content="5130850" />`
- بعد از هر دیپلوی سایت چک کن: `https://bolokapp.ir/5130850.txt`

---

## لینک‌های داخل اپ / ادمین

پایه: `https://bolokapp.ir`

| کاربرد | مسیر |
|--------|------|
| حقوقی | `/terms.html` · `/privacy.html` · `/about.html` |
| منابع | `/resources/` |
| جزوه‌سرا | `/jomhehsara/` |
| آموزش | `/education/` |
| جستجو | `/search.html` |

---

## چک‌لیست قبل از دیپلوی سایت

- [ ] `?v=` برای CSS/JS تغییرکرده bump شده
- [ ] مقاله/لینک شکسته در education و خانه نیست
- [ ] `assets/` و `jomhehsara/assets/` کامل‌اند (فونت، discover، gumhead، pdfjs)
- [ ] `5130850.txt` در ریشه هست
- [ ] اگر کاتالوگ عوض شده: sitemap منابع sync شده
- [ ] اگر API عوض شده: `backendpy` جدا دیپلوی + مایگریشن لیارا

---

## اسناد مرتبط (مونوریپو)

| سند | محتوا |
|-----|--------|
| [`../README.md`](../README.md) | نمای کلی اکوسیستم بلوک |
| [`../frontend/README.md`](../frontend/README.md) | اپ کاربر Flutter |
| [`../backend/README.md`](../backend/README.md) | FastAPI · لیارا · مایگریشن |
| [`../frontendadmin/README.md`](../frontendadmin/README.md) | پنل ادمین · کاتالوگ منابع |
