// ==========================================
// ===== ماژول مدیریت وضعیت و ذخیره‌سازی =====
// ==========================================

// یک پیشوند برای کلیدهای ما در localStorage تعریف می‌کنیم
// تا با اطلاعات سایت‌های دیگه قاطی نشه.
const STORAGE_PREFIX = 'qc-app-';

/**
 * داده‌ها را در localStorage ذخیره می‌کند.
 * داده‌ها به صورت متن (JSON) تبدیل و سپس ذخیره می‌شوند.
 * @param {string} key - کلید شناسایی داده (مثلاً 'scrap-form-data')
 * @param {any} data - داده‌ای که می‌خواهیم ذخیره کنیم (می‌تونه آبجکت، آرایه و ... باشه)
 */
export function saveData(key, data) {
    try {
        const fullKey = STORAGE_PREFIX + key;
        const dataAsString = JSON.stringify(data); // تبدیل داده به متن
        localStorage.setItem(fullKey, dataAsString);
        console.log(`Data saved for key: ${fullKey}`);
    } catch (error) {
        console.error(`Error saving data for key "${key}":`, error);
    }
}

/**
 * داده‌ها را از localStorage بازیابی می‌کند.
 * متن ذخیره شده را می‌خواند و آن را به داده اصلی (مثلاً آبجکت) تبدیل می‌کند.
 * @param {string} key - کلید شناسایی داده
 * @returns {any | null} - داده بازیابی شده یا null در صورت عدم وجود یا خطا
 */
export function loadData(key) {
    try {
        const fullKey = STORAGE_PREFIX + key;
        const dataAsString = localStorage.getItem(fullKey);
        if (dataAsString === null) {
            return null; // اگر داده‌ای وجود نداشت، null برگردان
        }
        return JSON.parse(dataAsString); // تبدیل متن به داده اصلی
    } catch (error) {
        console.error(`Error loading data for key "${key}":`, error);
        return null;
    }
}

/**
 * یک آیتم خاص را از localStorage حذف می‌کند.
 * @param {string} key - کلید شناسایی داده برای حذف
 */
export function removeData(key) {
    try {
        const fullKey = STORAGE_PREFIX + key;
        localStorage.removeItem(fullKey);
        console.log(`Data removed for key: ${fullKey}`);
    } catch (error) {
        console.error(`Error removing data for key "${key}":`, error);
    }
}

/**
 * تمام داده‌های مربوط به این برنامه را از localStorage پاک می‌کند.
 * (این تابع فعلا استفاده نمی‌شود ولی برای آینده خوب است)
 */
export function clearAllAppData() {
    try {
        // تمام کلیدهای localStorage را می‌گردیم
        Object.keys(localStorage).forEach(key => {
            // اگر کلیدی با پیشوند ما شروع شده بود، آن را پاک می‌کنیم
            if (key.startsWith(STORAGE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
        console.log('All app data cleared from localStorage.');
    } catch (error) {
        console.error('Error clearing all app data:', error);
    }
}