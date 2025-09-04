// service-worker.js (نسخه نهایی و کاملاً صحیح)

const CACHE_NAME = "qc-app v6"; // نسخه را برای فعال‌سازی به‌روزرسانی افزایش دهید

const FILES_TO_CACHE = [
  "/qc/",
  "/qc/index.html",
  "/qc/manifest.json",

  // --- Scripts ---
  "/qc/js/main.js",
  "/qc/js/data.js",
  "/qc/js/utils/store.js",
  "/qc/assets/libs/pdfmake.min.js",
  "/qc/assets/libs/vfs_fonts.js",
  "/qc/assets/libs/choices.min.js",
  "/qc/assets/libs/html2canvas.min.js",
  "/qc/assets/libs/jdp.min.js",
  "/qc/assets/libs/sweetalert2.all.min.js",
  "/qc/assets/libs/toastify.js",
  "/qc/features/checklist-injection/checklist-injection-data.js",
  "/qc/features/checklist-injection/checklist-injection.js",
  "/qc/features/org-chart/org-chart-data.js",
  "/qc/features/org-chart/org-chart.js",
  "/qc/features/personnel-form/personnel-form.js",
  "/qc/features/scrap-form/scrap-form-data.js",
  "/qc/features/scrap-form/scrap-form.js",
  "/qc/features/kham/kham.js",

  // --- Stylesheets ---
  "/qc/assets/css/shared.css",
  "/qc/assets/css/bootstrap-icons.min.css",
  "/qc/assets/libs/choices.min.css",
  "/qc/assets/libs/jdp.min.css",
  "/qc/assets/libs/toastify.min.css",
  "/qc/features/checklist-injection/checklist-injection.css",
  "/qc/features/org-chart/org-chart.css",
  "/qc/features/scrap-form/scrap-form.css",

  // --- Pages (HTML Fragments) ---
  "/qc/features/home/home.html",
  "/qc/features/forms/forms.html",
  "/qc/features/checklists/checklists.html",
  "/qc/features/scrap-form/scrap-form.html",
  "/qc/features/checklist-injection/checklist-injection.html",
  "/qc/features/iso-docs/iso-docs.html",
  "/qc/features/instruction/instruction.html",
  "/qc/features/org-chart/org-chart.html",
  "/qc/features/non-conformity-form/non-conformity-form.html",
  "/qc/features/personnel-form/personnel-form.html",
  "/qc/features/charts/charts.html",

  // --- Fonts ---
  "/qc/assets/fonts/bootstrap-icons.woff",
  "/qc/assets/fonts/bootstrap-icons.woff2",
  "/qc/assets/fonts/Vazirmatn-RD-Bold.woff2",
  "/qc/assets/fonts/Vazirmatn-RD-Medium.woff2",
  "/qc/assets/fonts/Vazirmatn-RD-Regular.woff2",
  "/qc/assets/fonts/Vazirmatn-Bold.ttf",
  "/qc/assets/fonts/Vazirmatn-Regular.ttf",

  // --- Images ---
  "/qc/assets/images/logo-192.png",
  "/qc/assets/images/logo-512.png",
];

self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Install");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Pre-caching offline page");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activate");
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
  self.clients.claim();
});

// =====> کل این تابع با نسخه نهایی و صحیح جایگزین شده است <=====
self.addEventListener("fetch", (event) => {
  // استراتژی "Cache first, falling back to network"
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      // اگر پاسخ در کش وجود داشت، همان را برگردان
      if (cachedResponse) {
        return cachedResponse;
      }

      // اگر در کش نبود، تلاش کن از شبکه دریافت کنی
      return fetch(event.request).catch(() => {
        // اگر درخواست شبکه هم شکست خورد (آفلاین بودیم)،
        // یک پاسخ خطای استاندارد برمی‌گردانیم تا از کرش کردن برنامه جلوگیری شود.
        // این کار خطای "Failed to convert value to 'Response'" و "Failed to fetch" را حل می‌کند.
        return new Response(null, {
          status: 404,
          statusText: "Not Found",
        });
      });
    })
  );
});