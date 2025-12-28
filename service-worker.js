const CACHE_NAME = "qc v17"; // ✅ تغییر نسخه جدید برای اطمینان از به‌روزرسانی کش (از v7 به v8)
const BASE_PATH = "/qc"; // مسیر پایه پروژه

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

  // فیچرها (مسیرها درست هستند)
  `${BASE_PATH}/features/home/forms/checklists/checklist-injection/checklist-injection-data.js`,
  `${BASE_PATH}/features/home/forms/checklists/checklist-injection/checklist-injection.js`,
  `${BASE_PATH}/features/home/forms/checklists/checklist-injection/checklist-injection.html`,

  // `${BASE_PATH}/features/home/charts/org-chart/org-chart-data.js`, // حذف شده
  // `${BASE_PATH}/features/home/charts/org-chart/org-chart.js`,     // حذف شده
  `${BASE_PATH}/features/home/charts/personnel-form/personnel-form.js`,
  `${BASE_PATH}/features/home/forms/scrap-form/scrap-form-data.js`,
  `${BASE_PATH}/features/home/forms/scrap-form/scrap-form.js`,

  // ✅ اضافه شده برای "کیفیت روزانه خطوط" (JS)
  `${BASE_PATH}/features/home/forms/line-quality/line-quality-data.js`,
  `${BASE_PATH}/features/home/forms/line-quality/line-quality.js`,

  // ✅ اضافه شده برای فایل kham.js
  `${BASE_PATH}/features/kham/kham.js`,

  // ✅ اضافه شده برای بخش آموزش (JS)
  `${BASE_PATH}/features/home/training/general/quizzes/group-a.js`,
  `${BASE_PATH}/features/home/training/general/quizzes/group-b.js`,
  `${BASE_PATH}/features/home/training/training.js`, // فایل training.js اصلی

  // --- استایل‌ها ---
  `${BASE_PATH}/assets/css/shared.css`,
  `${BASE_PATH}/assets/css/bootstrap-icons.min.css`,
  `${BASE_PATH}/assets/libs/choices.min.css`,
  `${BASE_PATH}/assets/libs/jdp.min.css`,
  `${BASE_PATH}/assets/libs/toastify.min.css`,
  `${BASE_PATH}/features/home/charts/org-chart/org-chart.css`, // این فایل با محتوای جدید کش خواهد شد
  `${BASE_PATH}/features/home/forms/scrap-form/scrap-form.css`,

  // ✅ اضافه شده برای "کیفیت روزانه خطوط" (CSS)
  `${BASE_PATH}/features/home/forms/line-quality/line-quality.css`,

  `${BASE_PATH}/features/home/forms/checklists/checklist-injection/checklist-injection.css`,

  // --- صفحات HTML ---
  `${BASE_PATH}/features/home/home.html`,
  `${BASE_PATH}/features/home/forms/forms.html`,
  `${BASE_PATH}/features/home/forms/checklists/checklists.html`,
  `${BASE_PATH}/features/home/forms/scrap-form/scrap-form.html`,

  // ✅ اضافه شده برای "کیفیت روزانه خطوط" (HTML)
  `${BASE_PATH}/features/home/forms/line-quality/line-quality.html`,

  `${BASE_PATH}/features/home/iso-docs/iso-docs.html`,
  `${BASE_PATH}/features/home/iso-docs/instruction/instruction.html`,

  // ✅ اضافه شده برای خط مشی ها
  `${BASE_PATH}/features/home/iso-docs/policies/policies.html`,
  `${BASE_PATH}/features/home/iso-docs/policies/policy-pakshoma.html`,
  `${BASE_PATH}/features/home/iso-docs/policies/policy-qc.html`,

  `${BASE_PATH}/features/home/charts/org-chart/org-chart.html`, // این فایل با محتوای جدید کش خواهد شد
  `${BASE_PATH}/features/home/charts/personnel-form/personnel-form.html`,
  `${BASE_PATH}/features/home/charts/charts.html`,

  // ✅ اضافه شده برای بخش آموزش (HTML)
  `${BASE_PATH}/features/home/training/training.html`,
  `${BASE_PATH}/features/home/training/products-intro/products-intro.html`,
  `${BASE_PATH}/features/home/training/parts-id/parts-id.html`,
  `${BASE_PATH}/features/home/training/tools-id/tools-id.html`,
  `${BASE_PATH}/features/home/training/general/general.html`,
  `${BASE_PATH}/features/home/training/products-intro/content/washing-machines.html`,
  `${BASE_PATH}/features/home/training/products-intro/content/vacuum-cleaners.html`,
  // مسیر زیر در ساختار پروژه شما مشخص نیست، اما در main.js اشاره شد، اگر وجود دارد اضافه شود:
  // `${BASE_PATH}/features/home/training/products-intro/content/other-appliances.html`,
  // ✅ اضافه شده فایل‌های HTML گروه‌های آموزشی
  `${BASE_PATH}/features/home/training/general/documents.html`,
  `${BASE_PATH}/features/home/training/general/group-a.html`,
  `${BASE_PATH}/features/home/training/general/group-b.html`,
  `${BASE_PATH}/features/home/training/general/quizzes/quizzes.html`,
  `${BASE_PATH}/features/home/training/general/quizzes/group-a.html`,
  `${BASE_PATH}/features/home/training/general/quizzes/group-b.html`,

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
  `${BASE_PATH}/assets/images/chart.jpg`, // ✅ حتماً این خط را اضافه کنید تا تصویر چارت کش شود
];

// =============================
//  Install Event
// =============================
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Install");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log(
          "[ServiceWorker] Pre-caching files:",
          FILES_TO_CACHE.length
        );
        return cache.addAll(FILES_TO_CACHE);
      })
      .catch((err) => {
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
  const path = url.pathname;

  // اگر درخواست از همان origin باشد
  if (url.origin === self.location.origin) {
    // اگر پروژه در یک زیرمسیر (subfolder) قرار دارد (مثل GitHub Pages)
    if (BASE_PATH && !path.startsWith(BASE_PATH)) {
      // آدرس را برای یافتن در کش اصلاح می‌کنیم

      // اگر درخواست برای ریشه پروژه است (مثل hadieghbal.github.io/)
      if (path === "/") {
        event.respondWith(
          caches.match(`${BASE_PATH}/index.html`, { ignoreSearch: true })
        );
        return;
      }

      // ساخت مسیر کش (مثلاً /assets/css/shared.css به /qc/assets/css/shared.css تبدیل شود)
      const correctedPath = path.startsWith("/")
        ? `${BASE_PATH}${path}`
        : `${BASE_PATH}/${path}`;

      event.respondWith(
        caches
          .match(correctedPath, { ignoreSearch: true })
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // اگر در کش یافت نشد، تلاش می‌کنیم با مسیر اصلی fetch کنیم
            return fetch(event.request);
          })
          .catch(() => {
            // Fallback if fetch also fails (e.g., network error and not in cache)
            // You might want to serve an offline page here if it's critical
            return new Response(null, { status: 404, statusText: "Not Found" });
          })
      );
      return;
    }

    // منطق اصلی کش برای درخواست‌هایی که مسیر صحیح BASE_PATH را دارند
    event.respondWith(
      caches
        .match(event.request, { ignoreSearch: true })
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).catch(() => {
            // Fallback if fetch also fails (e.g., network error and not in cache)
            // You might want to serve an offline page here if it's critical
            return new Response(null, { status: 404, statusText: "Not Found" });
          });
        })
    );
  }
});
