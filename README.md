# بلوک پلاس · bolok_plus

سایت استاتیک موبایل‌اول برای معرفی اپ **بلوک**، اینماد و اتصال بعدی به WebView داخل اپ.

- دامنه هدف: [bolokapp.ir](https://bolokapp.ir)
- پشتیبانی: support@bolok.ir
- بدون بیلد: فقط HTML / CSS / JS

## فایل‌ها

| فایل | نقش |
|------|-----|
| `index.html` | لندینگ + اسلایدر + فوتر اینماد |
| `about.html` | درباره |
| `terms.html` | شرایط استفاده |
| `privacy.html` | حریم خصوصی |
| `styles.css` / `app.js` | ظاهر و اسلایدر |
| `assets/` | لوگو و favicon |

## پیش‌نمایش لوکال

فایل `index.html` را در مرورگر باز کنید، یا از ریشهٔ همین پوشه:

```powershell
cd bolok_plus
npx --yes serve .
```

## دیپلوی Cloudflare Pages

1. به [Cloudflare Dashboard → Workers & Pages → Create](https://dash.cloudflare.com) بروید.
2. **Upload your static files** را بزنید.
3. کل محتویات پوشهٔ `bolok_plus` را آپلود کنید (نه پوشهٔ والد مونوریپو).
4. نام پروژه مثلاً `bolok-plus`.
5. دامنهٔ سفارشی `bolokapp.ir` را به همین پروژه وصل کنید (DNS روی Cloudflare).

یا با Git: ریپو را Connect کنید و **Root directory** را `bolok_plus` بگذارید؛ Build command خالی، Output directory `.` یا خالی.

## اینماد — احراز دسترسی فنی دامنه

کد پیگیری: `5130850`

### روش فایل (پیشنهادی)

فایل خالی [`5130850.txt`](5130850.txt) در ریشهٔ همین پوشه است.
بعد از دیپلوی باید این آدرس باز شود:

`https://bolokapp.ir/5130850.txt`

سپس در پنل اینماد روی **تایید بارگذاری** بزنید.

### روش متاتگ (پشتیبان)

در `index.html` این تگ اضافه شده:

```html
<meta name="enamad" content="5130850" />
```

در پنل می‌توانید **تایید متاتگ** را هم بزنید.

### بعد از تأیید دامنه

کد/تصویر بج اینماد را داخل `#enamad` در `index.html` قرار دهید.
اطلاعات کسب‌وکار (نام، آدرس، تلفن) را در فوتر همان صفحه تکمیل کنید.

## WebView در اپ (بعداً)

آدرس پایه: `https://bolokapp.ir`  
صفحات حقوقی: `/terms.html` · `/privacy.html` · `/about.html`
