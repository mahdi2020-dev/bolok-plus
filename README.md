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
| جزوه‌سرا | `jomhehsara.css?v=129` · `jomhehsara.js?v=129` · `site-api.js?v=27` · `lottie-player.js?v=2` |

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
پیام برند روی خانه و **پیش‌نمایش اشتراک (Telegram/OG):** «دانشگاه علوم پزشکی شهید بهشتی · جهشی در آموزش» — نه متن تیزهوشان.  
فروشگاه + درآمد دانشجو + **سفیر بلوک**.

UI جدا: `jomhehsara.css` + `jomhehsara.js` (+ Lottie) روی همان Vazirmatn و `site-api.js`. ظاهر نزدیک Gumroad / neo-brutal (صورتی `#FF90E8`، سایهٔ offset، استیکر).

---

### صفحات فرانت

| صفحه | کار |
|------|-----|
| `index.html` | هیرو · کارت‌های ارزش · ابر درس · روش جزوه‌سرا (Lottie) · فروشگاه با فیلتر · OG/title بهشتی («جهشی در آموزش») |
| `item.html` | محصول: کاور، گرید کیفیت A–D، قیمت، پیش‌نمایش ورق‌خور، خرید، نظرات، گزارش |
| `read.html` | مطالعهٔ آنلاین PDF بعد از خرید (واترمارک خریدار) |
| `login.html` | OTP / رمز · تکمیل پروفایل · boot انیمیشنی |
| `account.html` | داشبورد تک‌صفحه با تب‌ها |
| `submit.html` | ثبت سه‌مرحله‌ای |
| `guide.html` | ریدایرکت → `learn.html` |
| `learn.html` | آموزش و راهنما و قوانین (curriculum JSON + تصاویر `guide/learn/*.webp`) |
| `verify.html` | استعلام گواهی با شماره سریال |
| `payment.html` | بازگشت از زرین‌پال (خرید جزوه یا خدمات آماده‌سازی) |
| `mine.html` | ریدایرکت → `account.html?tab=mine` |
| `wallet.html` | ریدایرکت → `account.html?tab=wallet` |

**تب‌های `account.html`:** overview · library · mine · services · certs · wallet · tickets · profile

---

### اقتصاد واحدی، پکیج و سهم فروش (منبع حقیقت بک‌اند)

ثبت و ارسال برای داوری **رایگان** است (`publishing_fee_irt: 0`).  
**واحد نهایی (و در نتیجه قیمت لیست) را تیم داوری بلوک قفل می‌کند** (`price_locked` + `unit_count`).

#### جدول قیمت جزوه (لیست)

| واحد (`unit_count`) | قیمت لیست (`price_irt`) |
|---------------------|-------------------------|
| ۱ | ۹۹٬۰۰۰ تومان |
| ۲ (پیش‌فرض دیتابیس) | ۱۹۹٬۰۰۰ تومان |
| ۳ | ۲۹۹٬۰۰۰ تومان |
| ۴ | ۳۹۹٬۰۰۰ تومان |
| رایگان | `price_irt = 0` (واحد همچنان ۱–۴ برای اندازه، بدون پرداخت) |

ثابت‌ها: `UNIT_TIER_PRICES_IRT` در [`backend/pamphlet_marketplace_api.py`](../backend/pamphlet_marketplace_api.py) · در `GET /api/site/pamphlets/meta` → `unit_pricing`.

#### پکیج واحد (شارژ کیف خریدار)

| SKU | واحد | قیمت | ارزش تقریبی هر واحد |
|-----|------|------|---------------------|
| `charge_99` | ۲ | ۹۹٬۰۰۰ | شارژ سریع |
| `charge_199` | ۴ | ۱۹۹٬۰۰۰ | شارژ سریع |
| `charge_399` | ۸ | ۳۹۹٬۰۰۰ | شارژ سریع |
| `charge_699` | ۱۴ | ۶۹۹٬۰۰۰ | شارژ سریع |
| `charge_999` | ۲۰ | ۹۹۹٬۰۰۰ | شارژ سریع |
| `units_6` | ۶ | ۲۹۹٬۰۰۰ (لیست ۶۰۰٬۰۰۰ · ۵۰٪ · پیشنهاد بلوک) | ≈ **۴۹٬۸۳۳** |
| `units_12` | ۱۲ | ۵۹۹٬۰۰۰ (لیست ۱٬۲۰۰٬۰۰۰ · ۵۰٪) | ≈ **۴۹٬۹۱۶** |

خرید پکیج: `POST /api/site/pamphlets/wallet/units/packages/{sku}/pay` → زرین‌پال → callback  
`/api/site/pamphlets/payments/units/callback` → `wallet_units` + `wallet_units_prepaid_irt`.

#### دو مسیر خرید جزوه

| مسیر | چگونه | پایهٔ پخش ۴۰/۱۰/۴۰/۱۰ |
|------|--------|-------------------------|
| **نقدی زرین‌پال** | `pay_with=zarinpal` (پیش‌فرض) | کل `price_irt` لیست (مثلاً ۲ واحدی = ۱۹۹٬۰۰۰) |
| **با واحد پکیج** | `pay_with=units` | `unit_count × (prepaid // wallet_units)` ≈ **۵۰ هزار × واحد** (مثلاً ۲ واحدی ≈ **۱۰۰٬۰۰۰**) |

مثال پکیج: خریدار ۶ واحد با ۲۹۹٬۰۰۰ می‌خرد؛ جزوهٔ ۲ واحدی را با واحد می‌پردازد → پایهٔ تسویه ≈۱۰۰ هزار → نویسنده ۴۰٪ · سایت ۴۰٪ · سفیر ۱۰٪ · هدیه/جوایز ۱۰٪ از همان پایه.

#### سهم فروش (همیشه)

| سهم | درصد | توضیح |
|-----|------|--------|
| نویسنده / فروشنده | **۴۰٪** | به `site_accounts.wallet_balance_irt` |
| پلتفرم بلوک (سایت) | **۴۰٪** | اگر سفیر معتبر نباشد، سهم سفیر هم به بلوک می‌رود |
| سفیر بلوک (معرف) | **۱۰٪** | فقط اگر `referred_by_id` نویسنده هنوز معتبر باشد (تا **۳۶۵ روز**) |
| هدیه / صندوق جوایز | **۱۰٪** | همیشه کسر؛ ledger `pamphlet_prize_fund_ledger` |

جزوه رایگان → `free_granted` بدون پرداخت.  
حداقل درآمد قابل تسویه: **۵۰۰٬۰۰۰ تومان** · کارمزد بانکی تسویه: **۵٬۰۰۰ تومان** · SLA شبا: معمولاً ۱–۳ روز کاری.  
بستن حساب: `wallet/payout-closeout` حتی زیر حداقل.

> نسخهٔ قدیمی «۸۰٪ نویسنده / ۲۰٪ پلتفرم» و قیمت آزاد تومانی **منسوخ** است.  
> پرمیوم اپ بلوک (VIP مایکت) از این مدل جداست؛ «پکیج واحد» جزوه‌سرا است.

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

### ثبت و انتشار جزوه (`submit.html` — راهنمای نویسنده)

#### سه مرحله

1. **اطلاعات** — رشته پایلوت، درس (از `courses_by_major`)، سرفصل‌ها، نوع محتوا (`typed` / `handwritten`)، پوشش (`short`/`midterm`/`final`/`partial`/`full`)، سختی، ترم/سال، توضیح محتویات
2. **عنوان و فایل** — عنوان (پیشنهاد از `suggest-titles`) · PDF اصلی اجباری · کاور اجباری · Word/پاسخنامه اختیاری · پیوست · رضایت‌نامه برای نشان طلایی (`consent`) · **واحد ۱–۴ یا رایگان** (قیمت از جدول لیست؛ نه تومان آزاد)
3. **تعهد و ارسال** — پذیرش حق نشر + disclaimer سلامت · `POST …/submit`

سقف آپلود فایل جزوه: **۱۰۰MB** · کاور: **۸MB**.  
نقش فایل آپلود: `original` | `editable` | `answer` | `consent`.

#### شیوهٔ انتشار (خلاصه)

```text
پیش‌نویس → ارسال بررسی → (اختیاری اصلاح) → داوری قفل واحد
        → آماده انتشار → تأیید نویسنده → منتشر در فروشگاه
```

- ارسال برای داوری **رایگان** است؛ هزینهٔ اولیه ندارد.
- واحد پیشنهادی نویسنده را داور می‌تواند عوض کند و قفل کند.
- خدمات آماده‌سازی (ویراستاری/قالب) **اختیاری** است؛ پرداخت پیش‌فاکتور با زرین‌پال.
- آموزش و راهنما و قوانین: `learn.html` (curriculum + قوانین مالی/موجودی قابل خرید). `guide.html` به همان صفحه ریدایرکت می‌شود.
- گواهی انتشار پس از publish · استعلام عمومی: `verify.html`.

---

### خریدار: پیش‌نمایش، خرید، مطالعه، گزارش

**پیش‌نمایش رایگان** (`/preview`) فقط برای `published` — سقف صفحات:

| کل صفحات جزوه | صفحات رایگان |
|---------------|--------------|
| &lt; ۶ | ۱ |
| ۶–۱۰ | ۳ |
| ≥ ۱۱ | ۵ |

**خرید جزوه** (`POST …/item/{id}/purchase`):

1. **زرین‌پال** — `pay_with=zarinpal` · مبلغ = قیمت لیست واحدی · callback `…/payments/purchase/callback` · صفحهٔ نتیجه `payment.html?kind=purchase`
2. **واحد کیف** — `pay_with=units` · کسر `unit_count` از `wallet_units` · تسویه از پایهٔ پکیج (~۵۰هزار/واحد) · بدون درگاه

اگر قبلاً خریده باشد → `already_owned`. نویسنده نیاز به خرید ندارد.  
UI آیتم: دکمهٔ زرین‌پال + در صورت موجودی کافی «پرداخت با N واحد»؛ وگرنه لینک شارژ پکیج.

**دانلود / مطالعه آنلاین:** PDF با **واترمارک موبایل**؛ fail-closed بدون واترمارک تمیز.

**نظرات خریداران:** فقط با خرید تأییدشده (یا `free_granted`) · درج با `pending` · انتشار عمومی پس از تأیید نویسنده · رد یا گزارش به ادمین از «جزوه‌های من».  
**گزارش تخلف جزوه** (`duplicate` / `copyright` / `scientific` / `typo`) · در صورت تأیید ادمین: استرداد + جریمهٔ ۱۰٪ + strike (۲ تخلف → معلق).

---

### کیف پول بالا، پکیج، سفیر، گواهی، تیکت

- **چیپ بالای همهٔ صفحات جزوه‌سرا:** موجودی تومان (درآمد قابل تسویه) + در صورت وجود، **تعداد واحد خرید** → لینک `account.html?tab=wallet`
- **هشدار VPN/DNS:** فقط وقتی API کشور غیر ایران را بشناسد، یا وقتی کشور نامشخص است و timezone غیر `Asia/Tehran` باشد. اگر API کشور را `IR`/`local` بگوید حتی با TZ اشتباه بنر **نمی‌آید** (قابل بستن تا پایان روز نشست)
- **نمای کلی · وضعیت امروز:** دو ستون «کتابخانه من» و «جزوه‌های من» با آخرین آیتم‌ها و وضعیت؛ دیگر متن «پرونده معلقی نداری» نیست
- **رفرال / سفیر:** در نمای کلی و مشخصات، **کد معرف + لینک ثبت‌نام** (`login.html?ref=CODE`) با کپی/ارسال. بازدید با `?ref=` یا `?referral=` کد را ذخیره می‌کند و هنگام تکمیل پروفایل خودکار اعمال می‌شود. سهم سفیر تا **۳۶۵ روز** از `referred_at` روی فروش جزوهٔ دعوت‌شده می‌ماند. در مشخصات، نام و نام‌خانوادگی سفیر برای دعوت‌شده نمایش داده می‌شود.
- **موجودی قابل خرید:** همیشه **واحد + معادل تومان**؛ کلیک → `account.html?tab=shop` (فروشگاه داخل داشبورد). شارژ/انتقال از دکمهٔ جدا یا `?buy=1`.
- **نمای کلی / درآمد:** کارت شارژ با `?buy=1` ورقهٔ انتقال/اشتراک را باز می‌کند:
  - **انتقال یک‌طرفه** از موجودی قابل تسویه → موجودی قابل خرید (`POST …/wallet/units/from-income`، `{ "units": 1..48 }`، نرخ `299000 // 6` = ۴۹٬۸۳۳ تومان/واحد)
  - **خرید اشتراک** — پکیج ۶ / ۱۲ با زرین‌پال (`POST …/wallet/units/packages/{sku}/pay`)
  - **قانون:** موجودی قابل خرید برگشت به درآمد نویسنده، تسویه شبا، یا نقد کردن ندارد؛ فقط مصرف در خرید جزوه (`pay_with=units`)
- **صفحهٔ جزوه:** اگر واحد کافی باشد CTA اصلی «خرید با موجودی قابل خرید» است؛ وگرنه لینک انتقال/اشتراک به `account.html?tab=overview&buy=1`
- **تب پنل مالی** (`account.html?tab=wallet`): از بالا به پایین
  1. **موجودی قابل خرید** (واحد)
  2. **شارژ حساب** — مبالغ سریع `۹۹٬۰۰۰ / ۱۹۹٬۰۰۰ / ۳۹۹٬۰۰۰ / ۶۹۹٬۰۰۰ / ۹۹۹٬۰۰۰` + پکیج ۶ و ۱۲
  3. **موجودی قابل تسویه** + نمودار درآمد + درخواست تسویه شبا (فقط از `wallet_balance_irt`)
- **نمودار منبع درآمد:** دونات دو‌رنگ (فروش / راه سفید) + کارت‌های درصد و نوار پیشرفت کنار هم
- **قفل درخواست تسویه:** تا وقتی `wallet_balance_irt` به حداقل **۵۰۰٬۰۰۰ تومان** نرسیده، فرم شبا/کدملی/مبلغ باز نمی‌شود؛ به‌جایش نوار پیشرفت تا آستانه نشان داده می‌شود
- **ورود (`login.html`):** عنوان «ورود به جزوات بلوک» · CTA «ورود با رمز عبور» + «ثبت نام یا ورود پیامکی» · بعد از تأیید OTP موبایل بالا و قفل · «بازگشت به فروشگاه» حفظ شده
- **پروفایل کاربری:** به‌جای «مشخصات» · موبایل طوسی قفل‌شده با توضیح «قابل ویرایش نیست»
- **فروشگاه عمومی (`index.html`):** برای مهمان؛ CTA هیرو «ورود به داشبورد»
- **داشبورد فروشگاه:** تب `account.html?tab=shop` با فیلتر و لیست جزوه داخل داشبورد (لینک زرد زیر برند)
- **انتشار:** واحد ۱–۴ و قیمت خودکار در **مرحلهٔ ۱**؛ کارت ناشناس
- **صفحهٔ جزوه:** پیش‌نمایش PDF مدرن‌تر · اشتراک تلگرام/واتساپ/**بله**/**ایتا**
- **نظرات:** خریدارمحور · `pending` تا تأیید نویسنده · رد / **حذف توسط صاحب جزوه** (pending و تأییدشده) / گزارش ادمین · عمومی فقط `approved` · مایگریشن `137`
- **عودت گزارش تخلف:** خرید با واحد → بازگردانی `wallet_units` (نه تومان قابل تسویه)؛ خرید زرین‌پال → اعتبار به `wallet_balance_irt`
- **درآمد نویسنده:** فروش جزوه + سهم سفیری
- **تسویه:** شبا ۲۴رقمی + کد ملی ۱۰رقمی · رسید ادمین · حداقل **۵۰۰٬۰۰۰** تومان
- **گواهی انتشار:** هنگام publish · `verify.html`
- **نشان طلایی / کیفیت A–D / تیکت پشتیبانی** مانند قبل

---

### زرین‌پال (جزوه‌سرا وب)

| مورد | مقدار / مسیر |
|------|----------------|
| فعال‌سازی | `ZARINPAL_ENABLED=true` + `ZARINPAL_MERCHANT_ID` روی لیارا |
| مرچنت لایو | `f540415c-70af-4aca-be65-b0884d4d6b09` · دامنهٔ درگاه **bolokapp.ir** |
| سندباکس | خاموش (`ZARINPAL_ALLOW_SANDBOX=false`) |
| خرید جزوه | بازگشت به `https://bolokapp.ir/jomhehsara/payment.html?kind=purchase` → `POST …/payments/purchase/confirm` |
| پکیج واحد | `…/payment.html?kind=units` → `POST …/payments/units/confirm` |
| خدمات آماده‌سازی | `…/payment.html?kind=service` → `POST …/payments/service/confirm` |
| دامنهٔ کالبک | **باید `bolokapp.ir` باشد** (همان دامنهٔ ثبت‌شده در پنل زرین‌پال) |

فرانت: `PAY_ENV = "live"`. اگر درگاه در پنل زرین‌پال «رد شده / غیرفعال» باشد، تا فعال‌سازی ترمینال تراکنش لایو ساخته نمی‌شود.

---

### احراز هویت سایت (مشترک با بقیهٔ سایت)

- صفحهٔ ورود: عنوان «ورود به جزوات بلوک» · مسیر رمز («ورود با رمز عبور») و مسیر پیامک («ثبت نام یا ورود پیامکی») · بازگشت به فروشگاه
- بعد از تأیید OTP، شماره موبایل در مراحل رمز و پروفایل فقط نمایش قفل‌شده است (غیرقابل ویرایش)
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
| GET | `/api/site/pamphlets/item/{id}/comments` — فقط `approved` |
| POST | `/api/site/pamphlets/item/{id}/comments` — فقط خریدار؛ وضعیت اولیه `pending` |
| GET | `/api/site/pamphlets/mine/{id}/comments` — صف تأیید نویسنده |
| POST | `/api/site/pamphlets/mine/{id}/comments/{cid}/approve` · `/reject` · `/report` |
| DELETE | `/api/site/pamphlets/mine/{id}/comments/{cid}` — حذف توسط نویسنده (هر وضعیت) |
| GET | `/api/admin/pamphlets/comments?report_status=reported` |
| POST | `/api/admin/pamphlets/comments/{id}` — `resolve` / `force_hide` / `restore` |
| POST | `/api/site/pamphlets/item/{id}/purchase` — body: `{ environment, pay_with: zarinpal\|units }` |
| GET | `/api/site/pamphlets/item/{id}/read` · `/download` |
| POST | `/api/site/pamphlets/item/{id}/report` |
| GET | `/api/site/pamphlets/suggest-titles` |
| GET | `/api/site/pamphlets/certificates/verify/{serial}` |
| GET | `/api/site/pamphlets/payments/purchase/callback` · `…/units/callback` · `…/service/callback` |

**نویسنده / کیف (نشست لازم)**

| متد | مسیر |
|-----|------|
| GET | `/api/site/network-advisory` — هشدار نرم VPN/کشور (بدون بلاک) |
| GET | `/mine/list` · `/library/me` · `/wallet/me` · `/certificates/me` · `/mine/reports` |
| POST/PATCH | `/mine` · `/mine/{id}` — فیلدهای `unit_count` · `is_free` · `price_irt` مشتق |
| POST | `/mine/{id}/upload` · `/cover` · `/attachments` · `/submit` |
| POST | `/mine/{id}/approve-final` · `/confirm-publish` |
| DELETE | `/mine/{id}` · `/mine/{id}/attachments/{att}` |
| POST | `/wallet/units/packages/{sku}/pay` — `charge_99`…`charge_999` · `units_6` · `units_12` |
| POST | `/wallet/units/from-income` — `{ "units": 1..48 }` انتقال یک‌طرفه از درآمد قابل تسویه به واحد خرید (برگشت/تسویه واحد ندارد) |
| POST | `/wallet/payout` · `/wallet/payout-closeout` |
| POST | `/service-orders/{id}/pay` |
| GET/POST | `/tickets` (+ messages) · گزارش `fix` / `appeal` |

**ادمین** (`/api/admin/pamphlets/…` — نقش‌های `site_manager` / `support_admin` / `pamphlet_editor`)

overview · list · sales · review (assign / needs_revision / reject / mark_ready / …) · quotes خدمات · upload-master · file · reports · payouts · tickets

---

### فایل‌های کلیدی مونوریپو

| مسیر | نقش |
|------|-----|
| `bolok_plus/jomhehsara/*` | UI استاتیک (قیمت واحدی، پکیج، چیپ کیف) |
| `backend/pamphlet_marketplace_api.py` | تمام API بازارچه + واحد/پکیج |
| `backend/migrations/136_pamphlet_unit_credits.sql` | `unit_count` · `wallet_units` · `pamphlet_unit_orders` · backfill ۲ واحد |
| `backend/pamphlet_taxonomy.py` | پایلوت، قوانین، curriculum |
| `backend/pamphlet_pdf_utils.py` | شمارش صفحه، preview، واترمارک |
| `backend/data/learn-curriculum.json` | متن learn سمت سرور |
| `frontendadmin/.../pamphlet_marketplace_admin_screen.dart` | داوری با انتخاب واحد ۱–۴ |

#### چک‌لیست دیپلوی (دستی توسط شما)

1. مایگریشن لیارا: `136_pamphlet_unit_credits.sql` + **`137_pamphlet_comment_moderation.sql`**
2. دیپلوی `backendpy` + استاتیک `bolok_plus` / jomhehsara + آپدیت ادمین (تب نظرات جزوه‌سرا)
3. تأیید env زرین‌پال و دامنهٔ کالبک
4. تست: خرید نقدی یک جزوهٔ ۲ واحدی · خرید پکیج ۶ · خرید همان جزوه با واحد · ثبت نظر خریدار → تأیید نویسنده → نمایش عمومی · گزارش نظر به ادمین

تا `backendpy` دیپلوی + مایگریشن لیارا نرود، `meta`/خرید واحد/کیف/نظرات ممکن است قدیمی یا قطع باشد.

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
