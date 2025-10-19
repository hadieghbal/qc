// =============================
//  Service Worker - QC v10
// =============================

const CACHE_NAME = "qc v9"; // نسخه جدید برای فعال‌سازی آپدیت
const BASE_PATH = "/qc";    // مسیر پایه پروژه

const FILES_TO_CACHE = [
  // --- فایل‌های اصلی ---
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/bom/bom-data.json`,

  // --- اسکریپت‌ها ---
  `${BASE_PATH}/js/main.js`,
  `${BASE_PATH}/js/data.js`,
  `${BASE_PATH}/js/utils/store.js`,
  `${BASE_PATH}/assets/libs/pdfmake.min.js`,
  `${BASE_PATH}/assets/libs/vfs_fonts.js`,
  `${BASE_PATH}/assets/libs/choices.min.js`,
  `${BASE_PATH}/assets/libs/html2canvas.min.js`,
  `${BASE_PATH}/assets/libs/jdp.min.js`,
  `${BASE_PATH}/assets/libs/sweetalert2.all.min.js`,
  `${BASE_PATH}/assets/libs/toastify.js`,

  // ✅ مسیر جدید برای چک‌لیست تزریق
  `${BASE_PATH}/features/home/forms/checklists/checklist-injection/checklist-injection-data.js`,
  `${BASE_PATH}/features/home/forms/checklists/checklist-injection/checklist-injection.js`,
  `${BASE_PATH}/features/home/forms/checklists/checklist-injection/checklist-injection.css`,
  `${BASE_PATH}/features/home/forms/checklists/checklist-injection/checklist-injection.html`,

  // سایر فیچرها
  `${BASE_PATH}/features/home/charts/org-chart/org-chart-data.js`,
  `${BASE_PATH}/features/home/charts/org-chart/org-chart.js`,
  `${BASE_PATH}/features/home/charts/personnel-form/personnel-form.js`,
  `${BASE_PATH}/features/home/forms/scrap-form/scrap-form-data.js`,
  `${BASE_PATH}/features/home/forms/scrap-form/scrap-form.js`,
  `${BASE_PATH}/features/home/forms/line-quality/line-quality-data.js`,
  `${BASE_PATH}/features/home/forms/line-quality/line-quality.js`,
  `${BASE_PATH}/features/kham/kham.js`,

  // --- استایل‌ها ---
  `${BASE_PATH}/assets/css/shared.css`,
  `${BASE_PATH}/assets/css/bootstrap-icons.min.css`,
  `${BASE_PATH}/assets/libs/choices.min.css`,
  `${BASE_PATH}/assets/libs/jdp.min.css`,
  `${BASE_PATH}/assets/libs/toastify.min.css`,
  `${BASE_PATH}/features/home/charts/org-chart/org-chart.css`,
  `${BASE_PATH}/features/home/forms/scrap-form/scrap-form.css`,
  `${BASE_PATH}/features/home/forms/line-quality/line-quality.css`,
  `${BASE_PATH}/features/home/forms/checklists/checklist-injection/checklist-injection.css`,

  // --- صفحات HTML ---
  `${BASE_PATH}/features/home/home.html`,
  `${BASE_PATH}/features/home/forms/forms.html`,
  `${BASE_PATH}/features/home/forms/checklists/checklists.html`,
  `${BASE_PATH}/features/home/forms/scrap-form/scrap-form.html`,
  `${BASE_PATH}/features/home/forms/line-quality/line-quality.html`,
  `${BASE_PATH}/features/home/iso-docs/iso-docs.html`,
  `${BASE_PATH}/features/home/iso-docs/instruction/instruction.html`,
  `${BASE_PATH}/features/home/charts/org-chart/org-chart.html`,
  `${BASE_PATH}/features/non-conformity-form/non-conformity-form.html`,
  `${BASE_PATH}/features/home/charts/personnel-form/personnel-form.html`,
  `${BASE_PATH}/features/home/charts/charts.html`,

  // --- فونت‌ها ---
  `${BASE_PATH}/assets/fonts/bootstrap-icons.woff`,
  `${BASE_PATH}/assets/fonts/bootstrap-icons.woff2`,
  `${BASE_PATH}/assets/fonts/Vazirmatn-RD-Bold.woff2`,
  `${BASE_PATH}/assets/fonts/Vazirmatn-RD-Medium.woff2`,
  `${BASE_PATH}/assets/fonts/Vazirmatn-RD-Regular.woff2`,
  `${BASE_PATH}/assets/fonts/Vazirmatn-Bold.ttf`,
  `${BASE_PATH}/assets/fonts/Vazirmatn-Regular.ttf`,

  // --- تصاویر ---
  `${BASE_PATH}/assets/images/logo-192.png`,
  `${BASE_PATH}/assets/images/logo-512.png`,
];

// =============================
//  Install Event
// =============================
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Install");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Pre-caching files:", FILES_TO_CACHE.length);
      return cache.addAll(FILES_TO_CACHE);
    }).catch((err) => {
      console.error("[ServiceWorker] Failed to cache files:", err);
    })
  );

  self.skipWaiting();
});

// =============================
//  Activate Event
// =============================
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activate");

  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// =============================
//  Fetch Event
// =============================
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // مسیر فونت‌ها
        if (url.pathname.startsWith('/fonts/')) {
          const correctPath = `${BASE_PATH}/assets${url.pathname}`;
          return caches.match(correctPath, { ignoreSearch: true });
        }

        return fetch(event.request).catch(() => {
          return new Response(null, { status: 404, statusText: "Not Found" });
        });
      })
    );
  }
});
