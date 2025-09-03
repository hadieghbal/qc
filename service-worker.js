// service-worker.js (نسخه نهایی و صحیح)

const CACHE_NAME = "qc-app-cache-v6"; //

const FILES_TO_CACHE = [
  "./",
  "index.html",
  "manifest.json",

  // --- Scripts ---
  "js/main.js",
  "js/data.js",
  "js/utils/store.js",
  "assets/libs/pdfmake.min.js",
  "assets/libs/vfs_fonts.js",
  "assets/libs/choices.min.js",
  "assets/libs/html2canvas.min.js",
  "assets/libs/jdp.min.js",
  "assets/libs/sweetalert2.all.min.js",
  "assets/libs/toastify.js",
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
  "assets/fonts/Vazirmatn-Bold.ttf",
  "assets/fonts/Vazirmatn-Regular.ttf",

  // --- Images ---
  "assets/images/logo-192.png",
  "assets/images/logo-512.png",
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

// ==========================================================
// ✨✨✨ این بخش اصلاح شده است ✨✨✨
// ==========================================================
self.addEventListener("fetch", (event) => {
  event.respondWith(
    // به match میگوییم که query string ها را نادیده بگیرد
    caches.match(event.request, { ignoreSearch: true }).then((response) => {
      // اگر فایل در کش بود، آن را برگردان. در غیر این صورت، از اینترنت بگیر.
      return response || fetch(event.request);
    })
  );
});