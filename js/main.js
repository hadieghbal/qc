// QC/js/main.js (کد کامل اصلاح شده)

// وارد کردن منطق هر صفحه با نام مستعار برای خوانایی بیشتر
import { init as initScrapForm } from "/features/home/forms/scrap-form/scrap-form.js";
import { init as initChecklistInjection } from "/features/home/forms/checklists/checklist-injection/checklist-injection.js";
import { init as initPersonnelForm } from "/features/home/charts/personnel-form/personnel-form.js";
import { init as initOrgChart } from "/features/home/charts/org-chart/org-chart.js";
import { init as initLineQuality } from "/features/home/forms/line-quality/line-quality.js";
// 💥 تغییر شماره ۱: وارد کردن تابع init برای آموزش‌ها
import { init as initTraining } from "/features/home/training/training.js";

// ==========================================
// ===== بخش ۱: تنظیمات سراسری و DOM ========
// ==========================================

const pageContainer = document.getElementById("page-container");
const loader = document.getElementById("loader");
const headerTitle = document.getElementById("header-title");
const pageMenuContainer = document.getElementById("page-menu-container");
const headerDocCode = document.getElementById("header-doc-code");

window.activeFormResetter = null;
const backButtonHTML = `<button onclick="history.back()" class="menu-button" title="بازگشت"><i class="bi bi-arrow-right"></i></button>`;

function getUniversalMenuHTML() {
  return `
  <div class="page-menu">
   <button id="menu-btn" class="menu-button" title="منو"><i class="bi bi-list"></i></button>
   <div id="main-menu" class="main-menu">
    <ul>
     <li><a href="#/"><i class="bi bi-house-door-fill"></i> صفحه اصلی</a></li>
     <li class="separator"></li>
     <li><a href="#" id="menu-reset-universal"><i class="bi bi-arrow-counterclockwise"></i> ریست کردن فرم</a></li>
     <li class="separator"></li>
     <li><a href="#" id="menu-exit-universal"><i class="bi bi-box-arrow-left"></i> خروج</a></li>
    </ul>
   </div>
  </div>
 `;
}

function setupGlobalMenuHandler() {
  document.body.addEventListener("click", function (e) {
    const menuBtn = document.getElementById("menu-btn");
    const mainMenu = document.getElementById("main-menu");
    if (menuBtn?.contains(e.target)) {
      e.stopPropagation();
      mainMenu.classList.toggle("show");
      return;
    }
    if (mainMenu?.classList.contains("show") && !mainMenu.contains(e.target)) {
      mainMenu.classList.remove("show");
    }
  });
  document.body.addEventListener("click", function (e) {
    const resetBtn = e.target.closest("#menu-reset-universal");
    const exitBtn = e.target.closest("#menu-exit-universal");
    const mainMenu = document.getElementById("main-menu");
    const closeMenu = () => mainMenu?.classList.remove("show");
    if (resetBtn) {
      e.preventDefault();
      closeMenu();
      if (typeof window.activeFormResetter === "function") {
        window.activeFormResetter();
      } else {
        window.Swal.fire(
          "توجه",
          "در این صفحه فرمی برای ریست کردن وجود ندارد.",
          "info"
        );
      }
    }
    if (exitBtn) {
      e.preventDefault();
      closeMenu();
      if (window.AppInventor && window.AppInventor.setWebViewString) {
        window.AppInventor.setWebViewString("close_app");
      } else {
        window.close();
      }
    }
  });
}

// تابع برای مدیریت آکاردئون در همه صفحات
function setupAccordionHandlers() {
  pageContainer.addEventListener("click", (e) => {
    const header = e.target.closest(".accordion-header");
    if (header && !header.closest(".form-locked")) {
      header.classList.toggle("active");
      const content = header.nextElementSibling;
      if (content && content.classList.contains("accordion-content")) {
        content.style.display =
          content.style.display === "flex" ? "none" : "flex";
      }
    }
  });
}

// =======================================================
// ===== بخش ۲: روتر و راه اندازی برنامه (Router) ========
// =======================================================

const routes = {
  "/": {
    path: "features/home/home.html",
    title: "سیستم جامع کنترل کیفیت",
    headerType: "none",
    init: () => {},
  },
  "/iso-docs": {
    path: "features/home/iso-docs/iso-docs.html",
    title: "مستندات ایزو",
    headerType: "back",
    init: () => {},
  },
  "/instruction": {
    path: "features/home/iso-docs/instruction/instruction.html",
    title: "دستورالعمل کنترل فرآیند",
    docCode: "P1-QC-WI-001/001",
    headerType: "back",
    init: () => {},
  },
  "/forms": {
    path: "features/home/forms/forms.html",
    title: "فرم‌های کنترلی",
    headerType: "back",
    init: () => {},
  },
  "/checklists": {
    path: "features/home/forms/checklists/checklists.html",
    title: "انتخاب چک‌لیست",
    headerType: "back",
    init: function () {
      document.querySelectorAll(".category-header").forEach((header) => {
        header.addEventListener("click", () => {
          header.classList.toggle("active");
          const content = header.nextElementSibling;
          content.style.display =
            content.style.display === "block" ? "none" : "block";
        });
      });
    },
  },
  "/scrap-form": {
    path: "features/home/forms/scrap-form/scrap-form.html",
    css: "features/home/forms/scrap-form/scrap-form.css",
    title: "فرم هوشمند گزارش ضایعات",
    docCode: "P1-QC-F-001/001",
    headerType: "back-and-universal-menu",
    init: initScrapForm,
  },
  "/line-quality": {
    path: "features/home/forms/line-quality/line-quality.html",
    css: "features/home/forms/line-quality/line-quality.css",
    title: "فرم کیفیت خطوط",
    docCode: "P1-QC-F-002/001",
    headerType: "back-and-universal-menu",
    init: initLineQuality,
  },
  "/charts": {
    path: "features/home/charts/charts.html",
    title: "چارت سازمانی",
    headerType: "back",
    init: () => {},
  },
  "/personnel-form": {
    path: "features/home/charts/personnel-form/personnel-form.html",
    title: "مدیریت پرسنل",
    headerType: "back-and-universal-menu",
    init: initPersonnelForm,
  },
  "/org-chart": {
    path: "features/home/charts/org-chart/org-chart.html",
    css: "features/home/charts/org-chart/org-chart.css",
    title: "نمودار سازمانی",
    headerType: "back",
    init: initOrgChart,
  },
  "/checklist-injection": {
    path: "features/home/forms/checklists/checklist-injection/checklist-injection.html",
    css: "features/home/forms/checklists/checklist-injection/checklist-injection.css",
    title: "چک‌لیست کنترل کیفی تزریق",
    docCode: "IM1-QC-F-110/001",
    headerType: "back-and-universal-menu",
    init: initChecklistInjection,
  },
  // 💥 مسیر اصلی آموزش
  "/training": {
    path: "features/home/training/training.html",
    title: "آموزش‌ها و راهنماها",
    headerType: "back",
    init: initTraining, // استفاده از تابع init که در بالا import شد
  },
};

function loadPageCSS(cssPath) {
  document
    .querySelectorAll("link[data-page-specific]")
    .forEach((link) => link.remove());
  if (cssPath) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    link.setAttribute("data-page-specific", "true");
    document.head.appendChild(link);
  }
}

async function loadPage(path) {
  loader.style.display = "flex";
  pageContainer.innerHTML = "";
  window.activeFormResetter = null;

  // 1. بررسی مسیر اصلی در آبجکت routes
  let route = routes[path];

  // 💥 (بخش اصلاح شده برای آموزش): اگر مسیر صریحاً تعریف نشده بود و با /training/ شروع می‌شد، 
  // از پیکربندی مسیر پایه /training استفاده کن.
  if (!route && path.startsWith("/training/")) {
    route = routes["/training"]; 
  }

  const routeToUse = route || routes["/"]; 

  try {
    const response = await fetch(routeToUse.path);
    if (!response.ok) throw new Error(`Could not load page: ${routeToUse.path}`);
    
    // بارگذاری HTML مسیر اصلی (مثلاً training.html)
    pageContainer.innerHTML = await response.text();
    
    // تنظیمات هدر از روی مسیر اصلی آموزش انجام می‌شود
    headerTitle.textContent = routeToUse.title; 
    headerDocCode.textContent = routeToUse.docCode || "";
    pageMenuContainer.innerHTML = "";
    if (routeToUse.headerType === "back") {
      pageMenuContainer.innerHTML = backButtonHTML;
    } else if (routeToUse.headerType === "back-and-universal-menu") {
      pageMenuContainer.innerHTML = backButtonHTML + getUniversalMenuHTML();
    }
    loadPageCSS(routeToUse.css);

    if (typeof routeToUse.init === "function") {
      setTimeout(() => {
        try {
          // 💥 فراخوانی init با مسیر کامل (path)، تا initTraining بتواند محتوای فرعی را بارگذاری کند.
          routeToUse.init(path); 
        } catch (initError) {
          console.error(
            `Error during page initialization for ${path}:`,
            initError
          );
          pageContainer.innerHTML = `<p style="text-align: center; color: var(--danger-color);">خطای داخلی در اسکریپت صفحه.</p>`;
        }
      }, 0);
    }
  } catch (error) {
    console.error("Routing Error:", error);
    pageContainer.innerHTML = `<p style="text-align: center; color: var(--danger-color);">خطا در بارگذاری صفحه.</p>`;
  } finally {
    setTimeout(() => (loader.style.display = "none"), 50);
  }
}

function handleRouteChange() {
  const path = window.location.hash.slice(1) || "/";
  // اطمینان از اینکه مسیر با / شروع می‌شود
  loadPage(path.startsWith("/") ? path : `/${path}`);
}

// =========================================================================
// ===== بخش ۳: ثبت Service Worker و راه‌اندازی رویدادهای اصلی برنامه =====
// =========================================================================

window.addEventListener("hashchange", handleRouteChange);

window.addEventListener("load", () => {
  handleRouteChange();
  setupGlobalMenuHandler();
  setupAccordionHandlers();

  // ثبت Service Worker
  if ("serviceWorker" in navigator) {
    // ✨✨✨ این بخش اصلاح شد: آدرس 'service-worker.js' به صورت نسبی نوشته شد ✨✨✨
    navigator.serviceWorker
      .register("service-worker.js")
      .then((registration) => {
        console.log(
          "ServiceWorker registration successful with scope: ",
          registration.scope
        );
      })
      .catch((error) => {
        console.log("ServiceWorker registration failed: ", error);
      });
  }
});