# بلوک پلاس · bolok_plus

سایت استاتیک **bolokapp.ir**: معرفی اپ بلوک، مطالب آموزشی، بانک منابع کمک‌درسی، و فروشگاه جزوه (جزوه‌سرا). بدون بیلد؛ فقط HTML، CSS و JS. داده از API بک‌اند می‌آید.

- دامنه: [bolokapp.ir](https://bolokapp.ir)
- API: `https://iraniplanner.ir` (اپ لیارا `backendpy`)
- پشتیبانی: sanjaporg@gmail.com
- فونت: Vazirmatn FD خودمیزبان در `assets/fonts/vazirmatn-fd/` (ارقام فارسی)

**نیچ محصول:** تیزهوشان، با اولویت پیام و محتوا روی گذر **ششم → هفتم** و **نهم → دهم**. کنکور و امتحان‌های دیگر روی سایت هستند، ولی محور رشد این دو گذر است.

دیپلوی را خودت انجام بده. ایجنت آپلود یا `liara deploy` نمی‌زند.

## نقشه سایت

| مسیر | کار |
|------|-----|
| `index.html` | خانه: معرفی، اسلایدر، مطالب آموزشی، دانلود اپ |
| `search.html` | جستجوی سایت |
| `about.html` · `terms.html` · `privacy.html` | درباره و صفحات حقوقی |
| `404.html` | صفحه پیدا نشد |
| `education/` | هاب آموزشی و مقاله‌های کنکور / مشاوره |
| `resources/` | بانک منابع کمک‌درسی (داده از کاتالوگ ادمین) |
| `jomhehsara/` | جزوه‌سرا: فروش، انتشار، داشبورد نویسنده |
| `page.html` | صفحات داینامیک CMS در صورت استفاده |
| `5130850.txt` | فایل احراز اینماد |

اسکریپت‌های `_*.py` داخل همین پوشه ژنراتور و پچ HTML هستند. روی سرور اجرا نمی‌شوند و جزو سایت زنده نیستند.

## دارایی مشترک

| فایل | نقش |
|------|-----|
| `styles.css` | ظاهر کل سایت به‌جز استایل اختصاصی جزوه‌سرا |
| `app.js` | هدر، دراور، اسلایدر خانه، رفتار عمومی |
| `site-api.js` | `API_BASE`، نشست سایت، `api` / `apiForm` / پیشرفت آپلود |
| `catalog-menu.js` | منوی کاتالوگ |
| `download-menu.js` | پنل دانلود بازار / مایکت |
| `comments.js` | کامنت صفحات در صورت لینک شدن |
| `assets/fonts/vazirmatn-fd.css` | فونت محلی؛ جایگزین Google Fonts |
| `assets/vendor/pdfjs/` | pdf.js برای پیش‌نمایش صفحه اول PDF در ثبت جزوه |

کش‌باست با `?v=` روی هر صفحه است و یک عدد واحد برای کل سایت نیست. بعد از تغییر CSS/JS همان صفحه‌هایی که آن فایل را لود می‌کنند را بالا ببر، وگرنه مرورگر نسخهٔ قبلی را نشان می‌دهد.

نمونهٔ فعلی (همهٔ صفحات یکی نیستند):

- خانه: `styles.css?v=64` · `app.js?v=63` · `site-api.js?v=22`
- بانک منابع: `styles.css?v=66` · `resources.js?v=71`
- جزوه‌سرا: `jomhehsara.css?v=24` · `jomhehsara.js?v=25` · فونت `?v=1`

## مطالب آموزشی

زیر `education/`:

- `education/index.html` — ورودی مطالب
- `education/konkour/` — کنکور سراسری (ثبت‌نام، انتخاب رشته، کارنامه، …)
- `education/konkour/moshavere/` — مشاوره
- `education/konkour/arshad/` — ارشد
- `education/konkour/gheyr-entefaee/` — پذیرش بدون آزمون / شهریه
- `education/consult/` — مشاوره تحصیلی و روانشناسی

مقاله‌ها HTML استاتیک‌اند. فوتر دیگر جملهٔ «تاریخ‌های رسمی را از سنجش چک کنید» را ندارد. تاریخ رسمی را داخل خود مقاله بنویس، نه به‌صورت نوت سراسری فوتر.

## بانک منابع

لیست و فیلتر: `resources/index.html` و صفحه‌های نوع منبع (`book.html`، `video.html`، `flashcards.html`، `official_textbook.html`، …).

جزئیات: `resources/item.html?id=<catalog_id>`

داده از کاتالوگ منتشرشدهٔ ادمین، از مسیر `/api/site/catalog/…`:

- شناسنامه، کاور، گالری، نمونه PDF
- امتیاز کیفیت، رادار، فصل‌ها
- برنامهٔ مطالعه: پیش‌فرض **بر اساس صفحه**، بعد بر اساس تست
- مقایسهٔ دو منبع: کارت برنده، برچسب «برتر» رنگی، دوئل معیارها
- بازگشت به بانک، لینک بالای صفحه است

متا را در **بلوک ادمین → محتوا → منابع → شناسنامه کتاب** پر کن.

## جزوه‌سرا

پایلوت دانشکده پیراپزشکی دانشگاه علوم پزشکی شهید بهشتی. UI جداست (`jomhehsara.css` + `jomhehsara.js`) و روی همان فونت و API سوار است.

| صفحه | کار |
|------|-----|
| `jomhehsara/index.html` | فروشگاه جزوه |
| `jomhehsara/item.html` | صفحهٔ خرید جزوه و نظرات |
| `jomhehsara/read.html` | مطالعه بعد از خرید |
| `jomhehsara/login.html` · `verify.html` | ورود با موبایل |
| `jomhehsara/account.html` | داشبورد: نمای کلی، کتابخانه، جزوه‌های من، سفارش آماده‌سازی، درآمد، گواهی، پشتیبانی، پروفایل، برگشت به صفحهٔ اصلی |
| `jomhehsara/submit.html` | ثبت سه‌مرحله‌ای |
| `jomhehsara/guide.html` | راهنمای انتشار (متن از API) |
| `jomhehsara/learn.html` | آموزش صفحه‌آرایی Word / Nitro |
| `jomhehsara/payment.html` | بازگشت پرداخت |

ثبت جزوه:

1. **اطلاعات** — رشته، درس، توضیح محتوا، سال (۱۳۹۰ تا ۱۴۳۰) و ترم (۱ تا ۸) به‌صورت انتخابی
2. **عنوان و فایل** — PDF اجباری، Word و پاسخنامه اختیاری؛ کارت فارسی، نوار درصد، سبز شدن روی ۱۰۰٪، پیش‌نمایش صفحهٔ اول PDF
3. **تعهد و ارسال**

سهم فروش پولی: نویسنده ۸۰٪، پلتفرم ۲۰٪. ثبت برای داوری رایگان است. خرید خدمات آماده‌سازی تأیید انتشار را تضمین نمی‌کند.

متن راهنما، سیاست انتشار، سلب مسئولیت سلامت و چک‌لیست‌ها در `backend/pamphlet_taxonomy.py` و `backend/pamphlet_marketplace_api.py` هستند. تا بک‌اند دیپلوی نشود، `guide.html` متن قدیمی API را نشان می‌دهد.

تصاویر آموزش فقط از `jomhehsara/guide/learn/*.webp` لود می‌شوند.

### API جزوه‌سرا (خلاصه)

عمومی و فروشگاه:

- `GET /api/site/pamphlets/meta`
- `GET /api/site/pamphlets`
- `GET /api/site/pamphlets/item/{id}`
- نظرات، خرید، دانلود، گزارش

نویسنده (هدر `X-Bolok-Site-Session`):

- `POST/PATCH /api/site/pamphlets/mine`
- `POST /api/site/pamphlets/mine/{id}/upload` با `file_role`: `original` | `editable` | `answer`
- `POST …/submit`
- کتابخانه، کیف پول، تسویه، گواهی، تیکت

ادمین: `/api/admin/pamphlets/…` (داوری، پیش‌فاکتور، گزارش، تسویه).

نشست سایت در `localStorage` با کلید `bolok_site_session` است. قفل ورود بعد از تلاش ناموفق در بک‌اند است (مایگریشن lockout).

## بک‌اندی که سایت به آن وصل است

سایت استاتیک است؛ این رفتارها فقط بعد از دیپلوی `backendpy` و مایگریشن Postgres لیارا زنده می‌شوند:

- کاتالوگ و سئوی منبع
- جستجو
- ورود سایت و محدودیت تلاش
- جزوه‌سرا، نظرات جزوه، کیف پول
- متن راهنمای انتشار

مایگریشن را روی دیتابیس لیارا بزن، نه Postgres لوکال. `DATABASE_URL` را از env لیارا بردار.

## پیش‌نمایش لوکال

```powershell
cd bolok_plus
npx --yes serve .
```

API همچنان `iraniplanner.ir` است. برای دیدن متن جدید راهنما یا قفل ورود، بک‌اند لیارا باید نسخهٔ جدید باشد.

## دیپلوی

دو کار جداست:

1. **سایت:** کل محتویات `bolok_plus` را روی هاست استاتیک بگذار (ریشهٔ مونوریپو را آپلود نکن). اگر فونت یا pdf.js عوض شده، `assets/fonts` و `assets/vendor/pdfjs` هم باید بروند.
2. **API:** اگر `backend/` عوض شده، خودت `backendpy` را با `deploy-liara.ps1` / `liara deploy` بفرست و مایگریشن‌های جدید را روی Postgres لیارا اجرا کن.

### Cloudflare Pages

1. Workers & Pages → Upload static files
2. محتویات `bolok_plus`
3. دامنهٔ `bolokapp.ir`

یا با Git: Root directory = `bolok_plus` و Build command خالی.

## اینماد

کد پیگیری: `5130850`

بعد از دیپلوی این آدرس باید باز شود:

`https://bolokapp.ir/5130850.txt`

متاتگ پشتیبان در `index.html`:

```html
<meta name="enamad" content="5130850" />
```

## داخل اپ

پایه: `https://bolokapp.ir`

- حقوقی: `/terms.html` · `/privacy.html` · `/about.html`
- منابع: `/resources/`
- جزوه‌سرا: `/jomhehsara/`
