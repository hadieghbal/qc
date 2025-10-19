// QC/features/home/training/training.js (نسخه نهایی و سازگار با ساختار پوشه جدید)

// تابع اصلی برای بارگذاری محتوای آموزشی (به صورت ناهمگام)
export async function loadTrainingContent(contentPath) {
  const loader = document.getElementById("loader");
  loader.style.display = "flex";

  try {
    // 💥 اصلاح مسیر نهایی: پوشه اضافی 'training-content/' حذف شد
    // مسیر مورد انتظار: features/home/training/general/group-a.html
    const fullPath = `features/home/training/${contentPath}.html`; 
    const response = await fetch(fullPath);
    if (!response.ok)
      throw new Error(`Could not load training content: ${fullPath}`);

    const contentHtml = await response.text();

    const finalHtml = `
   <div id="training-content-detail" class="page-content doc-container">
    ${contentHtml}
   </div>
  `;

    return finalHtml;
  } catch (error) {
    console.error("Error loading training content:", error);
    return `<p style="text-align: center; color: var(--danger-color);">خطا در بارگذاری محتوای آموزشی. مسیر خطا: ${contentPath}</p>`;
  } finally {
    setTimeout(() => (loader.style.display = "none"), 50);
  }
}

// تابع کمکی برای عنوان در نوار هدر
function getTitleForTrainingContent(hashParts) {
  // hashParts یک آرایه از بخش‌های مسیر است، مثلاً ['training', 'products-intro', 'washing-machines']
  const lastPart = hashParts[hashParts.length - 1]; 
  
  switch (lastPart) {
    case "products-intro":
      return "معرفی محصولات";
    case "parts-id":
      return "قطعه شناسی";
    case "tools-id":
      return "ابزار شناسی";
    case "general":
      return "آموزش‌های عمومی"; 
    case "group-a":
      return "سوالات گروه A";
    case "group-b":
      return "سوالات گروه B";
    case "washing-machines":
      return "ماشین لباسشویی و ظرفشویی";
    case "vacuum-cleaners":
      return "جاروبرقی‌ها";
    case "other-appliances":
        return "سایر لوازم";
    default:
      return "جزئیات آموزش";
  }
}

// تابع برای بارگذاری محتوای داخلی و تزریق آن به DOM
async function loadTrainingDetail(contentPath) {
  try {
    const mainContainer = document.getElementById("page-container");
    if (!mainContainer) {
      console.error("Main page container not found (page-container).");
      return;
    }

    // 1. بارگذاری محتوای HTML
    const detailHtml = await loadTrainingContent(contentPath);

    // 2. به‌روزرسانی عنوان هدر
    const hashParts = contentPath.split('/');
    const headerTitle = document.getElementById("header-title");
    if (headerTitle) {
      // استفاده از تمام بخش‌های مسیر (به جز training) برای یافتن عنوان صحیح
      headerTitle.textContent = getTitleForTrainingContent(['training', ...hashParts]); 
    }

    // 3. تزریق محتوای جدید به DOM
    mainContainer.innerHTML = detailHtml;

    // 4. فعال‌سازی مجدد منطق کلیک کارت‌ها
    setupCardNavigationHandler();

  } catch (error) {
    console.error("Error in loadTrainingDetail:", error);
    document.getElementById(
      "page-container"
    ).innerHTML = `<p style="text-align: center; color: var(--danger-color);">خطا در نمایش جزئیات آموزش.</p>`;
  }
}

// 💥 تابع برای مدیریت کلیک‌های کارتی در داخل هر صفحه آموزش
function setupCardNavigationHandler() {
    document
      .querySelectorAll(".nav-card[data-feature-path]")
      .forEach((card) => {
        card.addEventListener("click", function (e) {
          e.preventDefault();
          const featurePath = this.getAttribute("data-feature-path"); // مثلاً 'products-intro'
          const currentPath = window.location.hash.slice(1); // مثلاً '/training' یا '/training/products-intro'

          // 💥 منطق اصلی کلیک: اضافه کردن نام کارت به انتهای مسیر URL
          let newHash = `#${currentPath}/${featurePath}`;
          
          if(currentPath === '/training') {
              newHash = `#/training/${featurePath}`; 
          }
          
          window.location.hash = newHash;
        });
      });
}


// تابع برای راه‌اندازی صفحه training
export function init(fullPath) {
  const currentPath = fullPath; // شامل /training یا /training/products-intro

  // ۱. مدیریت کلیک روی کارت‌ها
  setupCardNavigationHandler();

  // ۲. بررسی مسیر برای بارگذاری محتوای داخلی (سطح ۲ به بعد)
  const hashParts = currentPath.slice(1).split("/"); // ['training', 'products-intro']

  if (hashParts[0] === "training" && hashParts.length > 1) {

    let contentPath = '';
    const featureName = hashParts[1]; // products-intro, general, parts-id, tools-id

    if(hashParts.length === 2) {
        // 💥 سطح ۲ (صفحه ناوبری زیرمجموعه): /training/products-intro
        // فایل HTML مورد نیاز: products-intro/products-intro.html
        contentPath = `${featureName}/${featureName}`;
    } else {
        // 💥 سطح ۳ به بعد (محتوا یا ناوبری عمیق تر): /training/general/group-a
        // فایل HTML مورد نیاز: general/group-a.html یا products-intro/content/washing-machines.html
        // (content/ فعلا در آدرس دهی حذف شده تا ساده تر باشد)
        contentPath = hashParts.slice(1).join('/');
    }
    
    // اگر محتوای نهایی در پوشه content قرار دارد، این خط را فعال کنید:
    // اگر featureName == 'products-intro' و نام فایل نهایی بود (یعنی length > 2):
    // if(hashParts.length > 2 && featureName === 'products-intro') {
    //     contentPath = `${featureName}/content/${hashParts.slice(2).join('/')}`;
    // }

    loadTrainingDetail(contentPath);

  } // اگر مسیر فقط /training است
  else if (hashParts[0] === "training" && hashParts.length === 1) {
    const headerTitle = document.getElementById("header-title");
    if (headerTitle) {
      headerTitle.textContent = "آموزش‌ها";
    }
  }
}