import { lineQualityFormData } from "./line-quality-data.js";

// ===================================================================
// 💡 تابع اصلاح شده: تنظیم تاریخ شمسی (با حذف منطق تقویم گرافیکی)
// ===================================================================
function setupJalaliDatePicker(dateInput) {
  // 🛑 تست اولیه برای وجود المان قبل از هر کاری
  if (!dateInput) {
    console.error("Jalali Date Input element not found.");
    return;
  }

  // --- مرحله ۱: تنظیم فوری مقدار تاریخ (که کار می‌کند) ---
  const today = new Date();
  const formatter = new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    calendar: "persian",
  });
  
  // مقداردهی اولیه به تاریخ امروز بلافاصله انجام می‌شود
  dateInput.value = formatter.format(today);
  console.log("Jalali Date Input value set to today's date.");

  // ❌ مرحله ۲ (تلاش برای فعال‌سازی ویجت jdp) کاملاً حذف شد.
  // این حذف باعث می‌شود پیام خطای "jdp did not load in time" دیگر نمایش داده نشود.
}


// 🛑 تابع کمکی مورد نیاز تابع resetLineQualityForm
function getFormElements() {
  return {
    jalaliDate: document.getElementById("jalali_date"),
    line: document.getElementById("line"),
    totalProduction: document.getElementById("mobile-total-production"),
    repairedCount: document.getElementById("mobile-repaired-count"),
    okCount: document.getElementById("mobile-ok-count"),
  };
}

// ===================================================================
// 💡 تابع جدید: ریست کردن کامل فرم برای منوی سراسری
// ===================================================================
function resetLineQualityForm() {
  const Swal = window.Swal;
  const Toastify = window.Toastify;
  const formElements = getFormElements();

  // اگر فرمElements یافت نشد، ریست نکن
  if (!formElements.jalaliDate) return;

  Swal.fire({
    title: "آیا مطمئن هستید؟",
    text: "تمام اطلاعات وارد شده در فرم حذف خواهند شد.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "بله، ریست کن!",
    cancelButtonText: "خیر، برگرد",
  }).then((result) => {
    if (result.isConfirmed) {
      // ریست کردن فیلدهای سربرگ (تاریخ و خط)
      formElements.jalaliDate.value = new Intl.DateTimeFormat(
        "fa-IR-u-nu-latn",
        {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          calendar: "persian",
        }
      ).format(new Date());
      formElements.line.value = lineQualityFormData.lines[0];

      // ریست کردن ورودی‌های اصلی فرم (مثل تولید و تعداد)
      formElements.totalProduction.value = "0";
      formElements.repairedCount.value = "0";
      formElements.okCount.value = "0";

      // ریست کردن جدول و لیست خلاصه
      document.getElementById("main-table-body").innerHTML = "";
      document.getElementById("mobile-summary-list").innerHTML = "";

      // ریست کردن بقیه فیلدها و حالت قفل
      // 🛑 توجه: resetEntryForm باید در حوزه init تعریف شده باشد و از طریق اسکوپ در دسترس نباشد.
      // چون در اینجا نمی‌توانیم به توابع داخلی init دسترسی پیدا کنیم، فقط قسمت‌های اصلی را ریست می‌کنیم.

      // فعال کردن مجدد کنترل‌های بالای فرم
      document.querySelector(".top-controls").classList.remove("locked");
      document
        .getElementById("scrap-form-page")
        .classList.remove("form-locked");

      // نمایش پیام موفقیت
      Toastify({
        text: "فرم با موفقیت ریست شد.",
        duration: 3000,
        gravity: "top",
        position: "center",
        backgroundColor: "linear-gradient(to right, #198754, #1D976C)",
      }).showToast();
    }
  });
}

// ===================================================================
// تابع اصلی (init)
// ===================================================================

export function init() {
  console.log("Line Quality Form Initialized! (v3.2 - Full Validation)");

  // --- تعریف متغیرهای اصلی ---
  const Swal = window.Swal,
    Toastify = window.Toastify,
    Choices = window.Choices;

  const pageElement = document.getElementById("scrap-form-page");
  const tableBody = document.getElementById("main-table-body");
  const topControls = document.querySelector(".top-controls");

  if (!pageElement || !tableBody || !topControls) {
    console.error("Core elements for Line Quality Form not found.");
    return;
  }

  const formElements = {
    jalaliDate: document.getElementById("jalali_date"),
    line: document.getElementById("line"),
    bomProductType: document.getElementById("bom-product-type"),
    bomModel: document.getElementById("bom-model"),
    group: document.getElementById("mobile-group"),
    item: document.getElementById("mobile-item"),
    totalProduction: document.getElementById("mobile-total-production"),
    repairedCount: document.getElementById("mobile-repaired-count"),
    okCount: document.getElementById("mobile-ok-count"),
    bomPartName: document.getElementById("bom-part-name"),
    bomPartCode: document.getElementById("bom-part-code"),
    defectOperator: document.getElementById("mobile-defect-operator"),
    defectVisual: document.getElementById("mobile-defect-visual"),
    defectTechnical: document.getElementById("mobile-defect-technical"),
    defectOther: document.getElementById("mobile-defect-other"),
    defectCleaning: document.getElementById("mobile-defect-cleaning"),
    comments: document.getElementById("mobile-comments"),
    addBtn: document.getElementById("mobile-add-btn"),
    summaryList: document.getElementById("mobile-summary-list"),
    approverControl: document.getElementById("approver-control"),
    approverLine: document.getElementById("approver-line"),
    finalizeBtn: document.querySelector(".finalize-btn"),
    exportCsvBtn: document.querySelector(".export-csv-btn"),
  };

  let bomProductTypeChoice, bomModelChoice, bomPartNameChoice;
  let editingRowIndex = null;
  let bomData = null;

  const choicesConfig = {
    searchPlaceholderValue: "جستجو...",
    removeItemButton: false,
    itemSelectText: "انتخاب",
    noResultsText: "موردی یافت نشد",
    noChoicesText: "گزینه‌ای برای انتخاب وجود ندارد",
    shouldSort: false,
  };

  // ===================================================================
  // BOM Logic (Bill of Materials)
  // ===================================================================
  async function fetchBomData() {
    try {
      const response = await fetch("bom/bom-data.json");
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      bomData = await response.json();
      return bomData;
    } catch (error) {
      console.error("Failed to load BOM data:", error);
      Swal.fire({
        icon: "error",
        title: "خطا در بارگذاری اطلاعات قطعات",
        text: "فایل اطلاعات پایه قطعات (bom-data.json) یافت نشد.",
      });
      return null;
    }
  }

  function initializeBomSelectors() {
    fetchBomData().then((data) => {
      if (data) populateProductTypes(Object.keys(data));
    });
  }

  function populateProductTypes(types) {
    const choices = types.map((type) => ({ value: type, label: type }));
    bomProductTypeChoice.setChoices(
      [{ value: "", label: "انتخاب کنید...", placeholder: true }, ...choices],
      "value",
      "label",
      true
    );
  }

  function handleProductTypeChange(event) {
    const selectedType = event.detail.value;
    bomModelChoice.clearStore();
    bomModelChoice.disable();
    bomPartNameChoice.clearStore();
    bomPartNameChoice.disable();
    formElements.bomPartCode.value = "";
    if (selectedType && bomData[selectedType]) {
      const models = Object.keys(bomData[selectedType]);
      const choices = models.map((model) => ({ value: model, label: model }));
      bomModelChoice.setChoices(
        [{ value: "", label: "انتخاب کنید...", placeholder: true }, ...choices],
        "value",
        "label",
        false
      );
      bomModelChoice.enable();
    }
  }

  function handleModelChange(event) {
    const selectedType = bomProductTypeChoice.getValue(true);
    const selectedModel = event.detail.value;
    bomPartNameChoice.clearStore();
    bomPartNameChoice.disable();
    formElements.bomPartCode.value = "";
    if (selectedType && selectedModel && bomData[selectedType][selectedModel]) {
      const parts = bomData[selectedType][selectedModel];
      const choices = parts.map((part) => ({
        value: part.name,
        label: part.name,
      }));
      bomPartNameChoice.setChoices(
        [
          { value: "", label: "جستجو یا انتخاب کنید...", placeholder: true },
          ...choices,
        ],
        "value",
        "label",
        false
      );
      bomPartNameChoice.enable();
    }
  }

  function handlePartNameChange(event) {
    const selectedPartName = event.detail.value;
    formElements.bomPartCode.value = "";
    if (selectedPartName) {
      const selectedType = bomProductTypeChoice.getValue(true);
      const selectedModel = bomModelChoice.getValue(true);
      const part = bomData[selectedType]?.[selectedModel]?.find(
        (p) => p.name === selectedPartName
      );
      if (part) formElements.bomPartCode.value = part.code;
    }
  }

  // ===================================================================
  // Helper & UI Functions
  // ===================================================================
  function showToast(message, type = "error") {
    const colors = {
      info: "linear-gradient(to right, #00b09b, #96c93d)",
      success: "linear-gradient(to right, #198754, #1D976C)",
      error: "linear-gradient(to right, #dc3545, #ff5f6d)",
      warning: "linear-gradient(to right, #f7b733, #fc4a1a)",
    };
    Toastify({
      text: message,
      duration: 4000,
      close: true,
      gravity: "top",
      position: "center",
      stopOnFocus: true,
      style: { background: colors[type] || colors.error },
    }).showToast();
  }

  function populateSelect(selectElement, dataArray) {
    if (selectElement)
      selectElement.innerHTML = dataArray
        .map((item) => `<option value="${item}">${item}</option>`)
        .join("");
  }
  
  function lockForm() {
    pageElement.classList.add("form-locked");
    pageElement
      .querySelectorAll("input, select, button")
      .forEach((el) => (el.disabled = true));
    [bomProductTypeChoice, bomModelChoice, bomPartNameChoice].forEach((c) =>
      c?.disable()
    );

    formElements.finalizeBtn.innerHTML = `<i class="bi bi-lock-fill"></i> نهایی شده`;
    formElements.exportCsvBtn.style.display = "none"; 
  }

  // ===================================================================
  // Form Management & Core Logic
  // ===================================================================
  function resetEntryForm() {
    editingRowIndex = null;
    document
      .querySelectorAll("#mobile-form-wrapper .required-field-error")
      .forEach((el) => el.classList.remove("required-field-error"));

    const fieldsToReset = [
      "defectOperator",
      "defectVisual",
      "defectTechnical",
      "defectOther",
      "defectCleaning",
      "comments",
    ];
    fieldsToReset.forEach((key) => {
      const el = formElements[key];
      if (el) el.type === "number" ? (el.value = "0") : (el.value = "");
    });
    
    if (bomPartNameChoice) bomPartNameChoice.clearInput();

    formElements.bomPartCode.value = "";
    
    formElements.addBtn.innerHTML =
      '<i class="bi bi-check-circle-fill"></i> ثبت و افزودن به لیست';
    formElements.addBtn.style.backgroundColor = "var(--success-color)";

    setTimeout(() => {
      if (bomPartNameChoice && !formElements.bomPartName.disabled) {
        bomPartNameChoice.showDropdown();
        bomPartNameChoice.input.focus();
      }
    }, 100);
  }

  function createRowHTML() {
    return `<td></td><td><input type="hidden" name="product_type"></td><td><input type="hidden" name="product_model"></td><td><input type="hidden" name="group"></td><td><input type="hidden" name="item"></td><td><input type="hidden" name="total_production"></td><td><input type="hidden" name="repaired_count"></td><td><input type="hidden" name="ok_count"></td><td><input type="hidden" name="part_name"></td><td><input type="hidden" name="part_code"></td><td><input type="hidden" name="defect_operator"></td><td><input type="hidden" name="defect_visual"></td><td><input type="hidden" name="defect_technical"></td><td><input type="hidden" name="defect_other"></td><td><input type="hidden" name="defect_cleaning"></td><td><input type="hidden" name="comments"></td>`;
  }

  function addRow(data) {
    const newRow = tableBody.insertRow();
    newRow.innerHTML = createRowHTML();
    Object.keys(data).forEach((key) => {
      const input = newRow.querySelector(`[name="${key}"]`);
      if (input) input.value = data[key];
    });
    Array.from(tableBody.rows).forEach(
      (row, index) => (row.cells[0].textContent = index + 1)
    );
  }

  function startEditing(rowToEdit) {
    if (!rowToEdit) return;
    editingRowIndex = Array.from(tableBody.children).indexOf(rowToEdit);
    const data = Object.fromEntries(
      Array.from(rowToEdit.querySelectorAll("input")).map((el) => [
        el.name,
        el.value,
      ])
    );

    bomProductTypeChoice.setChoiceByValue(data.product_type);
    setTimeout(() => bomModelChoice.setChoiceByValue(data.product_model), 100);
    formElements.group.value = data.group;
    formElements.item.value = data.item;
    formElements.totalProduction.value = data.total_production;
    formElements.repairedCount.value = data.repaired_count;
    formElements.okCount.value = data.ok_count;

    if (bomPartNameChoice)
      setTimeout(() => bomPartNameChoice.setChoiceByValue(data.part_name), 200);
    formElements.bomPartCode.value = data.part_code;
    formElements.defectOperator.value = data.defect_operator;
    formElements.defectVisual.value = data.defect_visual;
    formElements.defectTechnical.value = data.defect_technical;
    formElements.defectOther.value = data.defect_other;
    formElements.defectCleaning.value = data.defect_cleaning;
    formElements.comments.value = data.comments;

    formElements.addBtn.innerHTML =
      '<i class="bi bi-check-circle-fill"></i> به‌روزرسانی ردیف';
    formElements.addBtn.style.backgroundColor = "var(--primary-color)";
    document
      .querySelector(".mobile-form-container")
      .scrollIntoView({ behavior: "smooth" });
  }

  // 💡 تابع جدید و جامع برای اعتبارسنجی فرم
  function validateEntryForm() {
    // ابتدا همه خطاهای قبلی را پاک کن
    document.querySelectorAll(".required-field-error").forEach(el => el.classList.remove("required-field-error"));
    
    const checks = [
        { choice: bomProductTypeChoice, name: "نوع محصول" },
        { choice: bomModelChoice, name: "مدل" },
        { element: formElements.group, name: "گروه" },
        { element: formElements.item, name: "آیتم", isNumeric: true },
        { element: formElements.totalProduction, name: "تعداد کل تولید", isGreaterThanZero: true },
        { choice: bomPartNameChoice, name: "نام قطعه" },
    ];

    for (const check of checks) {
        let value;
        let elementToStyle;

        if (check.choice) {
            value = check.choice.getValue(true);
            elementToStyle = check.choice.containerOuter.element;
        } else {
            value = check.element.value;
            elementToStyle = check.element;
        }

        if (!value || (typeof value === 'string' && !value.trim())) {
            showToast(`لطفاً فیلد "${check.name}" را پر کنید.`, "error");
            elementToStyle.classList.add("required-field-error");
            elementToStyle.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return false;
        }

        if (check.isGreaterThanZero && parseInt(value, 10) <= 0) {
            showToast(`"${check.name}" باید بیشتر از صفر باشد.`, "error");
            elementToStyle.classList.add("required-field-error");
            elementToStyle.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return false;
        }
    }

    // بررسی مجموع نقص‌ها
    const totalDefects = [
      formElements.defectOperator,
      formElements.defectVisual,
      formElements.defectTechnical,
      formElements.defectOther,
      formElements.defectCleaning,
    ].reduce((sum, el) => sum + (parseInt(el.value, 10) || 0), 0);

    if (totalDefects === 0) {
        showToast("باید حداقل یک مورد نقص (اپراتوری، ظاهری و...) ثبت شود.", "error");
        // هایلایت کردن اولین فیلد نقص
        formElements.defectOperator.closest('.counter-input-group').classList.add('required-field-error');
        formElements.defectOperator.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
    }

    return true;
  }

  function handleAddItem() {
    // 💡 جایگزینی اعتبارسنجی قدیمی با تابع جدید
    if (!validateEntryForm()) return;

    const fullData = {
      product_type: bomProductTypeChoice.getValue(true),
      product_model: bomModelChoice.getValue(true),
      group: formElements.group.value,
      item: formElements.item.value,
      total_production: formElements.totalProduction.value,
      repaired_count: formElements.repairedCount.value,
      ok_count: formElements.okCount.value,
      part_name: bomPartNameChoice.getValue(true),
      part_code: formElements.bomPartCode.value,
      defect_operator: formElements.defectOperator.value,
      defect_visual: formElements.defectVisual.value,
      defect_technical: formElements.defectTechnical.value,
      defect_other: formElements.defectOther.value,
      defect_cleaning: formElements.defectCleaning.value,
      comments: formElements.comments.value,
    };

    if (editingRowIndex !== null) {
      const rowToUpdate = tableBody.rows[editingRowIndex];
      if (rowToUpdate) {
        Object.keys(fullData).forEach((key) => {
          const input = rowToUpdate.querySelector(`[name="${key}"]`);
          if (input) input.value = fullData[key];
        });
        showToast(`ردیف ${editingRowIndex + 1} به‌روز شد.`, "success");
      }
    } else {
      addRow(fullData);
      showToast(`نقص قطعه (${fullData.part_name}) ثبت شد.`, "success");
    }
    updateMobileSummary();
    resetEntryForm();
  }

  function updateMobileSummary() {
    formElements.summaryList.innerHTML = "";
    tableBody.querySelectorAll("tr").forEach((row, index) => {
      const data = Object.fromEntries(
        Array.from(row.querySelectorAll("input")).map((el) => [
          el.name,
          el.value,
        ])
      );
      if (!data.part_name) return;

      const li = document.createElement("li");
      li.dataset.rowIndex = index;

      const defectParts = [
        data.defect_operator > 0 ? `اپراتوری: ${data.defect_operator}` : "",
        data.defect_visual > 0 ? `ظاهری: ${data.defect_visual}` : "",
        data.defect_technical > 0 ? `فنی: ${data.defect_technical}` : "",
        data.defect_other > 0 ? `سایر: ${data.defect_other}` : "",
        data.defect_cleaning > 0 ? `نظافت: ${data.defect_cleaning}` : "",
      ].filter(Boolean);

      const totalDefects = defectParts.reduce(
        (sum, part) => sum + parseInt(part.split(":")[1]),
        0
      );
      
      li.innerHTML = `
    <div class="summary-main-row">
      <span class="summary-text">${index + 1}. <span class="summary-model">${
        data.part_name
      }</span></span>
      <div class="summary-actions-group">
        <div class="summary-count">تعداد نقص: <strong>${totalDefects}</strong></div>
        <div class="summary-actions">
          <button type="button" class="summary-edit-btn" title="ویرایش"><i class="bi bi-pencil-square"></i></button>
          <button type="button" class="summary-delete-btn" title="حذف"><i class="bi bi-trash3-fill"></i></button>
        </div>
      </div>
    </div>
    <div class="summary-details">
      <div class="detail-section">
        <span><i class="bi bi-box-seam icon-model"></i> مدل: ${
          data.product_model
        }</span>
        <span><i class="bi bi-clipboard-data icon-production-total"></i> کل: ${
          data.total_production
        }</span>
        <span><i class="bi bi-tools icon-repaired"></i> تعمیر: ${
          data.repaired_count
        }</span>
        <span><i class="bi bi-check-circle-fill icon-ok"></i> سالم: ${
          data.ok_count
        }</span>
      </div>
      <div class="detail-section defect-section">
        <span><i class="bi bi-diagram-3 icon-defect-type"></i> ${
          defectParts.join(" | ") || "بدون نقص"
        }</span>
        ${
          data.comments
            ? `<span><i class="bi bi-chat-left-text icon-comment"></i> ${data.comments}</span>`
            : ""
        }
      </div>
    </div>`;
      formElements.summaryList.appendChild(li);
    });
  }

  function finalizeForm() {
    if (tableBody.rows.length === 0) {
      showToast("هیچ ردیفی برای ثبت نهایی وجود ندارد.", "warning");
      return;
    }
    if (
      !formElements.approverControl.value.trim() ||
      !formElements.approverLine.value.trim()
    ) {
      showToast("لطفاً نام تمام تایید کنندگان را وارد کنید.", "warning");
      return;
    }

    Swal.fire({
      title: "ثبت نهایی فرم",
      text: "آیا مطمئن هستید؟ پس از تایید، فرم قفل شده و خروجی CSV آماده دانلود خواهد بود.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "بله، نهایی کن",
      cancelButtonText: "انصراف",
    }).then((result) => {
      if (result.isConfirmed) {
        lockForm();
        exportToCSV();
        showToast("فرم با موفقیت نهایی و قفل شد.", "success");
      }
    });
  }

  function exportToCSV() {
    const headerInfo = {
      date: formElements.jalaliDate.value,
      line: formElements.line.value,
      approver_control: formElements.approverControl.value,
      approver_line: formElements.approverLine.value,
    };
    const headers = [
      "تاریخ",
      "خط",
      "نوع محصول",
      "مدل",
      "گروه",
      "آیتم",
      "تعداد کل تولید",
      "تعداد تعمیرگاهی",
      "تعداد سالم",
      "نام قطعه",
      "کد قطعه",
      "نقص اپراتوری",
      "نقص ظاهری",
      "نقص فنی",
      "نقص سایر",
      "نقص نظافت",
      "توضیحات",
      "تایید کننده کنترل",
      "تایید کننده تولید",
    ];
    let csvContent = "\uFEFF" + headers.join(",") + "\r\n";

    Array.from(tableBody.rows).forEach((row) => {
      const data = Object.fromEntries(
        Array.from(row.querySelectorAll("input")).map((el) => [
          el.name,
          el.value,
        ])
      );
      const values = [
        headerInfo.date,
        headerInfo.line,
        data.product_type,
        data.product_model,
        data.group,
        data.item,
        data.total_production,
        data.repaired_count,
        data.ok_count,
        data.part_name,
        data.part_code,
        data.defect_operator,
        data.defect_visual,
        data.defect_technical,
        data.defect_other,
        data.defect_cleaning,
        data.comments,
        headerInfo.approver_control,
        headerInfo.approver_line,
      ];
      const cleanValues = values.map(
        (val) => `"${(val || "").toString().replace(/"/g, '""')}"`
      );
      csvContent += cleanValues.join(",") + "\r\n";
    });
    
    const fileName = `گزارش_کیفیت_خطوط _${headerInfo.line.replace(
      /\s/g,
      "_"
    )} - ${headerInfo.date.replace(/\//g, ".")}.csv`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function updateTotalProduction() {
      const repaired = parseInt(formElements.repairedCount.value, 10) || 0;
      const ok = parseInt(formElements.okCount.value, 10) || 0;
      formElements.totalProduction.value = repaired + ok;
  }

  function initializePage() {
    populateSelect(formElements.line, lineQualityFormData.lines);
    populateSelect(formElements.group, lineQualityFormData.groups);
    
    setupJalaliDatePicker(formElements.jalaliDate);

    bomProductTypeChoice = new Choices(
      formElements.bomProductType,
      choicesConfig
    );
    bomModelChoice = new Choices(formElements.bomModel, choicesConfig);
    bomPartNameChoice = new Choices(formElements.bomPartName, {
      ...choicesConfig,
      searchEnabled: true,
      searchResultLimit: 100,
    });

    initializeBomSelectors();

    // Event Listeners
    formElements.bomProductType.addEventListener(
      "change",
      handleProductTypeChange
    );
    formElements.bomModel.addEventListener("change", handleModelChange);
    formElements.bomPartName.addEventListener("change", handlePartNameChange);
    formElements.addBtn.addEventListener("click", handleAddItem);
    formElements.finalizeBtn.addEventListener("click", finalizeForm);
    formElements.exportCsvBtn.addEventListener("click", exportToCSV);
    
    formElements.repairedCount.addEventListener("input", updateTotalProduction);
    formElements.okCount.addEventListener("input", updateTotalProduction);

    formElements.summaryList.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      const li = button.closest("li[data-row-index]");
      if (!li) return;
      const rowIndex = parseInt(li.dataset.rowIndex, 10);
      const rowElement = tableBody.rows[rowIndex];
      if (!rowElement) return;

      if (button.classList.contains("summary-edit-btn"))
        startEditing(rowElement);
      else if (button.classList.contains("summary-delete-btn")) {
        rowElement.remove();
        Array.from(tableBody.rows).forEach(
          (row, index) => (row.cells[0].textContent = index + 1)
        );
        updateMobileSummary();
        showToast("ردیف حذف شد.", "success");
      }
    });

    document
      .getElementById("mobile-form-wrapper")
      .addEventListener("click", (e) => {
        if (e.target.matches(".counter-btn:not(:disabled)")) {
          const targetInput = document.getElementById(e.target.dataset.target);
          if (targetInput) {
            let value = parseInt(targetInput.value, 10) || 0;
            const min = parseInt(targetInput.min, 10);
            if (e.target.classList.contains("plus-btn")) value++;
            else if (value > (isNaN(min) ? 0 : min)) value--;
            targetInput.value = value;
            
            if (e.target.dataset.target === 'mobile-repaired-count' || e.target.dataset.target === 'mobile-ok-count') {
              updateTotalProduction();
            }
          }
        }
      });
      
    window.activeFormResetter = resetLineQualityForm;
  }

  initializePage();
}