// service-worker.js

// مرحله ۱: نسخه کش را افزایش دهید تا سرویس‌ورکر جدید نصب شود
const CACHE_NAME = "qc-app-cache-v3"; // مثلا v2 را به v3 تغییر دهید

// مرحله ۲: لیست فایل‌ها را کامل کنید
const FILES_TO_CACHE = [
  "./",
  "index.html",
  "manifest.json",

  // --- Scripts ---
  "js/main.js",
  "js/data.js",
  "js/utils/store.js",
  // فایل‌های کتابخانه‌ای که فراموش شده بودند
  "assets/libs/pdfmake.min.js",
  "assets/libs/vfs_fonts.js",
  // سایر کتابخانه‌ها
  "assets/libs/choices.min.js",
  "assets/libs/html2canvas.min.js",
  "assets/libs/jdp.min.js",
  "assets/libs/sweetalert2.all.min.js",
  "assets/libs/toastify.js",
  // فایل‌های JS مربوط به هر بخش (feature) - بسیار مهم!
  "features/checklist-injection/checklist-injection-data.js",
  "features/checklist-injection/checklist-injection.js",
  "features/org-chart/org-chart-data.js",
  "features/org-chart/org-chart.js",
  "features/personnel-form/personnel-form.js",
  "features/scrap-form/scrap-form-data.js",
  "features/scrap-form/scrap-form.js",
  "features/kham/kham.js",

  // --- Stylesheets ---
  "assets/css/shared.css",
  "assets/css/bootstrap-icons.min.css",
  "assets/libs/choices.min.css",
  "assets/libs/jdp.min.css",
  "assets/libs/toastify.min.css",
  // استایل‌های مربوط به هر بخش
  "features/checklist-injection/checklist-injection.css",
  "features/org-chart/org-chart.css",
  "features/scrap-form/scrap-form.css",

  // --- Pages (HTML Fragments) ---
  "features/home/home.html",
  "features/forms/forms.html",
  "features/checklists/checklists.html",
  "features/scrap-form/scrap-form.html",
  "features/checklist-injection/checklist-injection.html",
  "features/iso-docs/iso-docs.html",
  "features/instruction/instruction.html",
  "features/org-chart/org-chart.html",
  "features/non-conformity-form/non-conformity-form.html",
  "features/personnel-form/personnel-form.html",
  "features/charts/charts.html",

  // --- Fonts ---
  "assets/fonts/bootstrap-icons.woff",
  "assets/fonts/bootstrap-icons.woff2",
  "assets/fonts/Vazirmatn-RD-Bold.woff2",
  "assets/fonts/Vazirmatn-RD-Medium.woff2",
  "assets/fonts/Vazirmatn-RD-Regular.woff2",
  // فونت‌های ttf را هم اضافه کنید اگر در CSS استفاده شده‌اند
  "assets/fonts/Vazirmatn-Bold.ttf",
  "assets/fonts/Vazirmatn-Regular.ttf",

  // --- Images ---
  "assets/images/logo-192.png",
  "assets/images/logo-512.png",
];

// رویداد 'install': وقتی سرویس‌ورکر برای اولین بار نصب می‌شود
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Install");
  // منتظر بمان تا تمام فایل‌ها در کش ذخیره شوند
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Pre-caching offline page");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  // سرویس‌ورکر جدید را فوراً فعال کن
  self.skipWaiting();
});

// رویداد 'activate': وقتی سرویس‌ورکر فعال می‌شود و کنترل صفحه را به دست می‌گیرد
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activate");
  // کش‌های قدیمی را پاک کن
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  // کنترل کامل صفحات را به دست بگیر
  self.clients.claim();
});

// رویداد 'fetch': هر بار که برنامه درخواستی برای یک فایل ارسال می‌کند
self.addEventListener("fetch", (event) => {
  // ما از استراتژی "اول کش، بعد اینترنت" استفاده می‌کنیم
  event.respondWith(
    caches.match(event.request).then((response) => {
      // اگر فایل در کش بود، آن را برگردان. در غیر این صورت، از اینترنت بگیر.
      return response || fetch(event.request);
    })
  );
});
