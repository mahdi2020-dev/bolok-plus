# بلوک پلاس · `bolok_plus`

سایت استاتیک رسمی **[bolokapp.ir](https://bolokapp.ir)** — لایهٔ وب اکوسیستم بلوک.

بدون فریم‌ورک و بدون بیلد. فقط HTML · CSS · JS. دادهٔ زنده از API بک‌اند لیارا (`iraniplanner.ir` / اپ `backendpy`).

| | |
|---|---|
| **دامنه** | [bolokapp.ir](https://bolokapp.ir) (`CNAME`) |
| **API** | `https://iraniplanner.ir` |
| **پشتیبانی** | sanjaporg@gmail.com |
| **فونت** | Vazirmatn FD خودمیزبان (`assets/fonts/vazirmatn-fd/`) — ارقام فارسی |
| **اینماد** | کد پیگیری `5130850` → باید `https://bolokapp.ir/5130850.txt` باز شود |
| **PWA meta** | `site.webmanifest` · theme خانه `#f4f4f0` |

> **دیپلوی را خودت بزن.** ایجنت `liara deploy` / آپلود استاتیک اجرا نمی‌کند.  
> بعد از تغییر بک‌اند یا مایگریشن، خودت `backendpy` را دیپلوی کن.  
> `README.md` و `_*.py` با `.liaraignore` روی هاست نمی‌روند — فقط برای توسعه‌دهنده است.

---

## نیچ محصول

محور رشد و پیام‌رسانی سایت (کپی خانه، CTA، کاتالوگ، جزوه‌سرا):

1. **تیزهوشان · ششم → هفتم**
2. **تیزهوشان · نهم → دهم**

کنکور سراسری، ارشد، بدون‌آزمون، مشاوره تحصیلی/روانشناسی **حذف نیستند**؛ ولی اولویت برند و مخاطب روی دو گذر تیزهوشان است.

---

## این پوشه چیست؟

`bolok_plus` ریشهٔ هاست استاتیک است (نه ریشهٔ مونوریپو). روی لیارا با `liara.json` (`platform: static`) و در صورت نیاز Cloudflare Pages سرو می‌شود.

```text
bolok_plus/
├── index.html                 خانه · هیرو برند · شوت‌های اپ · هاب آموزشی · FAQ · اینماد
├── styles.css · app.js        اسکلت کل سایت (هدر v36، Smart Sticky، GSAP، دراور)
├── site-api.js                API_BASE + نشست + vault چندحسابه + آپلود با پیشرفت
├── catalog-menu.js            پنل کشویی بانک منابع از هدر
├── download-menu.js           پنل دانلود اپ (بازار / مایکت)
├── comments.js                نظرات صفحات آموزشی
├── page.html · page-render.js رندر صفحات CMS از API (بلوک‌های محتوا)
├── search.html                جستجوی مطالب (+ search-index.json)
├── about / terms / privacy    حقوقی
├── 404.html
├── education/                 ~۱۱۶ مقاله/هاب آموزشی
├── resources/                 بانک منابع کمک‌درسی (کاتالوگ ادمین)
├── jomhehsara/                فروشگاه و انتشار جزوه
├── assets/                    لوگو، فونت، showcase اپ، vendor (pdf.js)
├── scripts/                   sync-resources-sitemap.ps1
├── liara.json                 اپ استاتیک لیارا
├── liara_nginx.conf           کش ۷روزه · HSTS · CSP
├── robots.txt · sitemap*.xml · llms.txt
└── .well-known/security.txt
```

اسکریپت‌های `_*.py` فقط ژنراتور/پچ لوکال‌اند — روی سرور اجرا نمی‌شوند و جزو سایت زنده نیستند.

---

## نقشهٔ محصول (چهار ستون)

| ستون | مسیر | نقش |
|------|------|-----|
| **خانه و برند** | `/` | هیرو «بلوک»، دانلود اپ، اسلایدر ۷ شات اپ، مطالب، چرا بلوک، FAQ |
| **مطالب آموزشی** | `/education/` | کنکور · مشاوره · ارشد · بدون‌آزمون · مشاوره تحصیلی/روانشناسی |
| **بانک منابع** | `/resources/` | کاتالوگ منتشرشدهٔ ادمین؛ فیلتر نوع، جزئیات، مقایسه |
| **جزوه‌سرا** | `/jomhehsara/` | فروشگاه جزوه، ثبت، خرید، مطالعه، کیف پول، داشبورد نویسنده |

صفحات حقوقی: `about.html` · `terms.html` · `privacy.html` · `404.html`  
جستجو: `search.html` (+ `search-index.json`)  
صفحهٔ پویا: `page.html` (محتوای CMS از بک‌اند)

---

## خانه · `index.html`

ترکیب یک‌صفحه‌ای برند (نه داشبورد):

| سکشن | محتوا |
|------|--------|
| **Hero** | لوگوی بلوک · تیتر برند · «خداحافظ روش‌های قدیمی…» · CTA دانلود / جزوه‌سرا / مشاوره |
| **Showcase** | ۷ شات واقعی اپ (`assets/showcase/`) با کپی اسلاید و کنترل‌ها |
| **مطالب** | کارت‌های کنکور ۱۴۰۵ + فوکوس تیزهوشان |
| **چرا بلوک** | بنتوی اپ + جزوه‌سرا + مشاوره |
| **FAQ** | پرسش‌های پرتکرار (+ JSON-LD `FAQPage`) |
| **فوتر** | لینک‌ها · اینماد · تماس |

اسکیما در `<head>`: `Organization` · `SoftwareApplication` · `WebSite` (+ `SearchAction`).

شات‌های اپ:

| فایل | موضوع |
|------|--------|
| `01-menu.png` | منوی برنامه‌ریزی |
| `02-advanced-plan.png` | بلوک‌ساز پیشرفته |
| `03-always-improving.png` | همیشه در حال بهبود |
| `04-mini-builder.png` | مینی بلوک‌ساز |
| `05-smart-recover.png` | جبران هوشمند ثبت ناقص |
| `06-stats.png` | آمار و نمودار |
| `07-timer.png` | کرنومتر / ثبت انجام |

---

## UX و رفتارهای مهم سایت

### هدر هوشمند (Smart Sticky) — `site-header--v36`

- اسکرول پایین → هدر دسکتاپ نرم مخفی (`0.3s`)
- اسکرول بالا → بلافاصله برمی‌گردد
- حالت Sticky: glass (`backdrop-filter`) + compact
- موبایل: هدر کامل مخفی نمی‌شود؛ جستجو و پروفایل همیشه در دسترس‌اند
- لینک **جزوه‌سرا** در ناو دسکتاپ و دراور تزریق می‌شود (`app.js`)
- آیکن حساب سایت → ورود جزوه‌سرا یا داشبورد (`data-site-account`)
- فایل‌ها: `styles.css` · `app.js`

### منوی موبایل

- دراور به `body` پورتال می‌شود تا `transform`/`filter` هدر آن را حبس نکند
- قفل اسکرول بدون پرش به بالای صفحه
- بعد از باز شدن، زیر هدر تمام‌صفحه پر می‌شود (`--site-header-offset`)

### موشن و پولیش

- **GSAP + ScrollTrigger** (CDN jsDelivr) برای `.reveal` / `.reveal-blur` — اگر لود نشود، محتوا مخفی نمی‌ماند
- نوار پیشرفت خواندن مقاله (`data-read-progress`)
- پنل **بانک منابع** و **دانلود اپ** از هدر (overlay)
- دکمه‌های مغناطیسی هیرو (`data-magnetic`)

### جزوه‌سرا (ظاهر Gumroad / neo-brutal)

- کپسول «روش جزوه‌سرا» + Lottie `gumhead` (`jomhehsara/assets/gumhead.json` + `vendor/lottie-player.js`)
- ابر درس‌ها: جریان دائمی ۳ ردیف، تگ گرد، آیکون‌های Discover از `jomhehsara/assets/discover/`
- پیش‌نمایش PDF: ورق‌خور با فلش RTL؛ بدون متن اضافه
- ثبت جزوه: خطای اعتبارسنجی → `navigator.vibrate` + بنر ثابت + اسکرول به فیلد

---

## دارایی مشترک

| فایل | نقش |
|------|-----|
| `styles.css` | اسکلت بصری کل سایت (به‌جز پوست اختصاصی جزوه‌سرا) |
| `app.js` | هدر v36، Smart Sticky، دراور، اکانت، GSAP، اسلایدر خانه |
| `site-api.js` | `window.BolokSite` — API، نشست، vault، PDF blob |
| `catalog-menu.js` | پنل بانک منابع از هدر |
| `download-menu.js` | پنل دانلود (بازار / مایکت + بج‌ها) |
| `comments.js` | نظرات روی صفحات education |
| `page-render.js` | رندر بلاک‌های CMS روی `page.html` |
| `assets/fonts/vazirmatn-fd.css` | فونت محلی |
| `assets/vendor/pdfjs/` | پیش‌نمایش PDF در ثبت جزوه |
| `assets/showcase/` | شات‌های معرفی اپ |

### `window.BolokSite` (`site-api.js`)

| عضو | کار |
|-----|-----|
| `API_BASE` | `https://iraniplanner.ir` |
| `api` / `apiForm` / `apiFormProgress` | fetch JSON / فرم / آپلود با progress |
| `getSiteSession` / `setSiteSession` | توکن در `localStorage` → `bolok_site_session` |
| `listVault` / `upsertVaultAccount` / … | تا **۵ حساب** موازی (`bolok_site_account_vault`) |
| `rememberAuth` | بعد از OTP/پسورد، vault را به‌روز می‌کند |
| `pdfUrl` / `fetchPdfBlob` / `fetchPdfBytes` | پیش‌نمایش امن PDF |

### کش‌باست (`?v=`)

عدد واحد برای کل سایت نیست. بعد از هر تغییر CSS/JS، `?v=` همان صفحه‌هایی که فایل را لود می‌کنند را **بالا ببر**؛ وگرنه مرورگر نسخهٔ قبلی را می‌کشد (مخصوصاً با `expires 7d` روی لیارا).

نمونهٔ فعلی (ممکن است صفحه به صفحه کمی فرق کند):

| سطح | نمونه |
|-----|--------|
| خانه | `styles.css?v=83` · `app.js?v=81` · `site-api.js?v=22` |
| بانک منابع | `styles.css?v=80` · `app.js?v=80` · `resources.js?v=71` |
| جزوه‌سرا | `jomhehsara.css?v=112` · `jomhehsara.js?v=112` · `site-api.js?v=26` · `lottie-player.js?v=2` |

---

## مطالب آموزشی · `education/`

حدود **۱۱۶** صفحهٔ HTML.

| مسیر | محتوا | حجم تقریبی |
|------|--------|------------|
| `education/index.html` | ورودی هاب | — |
| `education/konkour/` | کنکور سراسری ۱۴۰۵ (ثبت‌نام، انتخاب رشته، کارنامه، تغییرات، راد مدیو، …) | ~۲۰ ریشه |
| `education/konkour/moshavere/` | مشاوره کنکور | ~۴۴ |
| `education/konkour/arshad/` | کارشناسی ارشد | ~۲۲ |
| `education/konkour/gheyr-entefaee/` | پذیرش بدون آزمون / شهریه | ~۲۵ |
| `education/konkour/maghalat.html` | فهرست مقالات کامل‌تر | — |
| `education/consult/` | هاب مشاوره | — |
| `education/consult/academic/` | مشاوره تحصیلی | — |
| `education/consult/psychology/` | مشاوره روانشناسی | — |

قواعد محتوا:

- مقالهٔ خالی یا خیلی نازک حذف / ریتارگت می‌شود
- تاریخ و عدد رسمی را **داخل خود مقاله** بنویس، نه به‌صورت نوت سراسری فوتر
- منبع قطعی زمان‌بندی: [سازمان سنجش](https://www.sanjesh.org)
- نظرات صفحه با `comments.js` → API سایت

---

## بانک منابع · `resources/`

- لیست/فیلتر: `resources/index.html` + صفحات نوع
- جزئیات: `resources/item.html?id=<catalog_id>`
- داده از `/api/site/catalog/…` (کاتالوگ منتشرشدهٔ ادمین)
- اسکرول بی‌نهایت + فیلتر درس (`?lesson=`)

| صفحه | `kind` |
|------|--------|
| `book.html` | `book` |
| `video.html` | `video` |
| `flashcards.html` | `flashcards` |
| `official_textbook.html` | `official_textbook` |
| `platform.html` | `platform` |
| `professor_notes.html` | `professor_notes` |
| `reference.html` | `reference` |
| `self_exam.html` | `self_exam` |
| `exam_analysis.html` | `exam_analysis` |

در صفحهٔ منبع: شناسنامه، کاور، گالری، نمونه PDF، امتیاز/رادار، فصل‌ها، برنامهٔ مطالعه (اولویت صفحه، بعد تست)، مقایسهٔ دو منبع، باند پایه/هدف آزمون.

متا را در **بلوک ادمین → محتوا → منابع → شناسنامه** پر کن.  
قبل از دیپلوی سایت، در صورت نیاز:

```powershell
pwsh ./scripts/sync-resources-sitemap.ps1
```

این اسکریپت از `/api/site/catalog/sitemap.xml` می‌گیرد؛ اگر نبود، با pagination `catalog/search` فایل `sitemap-resources.xml` را می‌سازد.

---

## جزوه‌سرا · `jomhehsara/`

پایلوت فعلی: **پیراپزشکی · علوم پزشکی شهید بهشتی**، با پیام تیزهوشان روی خانهٔ فروشگاه.

UI جدا: `jomhehsara.css` + `jomhehsara.js` روی همان فونت و `site-api.js`.

| صفحه | کار |
|------|-----|
| `index.html` | فروشگاه · جستجو · فیلتر · ابر درس · روش جزوه‌سرا |
| `item.html` | خرید جزوه · نظرات · پیش‌نمایش ورق‌خور · گزارش |
| `read.html` | مطالعه بعد از خرید |
| `login.html` | ورود OTP / رمز عبور · تکمیل پروفایل |
| `account.html` | داشبورد نویسنده/خریدار (تب overview و …) |
| `submit.html` | ثبت سه‌مرحله‌ای |
| `mine.html` | مدیریت جزوه‌های من (ریدایرکت/داشبورد) |
| `wallet.html` | کیف پول و تسویه |
| `guide.html` | راهنمای انتشار (متن از API) |
| `learn.html` | آموزش صفحه‌آرایی (Word / Nitro PDF) |
| `verify.html` | استعلام گواهی انتشار |
| `payment.html` | بازگشت پرداخت |

### ثبت جزوه (۳ مرحله)

1. **اطلاعات** — رشته، درس، توضیح محتوا، ترم/سال، …
2. **عنوان و فایل** — PDF اجباری؛ Word و پاسخنامه اختیاری؛ کاور؛ نوار آپلود + پیش‌نمایش صفحهٔ اول
3. **تعهد و ارسال**

سهم فروش پولی: **نویسنده ۸۰٪ / پلتفرم ۲۰٪**. ثبت برای داوری رایگان است. خرید خدمات آماده‌سازی = تأیید انتشار نیست.

متن سیاست/راهنما در بک‌اند (`pamphlet_taxonomy.py`، `pamphlet_marketplace_api.py`). تا `backendpy` دیپلوی نشود، `guide.html` ممکن است متن قدیمی نشان دهد.

تصاویر آموزش: فقط از `jomhehsara/guide/learn/*.webp` (و در صورت نیاز `.png`).

### احراز هویت سایت

- OTP موبایل: `request-otp` → `verify-otp` → اختیاری `set-password`
- ورود با رمز: `login-password`
- تکمیل پروفایل: `complete-profile`
- بازیابی نشست: `restore-session`
- قفل ورود بعد از تلاش ناموفق **سمت بک‌اند** است
- چندحسابی: vault تا ۵ توکن در مرورگر

### API جزوه‌سرا (خلاصه)

**عمومی**

- `GET /api/site/pamphlets/meta`
- `GET /api/site/pamphlets`
- `GET /api/site/pamphlets/item/{id}`
- نظرات · خرید · دانلود · گزارش

**نویسنده** (هدر `X-Bolok-Site-Session`)

- `POST/PATCH /api/site/pamphlets/mine`
- `POST …/upload` — `file_role`: `original` | `editable` | `answer`
- `POST …/cover` · attachments · `submit` · `confirm-publish` · `approve-final`
- کتابخانه · کیف پول · تسویه (`wallet/payout`) · گواهی · سفارش خدمات آماده‌سازی

**ادمین:** `/api/admin/pamphlets/…`

---

## سئو، ربات‌ها، اعتماد

| فایل | نقش |
|------|-----|
| `robots.txt` | Allow عمومی · Disallow `_*.py` و `_deploy_proof` · سه Sitemap |
| `sitemap.xml` | صفحات ثابت + education |
| `sitemap.txt` | نسخهٔ متنی |
| `sitemap-resources.xml` | آیتم‌های کاتالوگ (از اسکریپت sync) |
| `llms.txt` | خلاصهٔ برند برای مدل‌های زبانی |
| `.well-known/security.txt` | تماس امنیتی · انقضا ۲۰۲۷ |
| `5130850.txt` | اینماد |
| متاتگ `enamad` | در `index.html` |

بعد از هر دیپلوی سایت چک کن: `https://bolokapp.ir/5130850.txt`

`liara_nginx.conf`: دارایی‌ها ۷ روز immutable · HTML ~۵ دقیقه · CSP محدود به self + `iraniplanner.ir` + jsDelivr (GSAP) + اینماد · HSTS preload.

---

## بک‌اند وابسته

سایت استاتیک است؛ این قابلیت‌ها فقط بعد از دیپلوی `backendpy` + مایگریشن **Postgres لیارا** زنده می‌شوند:

- کاتالوگ و سئوی منبع
- جستجوی سایت / صفحات CMS (`page.html`)
- ورود سایت، OTP، lockout، vault سمت کلاینت
- جزوه‌سرا، نظرات، کیف پول، گواهی
- متن راهنمای انتشار
- نظرات education (`comments.js`)

`DATABASE_URL` را از env لیارا بگیر. Postgres لوکال اولویت ندارد مگر صریحاً بخواهی.

```text
مرورگر (bolokapp.ir)
        │  HTTPS
        ▼
  فایل‌های استاتیک لیارا / CF Pages
        │  fetch JSON / PDF
        ▼
  backendpy · iraniplanner.ir
        │
        ▼
  Postgres لیارا · Object Storage
```

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

اگر فونت، pdf.js، `discover/*.svg`، `gumhead.json`، Lottie یا `showcase/` عوض شده، حتماً `assets/` و `jomhehsara/assets/` را هم بفرست.

**لیارا Static**

- `liara.json` → `"platform": "static"`, `"app": "static"`
- `liara_nginx.conf` برای کش و هدرهای امنیتی/CSP

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

## لینک‌های داخل اپ / ادمین

پایه: `https://bolokapp.ir`

| کاربرد | مسیر |
|--------|------|
| حقوقی | `/terms.html` · `/privacy.html` · `/about.html` |
| منابع | `/resources/` · `/resources/item.html?id=…` |
| جزوه‌سرا | `/jomhehsara/` |
| آموزش | `/education/` · `/education/konkour/` |
| جستجو | `/search.html?q=…` |
| دانلود | `/#download` |
| اینماد | `/5130850.txt` |

---

## چک‌لیست قبل از دیپلوی سایت

- [ ] `?v=` برای CSS/JS تغییرکرده bump شده (خانه / منابع / جزوه‌سرا جداگانه)
- [ ] مقاله/لینک شکسته در education و خانه نیست
- [ ] `assets/` و `jomhehsara/assets/` کامل‌اند (فونت، showcase، discover، gumhead، pdfjs، learn/*.webp)
- [ ] `5130850.txt` در ریشه هست و از دامنه باز می‌شود
- [ ] اگر کاتالوگ عوض شده: `scripts/sync-resources-sitemap.ps1` اجرا شده
- [ ] اگر API عوض شده: `backendpy` جدا دیپلوی + مایگریشن لیارا
- [ ] CSP/`liara_nginx.conf` هنوز با CDNهای استفاده‌شده (مثلاً GSAP روی jsDelivr) سازگار است

---

## اسناد مرتبط (مونوریپو)

| سند | محتوا |
|-----|--------|
| [`../README.md`](../README.md) | نمای کلی اکوسیستم بلوک |
| [`../frontend/README.md`](../frontend/README.md) | اپ کاربر Flutter |
| [`../backend/README.md`](../backend/README.md) | FastAPI · لیارا · مایگریشن · جزوه‌سرا API |
| [`../frontendadmin/README.md`](../frontendadmin/README.md) | پنل ادمین · کاتالوگ منابع |
| [`../packages/bolok_planner_models/`](../packages/bolok_planner_models/) | kind منابع و متای مشترک |
