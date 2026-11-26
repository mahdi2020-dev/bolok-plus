# بلوک پلاس · `bolok_plus`

سایت استاتیک رسمی **[bolokapp.ir](https://bolokapp.ir)** — لایهٔ وب اکوسیستم بلوک.

بدون فریم‌ورک و بدون بیلد. فقط HTML · CSS · JS. دادهٔ زنده از API بک‌اند لیارا (`iraniplanner.ir` / اپ `backendpy`).

| | |
|---|---|
| **دامنه** | [bolokapp.ir](https://bolokapp.ir) (`CNAME`) |
| **API** | `https://iraniplanner.ir` → failover `https://backendpy.liara.run` |
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
| `API_BASE` | پایهٔ فعال (getter) — ابتدا برند، در صورت قطع TLS → برگ لیارا |
| `BRAND_API` / `LIARA_LEAF_API` | `iraniplanner.ir` / `backendpy.liara.run` |
| `ensureReachable` / `usingLeafFailover` | پروب `/health` + سوئیچ خودکار مثل اپ/ادمین |
| `api` / `apiForm` / `apiFormProgress` | fetch JSON / فرم / آپلود با progress + یک‌بار retry بعد از failover |
| `getSiteSession` / `setSiteSession` | توکن در `localStorage` → `bolok_site_session` |
| `listVault` / `upsertVaultAccount` / … | تا **۵ حساب** موازی (`bolok_site_account_vault`) |
| `rememberAuth` | بعد از OTP/پسورد، vault را به‌روز می‌کند |
| `pdfUrl` / `fetchPdfBlob` / `fetchPdfBytes` | پیش‌نمایش امن PDF |

**اتصال سرور (مثل اپ و ادمین):** اگر دامنهٔ سفارشی `iraniplanner.ir` به‌خاطر TLS/SNI (`TLSV1_UNRECOGNIZED_NAME`) قطع باشد، کلاینت سایت بدون دخالت کاربر به `backendpy.liara.run` می‌رود. نتیجه در `sessionStorage` (`bolok_site_api_base_v1`) کش می‌شود. CSP در `liara_nginx.conf` از قبل هر دو host را در `connect-src` دارد. `comments.js` هم از `BolokSite.api` استفاده می‌کند.

### کش‌باست (`?v=`)

عدد واحد برای کل سایت نیست. بعد از هر تغییر CSS/JS، `?v=` همان صفحه‌هایی که فایل را لود می‌کنند را **بالا ببر**؛ وگرنه مرورگر نسخهٔ قبلی را می‌کشد (مخصوصاً با `expires 7d` روی لیارا).

نمونهٔ فعلی (ممکن است صفحه به صفحه کمی فرق کند):

| سطح | نمونه |
|-----|--------|
| خانه | `styles.css?v=83` · `app.js?v=81` · `site-api.js?v=27` |
| بانک منابع | `styles.css?v=80` · `app.js?v=80` · `resources.js?v=71` |
| جزوه‌سرا | `jomhehsara.css?v=112` · `jomhehsara.js?v=112` · `site-api.js?v=27` · `lottie-player.js?v=2` |

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

بازارچهٔ انتشار و فروش جزوهٔ دانشجویی روی سایت بلوک. فرانت استاتیک است؛ منطق، پول، داوری و فایل روی **`backendpy`** (`pamphlet_marketplace_api.py` + `pamphlet_taxonomy.py` + `pamphlet_pdf_utils.py`). پنل عملیات: ادمین Flutter → صفحهٔ جزوه‌سرا.

**پایلوت فعلی:** دانشکدهٔ **پیراپزشکی · دانشگاه علوم پزشکی شهید بهشتی**  
رشته‌ها: علوم آزمایشگاهی · رادیولوژی · رادیوتراپی (درس‌ها و سرفصل‌ها از taxonomy).  
پیام برند روی خانه: فروشگاه + درآمد دانشجو + **سفیر بلوک**؛ متای SEO همچنان تیزهوشان ششم→هفتم / نهم→دهم را هم هدف می‌گیرد.

UI جدا: `jomhehsara.css` + `jomhehsara.js` (+ Lottie) روی همان Vazirmatn و `site-api.js`. ظاهر نزدیک Gumroad / neo-brutal (صورتی `#FF90E8`، سایهٔ offset، استیکر).

---

### صفحات فرانت

| صفحه | کار |
|------|-----|
| `index.html` | هیرو · کارت‌های ارزش · ابر درس · روش جزوه‌سرا (Lottie) · فروشگاه با فیلتر |
| `item.html` | محصول: کاور، گرید کیفیت A–D، قیمت، پیش‌نمایش ورق‌خور، خرید، نظرات، گزارش |
| `read.html` | مطالعهٔ آنلاین PDF بعد از خرید (واترمارک خریدار) |
| `login.html` | OTP / رمز · تکمیل پروفایل · boot انیمیشنی |
| `account.html` | داشبورد تک‌صفحه با تب‌ها |
| `submit.html` | ثبت سه‌مرحله‌ای |
| `guide.html` | قوانین و فلو انتشار (از `meta.taxonomy.guide` / API) |
| `learn.html` | آموزش صفحه‌آرایی (curriculum JSON + تصاویر `guide/learn/*.webp`) |
| `verify.html` | استعلام گواهی با شماره سریال |
| `payment.html` | بازگشت از زرین‌پال (خرید جزوه یا خدمات آماده‌سازی) |
| `mine.html` | ریدایرکت → `account.html?tab=mine` |
| `wallet.html` | ریدایرکت → `account.html?tab=wallet` |

**تب‌های `account.html`:** overview · library · mine · services · certs · wallet · tickets · profile

---

### اقتصاد و سهم فروش (منبع حقیقت بک‌اند)

ثبت و ارسال برای داوری **رایگان** است (`publishing_fee_irt: 0`).  
**قیمت نهایی فروش را تیم داوری بلوک قفل می‌کند** (`price_locked`).

از هر فروش پولی:

| سهم | درصد | توضیح |
|-----|------|--------|
| نویسنده | **۴۰٪** | به کیف پول `site_accounts.wallet_balance_irt` |
| پلتفرم بلوک | **۴۰٪** | اگر سفیر معتبر نباشد، سهم سفیر هم به بلوک می‌رود |
| سفیر بلوک (معرف) | **۱۰٪** | فقط اگر `referred_by_id` نویسنده هنوز معتبر باشد (تا **۳۶۵ روز** از referral) |
| صندوق جوایز ماهانه | **۱۰٪** | همیشه کسر می‌شود |

جزوه با قیمت ۰ → `free_granted` بدون پرداخت.  
حداقل تسویه عادی: **۲۰۰٬۰۰۰ تومان** · کارمزد بانکی تسویه: **۵٬۰۰۰ تومان** · SLA واریز شبا: معمولاً ۱–۳ روز کاری.  
بستن حساب: `wallet/payout-closeout` حتی زیر حداقل (بعد از کسر کارمزد در صورت موجودی کافی).

> نسخهٔ قدیمی «۸۰٪ نویسنده / ۲۰٪ پلتفرم» **منسوخ** است؛ اعداد واقعی در `AUTHOR_SHARE_PCT` و هم‌خانواده‌اش در API/`meta` است.

---

### چرخهٔ وضعیت جزوه

```text
draft → pending_review ⇄ needs_revision
              ↓
     (اختیاری) pending_payment → in_preparation → awaiting_author_approval
              ↓
        ready_to_publish → published
              ↕
         suspended / stopped / rejected
```

| status | برچسب UI | کار بعدی نویسنده |
|--------|----------|------------------|
| `draft` | پیش‌نویس | تکمیل، آپلود، ارسال |
| `pending_review` | بررسی نشده / ویرایش‌شده | منتظر داور |
| `needs_revision` | پیام‌دار | اصلاح طبق چک‌لیست |
| `rejected` | حذف‌شده / رد | قابل انتشار نیست |
| `pending_payment` | ارجاع آماده‌سازی | پرداخت پیش‌فاکتور |
| `in_preparation` | ارجاع آماده‌سازی | تیم در حال کار |
| `awaiting_author_approval` | در انتظار تأیید نویسنده | `approve-final` |
| `ready_to_publish` | تأییدشده | `confirm-publish` |
| `published` | تأیید شده | در فروشگاه |
| `suspended` / `stopped` | غیرفعال | پشتیبانی |

قابل ویرایش/آپلود/حذف فقط در وضعیت‌های محدود (`draft` · `pending_review` · `needs_revision` · گاهی `pending_payment`).  
جزوهٔ منتشرشده را نویسنده خودش حذف نمی‌کند؛ توقف فروش از پشتیبانی/ادمین.

---

### ثبت جزوه (`submit.html` — ۳ مرحله)

1. **اطلاعات** — رشته پایلوت، درس (از `courses_by_major`)، سرفصل‌ها، نوع محتوا (`typed` / `handwritten`)، پوشش (`short`/`midterm`/`final`/`partial`/`full`)، سختی، ترم/سال، توضیح (≥۷۰ نویسه در submit)
2. **عنوان و فایل** — عنوان (پیشنهاد از `suggest-titles`) · PDF اصلی اجباری · کاور اجباری · Word/پاسخنامه اختیاری · پیوست audio/video/extra · رضایت‌نامه برای نشان طلایی (`consent`)
3. **تعهد و ارسال** — پذیرش حق نشر + disclaimer سلامت · `POST …/submit`

سقف آپلود فایل جزوه: **۱۰۰MB** · کاور: **۸MB**.  
نقش فایل آپلود: `original` | `editable` | `answer` | `consent`.

خدمات آماده‌سازی (ویراستاری/قالب) **اختیاری** است و شرط انتشار نیست؛ پرداخت بعد از پیش‌فاکتور ادمین از طریق زرین‌پال.

---

### خریدار: پیش‌نمایش، خرید، مطالعه، گزارش

**پیش‌نمایش رایگان** (`/preview`) فقط برای `published` — سقف صفحات:

| کل صفحات جزوه | صفحات رایگان |
|---------------|--------------|
| &lt; ۶ | ۱ |
| ۶–۱۰ | ۳ |
| ≥ ۱۱ | ۵ |

**خرید:** زرین‌پال (`live` / `sandbox` اگر مجاز) → callback → اعتبار کیف نویسنده/سفیر.  
اگر قبلاً خریده باشد → `already_owned`. نویسنده نیاز به خرید ندارد.

**دانلود / مطالعه آنلاین:** برای خریدار PDF با **واترمارک شماره موبایل** (و نام/توکن کپی)؛ نویسنده master خام می‌گیرد. Fail-closed: بدون واترمارک معتبر، فایل تمیز برنمی‌گردد.

**نظرات:** لیست/ثبت روی آیتم.  
**گزارش** (بعد از خرید): `duplicate` · `copyright` · `scientific` · `typo`.  
اگر ادمین تأیید کند: استرداد به خریدار + جریمهٔ **۱۰٪ قیمت** از کیف نویسنده + strike؛ بعد از **۲** تخلف معلق. نویسنده ۴۸ ساعت برای اصلاح/اعتراض (`fix` / `appeal`).

---

### کیف پول، سفیر، گواهی، تیکت

- **درآمد:** فروش جزوهٔ خود + سهم سفیری از فروش معرفی‌شده‌ها
- **تسویه:** شبا ۲۴رقمی معتبر + کد ملی ۱۰رقمی · رسید واریز ادمین
- **گواهی انتشار:** هنگام publish صادر می‌شود · عمومی: `verify.html` / `GET …/certificates/verify/{serial}` · لیست من: `certificates/me`
- **نشان طلایی:** رضایت‌نامه روی پرونده + تأیید ادمین (`golden_badge`)
- **امتیاز کیفیت:** A / B / C / D (توسط داور)
- **تیکت پشتیبانی:** `tickets` (+ پیام‌ها) برای نویسنده/خریدار و پاسخ ادمین

---

### احراز هویت سایت (مشترک با بقیهٔ سایت)

- OTP: `request-otp` → `verify-otp` → اختیاری `set-password`
- رمز: `login-password` · پروفایل: `complete-profile` · نشست: `restore-session`
- هدر: `X-Bolok-Site-Session` · `localStorage` کلید `bolok_site_session`
- vault تا **۵ حساب** موازی در مرورگر
- قفل ورود ناموفق سمت بک‌اند

---

### taxonomy پایلوت (خلاصه)

منبع: `backend/pamphlet_taxonomy.py` → داخل `GET /api/site/pamphlets/meta`.

- دانشگاه / دانشکده پیش‌فرض پایلوت
- `majors` + `courses_by_major` + `topics_by_course`
- چک‌لیست typed / handwritten · قوانین publish · نکات استاندارد · `learn_curriculum`
- برچسب‌های داوری: فنی · ویراستاری · علمی
- disclaimer سلامت (جزوه ≠ پروتکل درمان؛ بدون داده بیمار / سؤال افشاشده)

تصاویر آموزش صفحه‌آرایی: فقط `jomhehsara/guide/learn/*.webp` (+ در صورت نیاز `.png`). قالب نمونه: `guide/template-typed.rtf` · `guide/sample-outline.pdf`.

---

### API سایت (مرجع سریع)

**عمومی / نیمه‌عمومی**

| متد | مسیر |
|-----|------|
| GET | `/api/site/pamphlets/meta` |
| GET | `/api/site/pamphlets` — فیلتر `q, major, course, content_kind, priced, …` |
| GET | `/api/site/pamphlets/item/{id}` |
| GET | `/api/site/pamphlets/item/{id}/preview` |
| GET | `/api/site/pamphlets/item/{id}/comments` |
| POST | `/api/site/pamphlets/item/{id}/comments` |
| POST | `/api/site/pamphlets/item/{id}/purchase` |
| GET | `/api/site/pamphlets/item/{id}/read` · `/download` |
| POST | `/api/site/pamphlets/item/{id}/report` |
| GET | `/api/site/pamphlets/suggest-titles` |
| GET | `/api/site/pamphlets/certificates/verify/{serial}` |
| GET | `/api/site/pamphlets/payments/purchase/callback` · `…/service/callback` |

**نویسنده (نشست لازم)**

| متد | مسیر |
|-----|------|
| GET | `/mine/list` · `/library/me` · `/wallet/me` · `/certificates/me` · `/mine/reports` |
| POST/PATCH | `/mine` · `/mine/{id}` |
| POST | `/mine/{id}/upload` · `/cover` · `/attachments` · `/submit` |
| POST | `/mine/{id}/approve-final` · `/confirm-publish` |
| DELETE | `/mine/{id}` · `/mine/{id}/attachments/{att}` |
| POST | `/wallet/payout` · `/wallet/payout-closeout` |
| POST | `/service-orders/{id}/pay` |
| GET/POST | `/tickets` (+ messages) · گزارش `fix` / `appeal` |

**ادمین** (`/api/admin/pamphlets/…` — نقش‌های `site_manager` / `support_admin` / `pamphlet_editor`)

overview · list · sales · review (assign / needs_revision / reject / mark_ready / …) · quotes خدمات · upload-master · file · reports · payouts · tickets

---

### فایل‌های کلیدی مونوریپو

| مسیر | نقش |
|------|-----|
| `bolok_plus/jomhehsara/*` | UI استاتیک |
| `backend/pamphlet_marketplace_api.py` | تمام API بازارچه |
| `backend/pamphlet_taxonomy.py` | پایلوت، قوانین، curriculum |
| `backend/pamphlet_pdf_utils.py` | شمارش صفحه، preview، واترمارک |
| `backend/data/learn-curriculum.json` | متن learn سمت سرور |
| `frontendadmin/.../pamphlet_marketplace_admin_screen.dart` | عملیات داوری/فروش/تسویه |

تا `backendpy` دیپلوی + مایگریشن لیارا نرود، `guide`/`meta`/خرید/کیف ممکن است قدیمی یا قطع باشد.

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
