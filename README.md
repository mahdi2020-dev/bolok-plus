# بلوک پلاس · bolok_plus

سایت استاتیک موبایل‌اول برای معرفی اپ **بلوک**، بانک منابع عمومی، اینماد و اتصال بعدی به WebView داخل اپ.

- دامنه هدف: [bolokapp.ir](https://bolokapp.ir)
- پشتیبانی: sanjaporg@gmail.com
- بدون بیلد: فقط HTML / CSS / JS
- API داده: [`iraniplanner.ir`](https://iraniplanner.ir) (`/api/site/catalog/…`)

**نیچ محصول:** تیزهوشان — تمرکز پیام و اولویت محتوا روی گذر **ششم → هفتم** و **نهم → دهم**.

## فایل‌ها

| مسیر | نقش |
|------|-----|
| `index.html` | لندینگ + اسلایدر + فوتر اینماد |
| `about.html` / `terms.html` / `privacy.html` | صفحات حقوقی |
| `resources/` | هاب و صفحهٔ جزئیات منبع (CSR) |
| `resources/item.html` + `resources.js` | صفحهٔ اولیا/دانش‌آموز — حکم، فصل‌ها، گالری، FAQ/JSON-LD، سئو |
| `styles.css` / `app.js` | ظاهر، هدر v36، دراور موبایل، اسلایدر |
| `download-menu.js` | منوی دانلود + بج بازار/مایکت |
| `_header_catalog_v36.py` | قالب هدر مشترک + پچ HTML (`?v=` کش‌باست) |
| `assets/` | لوگو و favicon |

کش‌باست فعلی دارایی‌ها: **`?v=54`**. صفحهٔ منبع: نمرات به‌صورت از ۱۰/٪، حکم بلوک، تگ‌های فیلترشده، نقشهٔ راه با پاسخنامه.

## بانک منابع (وب)

- لیست/فیلتر: `resources/index.html` و kind-صفحات
- جزئیات: `resources/item.html?id=<catalog_id>`
- داده از ادمین (`source_catalog` منتشرشده) از طریق `site_catalog_api`:
  - `authors` · `isbn` · `editorial_verdict` · `seo_*`
  - `chapters_public` (ترجیح جمع تست گفتارها برای `test_count`)
  - `book_meta` · `review` · گالری / کاور / نمونه PDF
- متا را در **بلوک ادمین → محتوا → منابع → شناسنامه کتاب** پر کن؛ منوی ⋮ «صفحه روی سایت» همان URL را باز می‌کند.

## هدر موبایل (≤۹۰۰px)

یک ردیف: برند | جستجو+دانلود | همبرگر · دراور تمام‌قد با backdrop و قفل اسکرول · تلفن/درباره فقط داخل دراور. دسکتاپ (≥۹۰۱) عمداً جداست.

## پیش‌نمایش لوکال

```powershell
cd bolok_plus
npx --yes serve .
```

## دیپلوی

دیپلوی را خودت انجام بده — ایجنت دیپلوی نمی‌کند.

1. کل محتویات پوشهٔ `bolok_plus` را روی هاست استاتیک (مثلاً Cloudflare Pages / لیارا استاتیک) آپلود کن.
2. اگر فیلد/API بک‌اند عوض شده، `backendpy` را جدا با `deploy-liara.ps1` دیپلوی کن.

### Cloudflare Pages (نمونه)

1. [Workers & Pages → Create](https://dash.cloudflare.com) → **Upload your static files**
2. محتویات `bolok_plus` را آپلود کن (نه ریشهٔ مونوریپو)
3. دامنهٔ `bolokapp.ir` را وصل کن

یا با Git: Root directory = `bolok_plus`؛ Build خالی.

## اینماد — احراز دسترسی فنی دامنه

کد پیگیری: `5130850`

### روش فایل (پیشنهادی)

فایل خالی [`5130850.txt`](5130850.txt) در ریشهٔ همین پوشه است.
بعد از دیپلوی باید این آدرس باز شود:

`https://bolokapp.ir/5130850.txt`

سپس در پنل اینماد روی **تایید بارگذاری** بزنید.

### روش متاتگ (پشتیبان)

در `index.html`:

```html
<meta name="enamad" content="5130850" />
```

### بعد از تأیید دامنه

بج اینماد داخل `#enamad` و دراور موبایل قرار دارد؛ اطلاعات کسب‌وکار را در فوتر تکمیل کنید.

## WebView در اپ (بعداً)

آدرس پایه: `https://bolokapp.ir`  
صفحات حقوقی: `/terms.html` · `/privacy.html` · `/about.html`  
بانک منابع: `/resources/`
