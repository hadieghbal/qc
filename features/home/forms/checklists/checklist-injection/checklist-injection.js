import { injectionChecklistData } from "./checklist-injection-data.js";

export function init() {
  console.log(
    "Checklist Injection Initialized! (v: Smooth Scroll + Ordered Validation)"
  );

  const Swal = window.Swal,
    Toastify = window.Toastify,
    Choices = window.Choices,
    html2canvas = window.html2canvas;

  const pageElement = document.getElementById("checklist-injection-page");
  const tableBody = document.getElementById("main-table-body");
  const mobileSummaryList = document.getElementById("mobile-summary-list");
  const legendsMainContainer = document.getElementById(
    "injection-legends-main"
  );
  const legendsMobileWrapper = document.getElementById(
    "injection-legends-wrapper-mobile"
  );

  if (
    !pageElement ||
    !tableBody ||
    !mobileSummaryList ||
    !legendsMainContainer
  ) {
    console.error("Core elements for Checklist Injection not found.");
    return;
  }

  let data = [];
  let editingIndex = null;
  let finalizedData = {};
  let mobileDeviceChoice;

  // نگهداری اینستنس‌های Choices
  let partChoices = new Map();
  let materialChoices = new Map();
  let masterbatchChoices = new Map();

  const STORAGE_PREFIX = "INJ_SETUP_";

  const choicesConfig = {
    searchPlaceholderValue: "جستجو...",
    removeItemButton: false,
    itemSelectText: "انتخاب",
    noResultsText: "موردی یافت نشد",
    noChoicesText: "گزینه‌ای نیست",
    shouldSort: false,
    searchResultLimit: 1000,
    renderChoiceLimit: 1000,
  };

  // --- Helpers ---
  function getTodayDateString() {
    const dateInput = document.getElementById("date_input");
    if (dateInput && dateInput.value) return dateInput.value;
    const today = new Date();
    const formatter = new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      calendar: "persian",
    });
    return formatter.format(today);
  }

  function saveDeviceSettingsToMemory(settings) {
    const date = getTodayDateString();
    const key = `${STORAGE_PREFIX}${date}_${settings.deviceName}`;
    const dataToStore = {
      parts: settings.parts,
      materials: settings.materials,
      masterbatches: settings.masterbatches,
      weight: settings.weight,
      cycleTime: settings.cycleTime,
    };
    try {
      localStorage.setItem(key, JSON.stringify(dataToStore));
    } catch (e) {
      console.error(e);
    }
  }

  function loadDeviceSettingsFromMemory(deviceName) {
    const date = getTodayDateString();
    const key = `${STORAGE_PREFIX}${date}_${deviceName}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  }

  function cleanupOldStorage() {
    const todayDate = getTodayDateString();
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX) && !key.includes(todayDate)) {
        localStorage.removeItem(key);
      }
    });
  }

  function showToast(message, type = "error") {
    const colors = {
      info: "linear-gradient(to right, #0dcaf0, #0d6efd)",
      success: "linear-gradient(to right, #198754, #1D976C)",
      error: "linear-gradient(to right, #dc3545, #ff5f6d)",
      warning: "linear-gradient(to right, #ffc107, #f7b733)",
    };
    Toastify({
      text: message,
      duration: 3000,
      close: true,
      gravity: "top",
      position: "center",
      stopOnFocus: true,
      style: { background: colors[type] || colors.error },
    }).showToast();
  }

  function createNewItem(prefill = {}) {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    return {
      id: Date.now() + Math.random(),
      deviceName: prefill.deviceName || "",
      parts: prefill.parts || [],
      inspectionType: prefill.inspectionType || "initial",
      serialNumbers: prefill.serialNumbers || Array(5).fill(""),
      materials: prefill.materials || [],
      masterbatches: prefill.masterbatches || [],
      weight: prefill.weight || "",
      cycleTime: prefill.cycleTime || "",
      appearance: prefill.appearance || Array(5).fill(null),
      assembly: prefill.assembly || Array(5).fill(null),
      packaging: prefill.packaging || Array(5).fill(null),
      defectsSummary: prefill.defectsSummary || "",
      notes: prefill.notes || "",
      timestamp: timeString,
    };
  }

  function getChoicesArray(dataList) {
    const placeholder = {
      value: "",
      label: "انتخاب کنید...",
      placeholder: true,
      disabled: true,
    };
    const items = (dataList || []).map((item) => ({
      value: item,
      label: item,
    }));
    return [placeholder, ...items];
  }

  function formatCompoundList(listArray) {
    if (!listArray || listArray.length === 0) return "ثبت نشده";
    return listArray
      .map((item) => {
        const desc = item.description ? ` (${item.description})` : "";
        return `${item.name}${desc}: ${item.percentage}%`;
      })
      .join(" + ");
  }

  function formatPartsList(partsArray) {
    if (!partsArray || partsArray.length === 0) return "ثبت نشده";
    return partsArray
      .map((part) => {
        const desc = part.description ? ` (${part.description})` : "";
        return `${part.name}${desc}`;
      })
      .join("، ");
  }

  // --- HTML Generation ---
  function createPartRowHTML(part = { name: "", description: "" }) {
    return `
   <div class="part-row">
    <select class="name-input"></select>
    <input type="text" class="description-input" value="${
      part.description || ""
    }" placeholder="توضیحات / کد...">
    <div class="material-buttons">
     <button type="button" class="material-action-btn remove-material-btn">−</button>
     <button type="button" class="material-action-btn add-material-btn">+</button>
    </div>
   </div>`;
  }

  function createMaterialRowHTML(
    material = { name: "", description: "", percentage: "" }
  ) {
    return `
   <div class="material-row">
    <select class="name-input"></select>
    <input type="text" class="description-input" value="${
      material.description || ""
    }" placeholder="توضیحات">
    <input type="number" class="numeric-input" value="${
      material.percentage || ""
    }" placeholder="%" min="0" max="100">
    <div class="material-buttons">
     <button type="button" class="material-action-btn remove-material-btn">−</button>
     <button type="button" class="material-action-btn add-material-btn">+</button>
    </div>
   </div>`;
  }

  function createMasterbatchRowHTML(
    masterbatch = { name: "", description: "", percentage: "" }
  ) {
    return `
   <div class="masterbatch-row">
    <select class="name-input"></select>
    <input type="text" class="description-input" value="${
      masterbatch.description || ""
    }" placeholder="توضیحات">
    <input type="number" class="numeric-input" value="${
      masterbatch.percentage || ""
    }" placeholder="%" min="0" max="100">
    <div class="material-buttons">
     <button type="button" class="material-action-btn remove-material-btn">−</button>
     <button type="button" class="material-action-btn add-material-btn">+</button>
    </div>
   </div>`;
  }

  // --- Logic ---
  function createMobileCheckboxes() {
    const groups = pageElement.querySelectorAll(
      ".mobile-form-container .check-group"
    );
    groups.forEach((group) => {
      group.innerHTML = "";
      for (let i = 0; i < 5; i++) {
        const checkBox = document.createElement("div");
        checkBox.className = "check-box";
        group.appendChild(checkBox);
      }
    });
  }

  function populateSelect(selectElement, options, placeholderText) {
    if (!selectElement) return;
    selectElement.innerHTML = `<option value="" disabled selected>${placeholderText}</option>`;
    options.forEach((optionText) => {
      const option = document.createElement("option");
      option.value = optionText;
      option.textContent = optionText;
      selectElement.appendChild(option);
    });
  }

  function setupTopControls() {
    const { halls, shifts, timeSlots } = injectionChecklistData.formOptions;
    populateSelect(
      document.getElementById("hall_input"),
      halls,
      "انتخاب سالن..."
    );
    populateSelect(
      document.getElementById("shift_input"),
      shifts,
      "انتخاب شیفت..."
    );
    populateSelect(
      document.getElementById("time_slot_input"),
      timeSlots,
      "انتخاب ساعت..."
    );
  }

  function populateLegends() {
    const defects = injectionChecklistData.defects;
    const ul = legendsMainContainer.querySelector(".legends-list");
    if (!ul) return;
    ul.innerHTML = "";
    defects.forEach((defect) => {
      const li = document.createElement("li");
      li.dataset.defectName = defect;
      li.textContent = defect;
      ul.appendChild(li);
    });
  }

  function setupDate() {
    const dateInput = document.getElementById("date_input");
    if (!dateInput) return;
    const today = new Date();
    const formatter = new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      calendar: "persian",
    });
    dateInput.value = formatter.format(today);
    cleanupOldStorage();
  }

  function updateDefectLabelRequirement() {
    const defectLabel = document.getElementById("defects-summary-label");
    const mobileForm = document.querySelector(".mobile-form-container");
    if (!defectLabel || !mobileForm) return;
    const isAnyNg = mobileForm.querySelector(".check-box.ng");
    if (isAnyNg) {
      defectLabel.classList.add("required");
    } else {
      defectLabel.classList.remove("required");
    }
  }

  function updateFormMode() {
    const typeSelect = document.getElementById("mobile-inspection-type");
    const mode = typeSelect.value;
    const isRoutine = mode === "routine";
    const activeColumns = isRoutine ? 2 : 5;

    const serialInputs = document.querySelectorAll(
      "#serial-inputs-wrapper .serial-input"
    );
    serialInputs.forEach((input, index) => {
      if (index < activeColumns) {
        input.classList.remove("hidden-col");
      } else {
        input.classList.add("hidden-col");
        input.value = "";
        input.classList.remove("required-field-error");
      }
      if (index === 0) {
        if (!isRoutine) {
          input.classList.add("master-sample-input");
          input.placeholder = "سریال کامل";
          input.type = "text";
        } else {
          input.classList.remove("master-sample-input");
          input.placeholder = "4رقم";
          input.type = "number";
        }
      } else {
        input.type = "number";
      }
    });

    const checkRows = document.querySelectorAll(".qc-grid-checks");
    checkRows.forEach((row) => {
      const boxes = Array.from(row.children);
      boxes.forEach((box, index) => {
        if (index < activeColumns) {
          box.classList.remove("hidden-col");
        } else {
          box.classList.add("hidden-col");
          box.classList.remove("ok", "ng");
        }
        if (index === 0 && !isRoutine) {
          box.classList.add("master-sample-check");
        } else {
          box.classList.remove("master-sample-check");
        }
      });
    });
    updateDefectLabelRequirement();
  }

  // --- مدیریت Choices.js برای لیست‌ها ---
  function initializeListChoices(
    containerId,
    dataList,
    storageMap,
    itemsData = []
  ) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const rows = container.children;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const selectElement = row.querySelector("select.name-input");
      if (selectElement && !storageMap.has(selectElement)) {
        const choice = new Choices(selectElement, choicesConfig);
        choice.setChoices(getChoicesArray(dataList), "value", "label", true);
        if (itemsData[i] && itemsData[i].name) {
          choice.setChoiceByValue(itemsData[i].name);
        }
        storageMap.set(selectElement, choice);
      }
    }
  }

  // --- Initializers کلی ---
  function initializeAllDynamicLists(dataObj = {}) {
    // 1. قطعات
    partChoices.forEach((c) => c.destroy());
    partChoices.clear();
    const partsContainer = document.getElementById("mobile-parts-container");
    const partsData =
      dataObj.parts && dataObj.parts.length > 0
        ? dataObj.parts
        : [{ name: "", description: "" }];
    partsContainer.innerHTML = partsData
      .map((p) => createPartRowHTML(p))
      .join("");
    initializeListChoices(
      "mobile-parts-container",
      injectionChecklistData.parts,
      partChoices,
      partsData
    );

    // 2. مواد
    materialChoices.forEach((c) => c.destroy());
    materialChoices.clear();
    const matContainer = document.getElementById("mobile-materials-container");
    const matData =
      dataObj.materials && dataObj.materials.length > 0
        ? dataObj.materials
        : [{ name: "", description: "", percentage: "" }];
    matContainer.innerHTML = matData
      .map((m) => createMaterialRowHTML(m))
      .join("");
    initializeListChoices(
      "mobile-materials-container",
      injectionChecklistData.materials,
      materialChoices,
      matData
    );

    // 3. مستربچ
    masterbatchChoices.forEach((c) => c.destroy());
    masterbatchChoices.clear();
    const mbContainer = document.getElementById(
      "mobile-masterbatches-container"
    );
    const mbData =
      dataObj.masterbatches && dataObj.masterbatches.length > 0
        ? dataObj.masterbatches
        : [{ name: "", description: "", percentage: "" }];
    mbContainer.innerHTML = mbData
      .map((m) => createMasterbatchRowHTML(m))
      .join("");
    initializeListChoices(
      "mobile-masterbatches-container",
      injectionChecklistData.masterbatches,
      masterbatchChoices,
      mbData
    );
  }

  function clearFieldsOnly() {
    initializeAllDynamicLists();

    document.getElementById("mobile-weight").value = "";
    document.getElementById("mobile-cycleTime").value = "";
    document.getElementById("mobile-defects-summary").value = "";
    document.getElementById("mobile-notes").value = "";
    document.getElementById("mobile-inspection-type").value = "";
    document
      .querySelectorAll("#serial-inputs-wrapper .serial-input")
      .forEach((inp) => (inp.value = ""));
    document
      .querySelectorAll("#mobile-form-wrapper .check-box")
      .forEach((box) => (box.className = "check-box"));

    updateFormMode();
    updateDefectLabelRequirement();
    updateDefectLegendsSelection();
  }

  function resetMobileForm() {
    editingIndex = null;
    if (mobileDeviceChoice) mobileDeviceChoice.setChoiceByValue("");
    clearFieldsOnly();
    const addBtn = document.getElementById("mobile-add-btn");
    if (addBtn) {
      addBtn.innerHTML =
        '<i class="bi bi-check-circle-fill"></i> ثبت و افزودن به لیست';
      addBtn.style.backgroundColor = "var(--success-color)";
    }
    document
      .querySelectorAll(".required-field-error")
      .forEach((el) => el.classList.remove("required-field-error"));
  }

  function onDeviceChange(event) {
    const deviceName = event.detail.value;
    if (!deviceName || editingIndex !== null) return;

    const isDuplicate = data.some((item) => item.deviceName === deviceName);
    if (isDuplicate) {
      showToast(`دستگاه "${deviceName}" قبلاً در لیست ثبت شده است!`, "warning");
      clearFieldsOnly();
      return;
    }

    const savedSettings = loadDeviceSettingsFromMemory(deviceName);
    if (savedSettings) {
      initializeAllDynamicLists(savedSettings);
      document.getElementById("mobile-weight").value =
        savedSettings.weight || "";
      document.getElementById("mobile-cycleTime").value =
        savedSettings.cycleTime || "";
      const typeSelect = document.getElementById("mobile-inspection-type");
      typeSelect.value = "routine";
      updateFormMode();
      showToast("تنظیمات ذخیره شده بارگذاری شد.", "info");
    } else {
      clearFieldsOnly();
    }
  }

  // =========================================
  // === VALIDATION HELPER (Fix for Smooth Scroll) ===
  // =========================================
  function validateAndScroll(element, message) {
    if (!element) return;

    // 1. اضافه کردن کلاس خطا
    if (
      element.tagName === "SELECT" &&
      element.classList.contains("name-input")
    ) {
      // برای choices.js
      const choiceWrapper = element.closest(".choices");
      if (choiceWrapper) choiceWrapper.classList.add("required-field-error");
    } else {
      // برای سایر فیلدها
      element.classList.add("required-field-error");
    }

    // 2. اسکرول نرم به عنصر (یا والد آن اگر choices باشد)
    const targetToScroll = element.closest(".choices") || element;
    targetToScroll.scrollIntoView({ behavior: "smooth", block: "center" });

    // 3. فوکوس بدون پرش (Prevent Scroll)
    // این قسمت کلیدی است: صبر می‌کنیم و سپس با preventScroll فوکوس می‌کنیم
    setTimeout(() => {
      if (typeof element.focus === "function") {
        element.focus({ preventScroll: true });
      }
    }, 100);

    showToast(message, "error");
  }

  function handleMobileSubmit() {
    // 0. پاک کردن خطاهای قبلی
    pageElement
      .querySelectorAll(".required-field-error")
      .forEach((el) => el.classList.remove("required-field-error"));

    // 1. اعتبارسنجی هدر (Header)
    const topFields = [
      { id: "date_input", msg: "تاریخ الزامی است." },
      { id: "hall_input", msg: "سالن الزامی است." },
      { id: "shift_input", msg: "شیفت الزامی است." },
      { id: "time_slot_input", msg: "ساعت الزامی است." },
    ];
    for (const field of topFields) {
      const el = document.getElementById(field.id);
      if (!el.value.trim()) {
        validateAndScroll(el, field.msg);
        return;
      }
    }

    // 2. اعتبارسنجی دستگاه (Device)
    const deviceName = mobileDeviceChoice.getValue(true);
    if (!deviceName) {
      const choicesEl = document
        .querySelector("#mobile-device-name")
        .closest(".choices");
      choicesEl.classList.add("required-field-error");
      showToast("لطفاً دستگاه را انتخاب کنید.", "error");
      choicesEl.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (editingIndex === null) {
      const isDuplicate = data.some((item) => item.deviceName === deviceName);
      if (isDuplicate) {
        showToast(
          `خطا: دستگاه "${deviceName}" قبلاً در لیست وجود دارد.`,
          "error"
        );
        return;
      }
    }

    // 3. اعتبارسنجی قطعات (Parts)
    const partRows = document.querySelectorAll(
      "#mobile-parts-container .part-row"
    );
    const parts = [];
    for (const row of partRows) {
      const selectEl = row.querySelector("select.name-input");
      const choiceInstance = partChoices.get(selectEl);
      const partName = choiceInstance ? choiceInstance.getValue(true) : "";
      const description = row.querySelector(".description-input").value.trim();

      if (!partName) {
        validateAndScroll(selectEl, "نام قطعه الزامی است.");
        return;
      }
      parts.push({ name: partName, description: description });
    }

    // 4. اعتبارسنجی نوع تولید (Inspection Type)
    const mode = document.getElementById("mobile-inspection-type").value;
    if (!mode) {
      validateAndScroll(
        document.getElementById("mobile-inspection-type"),
        "نوع تولید را انتخاب کنید."
      );
      return;
    }

    // 5. اعتبارسنجی مواد و مستربچ (Materials & Masterbatch Logic)
    const materials = [];
    const masterbatches = [];
    let totalPercentage = 0;

    // الف) مواد
    const materialRows = document.querySelectorAll(
      "#mobile-materials-container .material-row"
    );
    for (const row of materialRows) {
      const selectEl = row.querySelector("select.name-input");
      const choiceInstance = materialChoices.get(selectEl);
      const matName = choiceInstance ? choiceInstance.getValue(true) : "";
      const description = row.querySelector(".description-input").value.trim();
      const percentageStr = row.querySelector(".numeric-input").value.trim();
      const percentage = parseFloat(percentageStr);

      if (matName || percentageStr) {
        if (!matName) {
          validateAndScroll(selectEl, "نام مواد را انتخاب کنید.");
          return;
        }
        if (isNaN(percentage) || percentageStr === "") {
          const inputEl = row.querySelector(".numeric-input");
          validateAndScroll(inputEl, "درصد مواد الزامی است.");
          return;
        }
        materials.push({ name: matName, description, percentage });
        totalPercentage += percentage;
      }
    }

    // ب) مستربچ
    const mbRows = document.querySelectorAll(
      "#mobile-masterbatches-container .masterbatch-row"
    );
    for (const row of mbRows) {
      const selectEl = row.querySelector("select.name-input");
      const choiceInstance = masterbatchChoices.get(selectEl);
      const mbName = choiceInstance ? choiceInstance.getValue(true) : "";
      const description = row.querySelector(".description-input").value.trim();
      const percentageStr = row.querySelector(".numeric-input").value.trim();
      const percentage = parseFloat(percentageStr);

      if (mbName || percentageStr) {
        if (!mbName) {
          validateAndScroll(selectEl, "نام مستربچ را انتخاب کنید.");
          return;
        }
        if (isNaN(percentage) || percentageStr === "") {
          const inputEl = row.querySelector(".numeric-input");
          validateAndScroll(inputEl, "درصد مستربچ الزامی است.");
          return;
        }
        masterbatches.push({ name: mbName, description, percentage });
        totalPercentage += percentage;
      }
    }

    // ج) بررسی مجموع درصدها
    if (materials.length === 0 && masterbatches.length === 0) {
      const firstMatInput = document.querySelector(
        "#mobile-materials-container select"
      );
      validateAndScroll(firstMatInput, "لطفاً حداقل یک ماده مصرفی وارد کنید.");
      return;
    }

    if (Math.abs(totalPercentage - 100) > 0.1) {
      document
        .getElementById("mobile-materials-container")
        .scrollIntoView({ behavior: "smooth", block: "center" });
      showToast(
        `مجموع درصدهای مواد و مستربچ باید ۱۰۰٪ باشد. (مجموع فعلی: ${totalPercentage}٪)`,
        "error"
      );
      return;
    }

    // 6. وزن (Weight) - جابجا شد به قبل از سریال
    const weight = document.getElementById("mobile-weight").value.trim();
    if (!weight || isNaN(weight) || weight <= 0) {
      validateAndScroll(
        document.getElementById("mobile-weight"),
        "وزن معتبر وارد کنید."
      );
      return;
    }

    // 7. سیکل زمانی (Cycle Time) - جابجا شد به قبل از سریال
    const cycleTime = document.getElementById("mobile-cycleTime").value.trim();
    if (!cycleTime || isNaN(cycleTime) || cycleTime <= 0) {
      validateAndScroll(
        document.getElementById("mobile-cycleTime"),
        "سیکل زمانی معتبر وارد کنید."
      );
      return;
    }

    // 8. سریال‌ها (Serial Numbers) - جابجا شد به بعد از وزن و سیکل
    const isRoutine = mode === "routine";
    const activeCount = isRoutine ? 2 : 5;

    if (!isRoutine) {
      const masterInput = document.querySelector(
        '#serial-inputs-wrapper .serial-input[data-index="0"]'
      );
      const masterVal = masterInput.value.trim();
      if (
        !masterVal ||
        masterVal.length < 8 ||
        masterVal.length > 20 ||
        !/^\d+$/.test(masterVal)
      ) {
        validateAndScroll(
          masterInput,
          "سریال اصلی باید بین ۸ تا ۲۰ رقم عددی باشد."
        );
        return;
      }
    }
    const serialInputs = document.querySelectorAll(
      "#serial-inputs-wrapper .serial-input"
    );
    const serialValues = [];
    for (let i = 0; i < activeCount; i++) {
      const val = serialInputs[i].value.trim();
      if (i > 0 && !val) {
        validateAndScroll(serialInputs[i], `سریال ${i + 1} الزامی است.`);
        return;
      }
      if (i > 0 && !/^\d{4}$/.test(val)) {
        validateAndScroll(
          serialInputs[i],
          `سریال ${i + 1} باید دقیقاً ۴ رقم باشد.`
        );
        return;
      }
      serialValues.push(val);
    }
    while (serialValues.length < 5) serialValues.push("");

    // 9. چک‌باکس‌ها
    const checkProps = ["appearance", "assembly", "packaging"];
    const checkData = {};
    for (const prop of checkProps) {
      const group = document.querySelector(
        `.qc-grid-checks[data-prop="${prop}"]`
      );
      const boxes = Array.from(group.children).slice(0, activeCount);
      checkData[prop] = [];
      for (const box of boxes) {
        if (box.classList.contains("ok")) checkData[prop].push("ok");
        else if (box.classList.contains("ng")) checkData[prop].push("ng");
        else {
          showToast(
            `وضعیت ${
              prop === "appearance"
                ? "ظاهری"
                : prop === "assembly"
                ? "مونتاژی"
                : "بسته‌بندی"
            } را مشخص کنید.`,
            "error"
          );
          box.scrollIntoView({ behavior: "smooth", block: "center" });
          box.style.border = "2px solid red";
          setTimeout(() => (box.style.border = ""), 2000);
          return;
        }
      }
      while (checkData[prop].length < 5) checkData[prop].push(null);
    }

    // 10. نقص (Defects)
    const hasNg = Object.values(checkData).flat().includes("ng");
    const defectsSummary = document
      .getElementById("mobile-defects-summary")
      .value.trim();
    if (hasNg && !defectsSummary) {
      validateAndScroll(
        document.getElementById("mobile-defects-summary"),
        "در صورت وجود NG، شرح نقص الزامی است."
      );
      return;
    }

    // --- ساخت آیتم نهایی ---
    const newItem = {
      deviceName,
      parts,
      inspectionType: mode,
      serialNumbers: serialValues,
      materials,
      masterbatches,
      weight,
      cycleTime,
      defectsSummary,
      notes: document.getElementById("mobile-notes").value.trim(),
      ...checkData,
    };

    // --- ذخیره و نمایش پیام (اصلاح شده) ---
    // آماده‌سازی متن پیام برای هر دو حالت
    const partNamesJoined = parts.map((p) => p.name).join("، ");
    const displayIndex =
      editingIndex !== null ? editingIndex + 1 : data.length + 1;
    const actionVerb = editingIndex !== null ? "ویرایش" : "ثبت";

    if (editingIndex !== null) {
      data[editingIndex] = { ...data[editingIndex], ...newItem };
      saveDeviceSettingsToMemory(newItem);
    } else {
      data.push(createNewItem(newItem));
      saveDeviceSettingsToMemory(newItem);
    }

    // نمایش پیام زیبا برای هر دو حالت
    showToast(
      `${displayIndex}، ${deviceName}، ${partNamesJoined} با موفقیت ${actionVerb} شد`,
      "success"
    );

    render();
    resetMobileForm();
    setTimeout(() => {
      if (mobileDeviceChoice) {
        mobileDeviceChoice.showDropdown();
        mobileDeviceChoice.input.element.focus();
      }
    }, 200);
  }

  function render() {
    tableBody.innerHTML = "";
    mobileSummaryList.innerHTML = "";
    data.forEach((item, index) => {
      const li = document.createElement("li");
      li.dataset.id = item.id;
      const partNamesText =
        item.parts && item.parts.length > 0
          ? item.parts.map((p) => p.name).join("، ")
          : "قطعه نامشخص";
      const typeLabel = item.inspectionType === "routine" ? "دوره‌ای" : "اولیه";
      const badgeColor =
        item.inspectionType === "routine" ? "#e2e3e5" : "#fff3cd";
      const validSerials = item.serialNumbers.filter((s) => s).join(" - ");

      const headerHTML = `
    <div class="summary-card-header">
     <h2 class="summary-card-title">${index + 1}. ${
        item.deviceName
      } = <strong class="summary-part-name">${partNamesText}</strong></h2>
     <div class="summary-controls">
      <span class="summary-timestamp"><i class="bi bi-clock"></i> ${
        item.timestamp
      }</span>
      <div class="summary-actions">
       <button type="button" class="summary-edit-btn" title="ویرایش"><i class="bi bi-pencil-square"></i></button>
       <button type="button" class="summary-delete-btn" title="حذف"><i class="bi bi-trash3-fill"></i></button>
      </div>
     </div>
    </div>`;

      const processInfoHTML = `
    <div class="card-details-row">
     ${
       item.parts && item.parts.length > 0
         ? `<span><i class="bi bi-boxes"></i> ${formatPartsList(
             item.parts
           )}</span>`
         : ""
     }
     ${
       item.weight
         ? `<span><i class="bi bi-speedometer2"></i> وزن: ${item.weight}g</span>`
         : ""
     }
     ${
       item.cycleTime
         ? `<span><i class="bi bi-hourglass-split"></i> سیکل: ${item.cycleTime}s</span>`
         : ""
     }
     ${
       item.materials && item.materials.length > 0
         ? `<span><i class="bi bi-palette-fill"></i> ${formatCompoundList(
             item.materials
           )}</span>`
         : ""
     }
     ${
       item.masterbatches && item.masterbatches.length > 0
         ? `<span><i class="bi bi-paint-bucket"></i> ${formatCompoundList(
             item.masterbatches
           )}</span>`
         : ""
     }
    </div>`;

      const getCheckSummary = (prop, icon, label) => {
        const activeCount = item.inspectionType === "routine" ? 2 : 5;
        const slicedArr = (item[prop] || []).slice(0, activeCount);
        const ok = slicedArr.filter((s) => s === "ok").length;
        const ng = slicedArr.filter((s) => s === "ng").length;
        if (ok > 0 || ng > 0)
          return `<span><i class="bi ${icon}"></i> ${label}: ${
            ok > 0 ? `<span class="check-ok">OK:${ok}</span>` : ""
          } ${ng > 0 ? `<span class="check-ng">NG:${ng}</span>` : ""}</span>`;
        return "";
      };

      const qualityInfoHTML = `
    <div class="card-details-row quality-row">
     ${getCheckSummary("appearance", "bi-eye-fill", "ظاهری")}
     ${getCheckSummary("assembly", "bi-tools", "مونتاژی")}
     ${getCheckSummary("packaging", "bi-box-seam", "بسته‌بندی")}
    </div>`;

      const defectsAndNotesHTML =
        item.defectsSummary || item.notes
          ? `
    <div class="card-details-row notes-row">
     ${
       item.defectsSummary
         ? `<span><i class="bi bi-exclamation-triangle-fill"></i> ${item.defectsSummary}</span>`
         : ""
     }
     ${
       item.notes
         ? `<span><i class="bi bi-chat-left-text-fill"></i> ${item.notes}</span>`
         : ""
     }
    </div>`
          : "";

      const inspectionInfoHTML = `
    <div class="card-details-row">
     <span class="inspection-badge" style="background-color: ${badgeColor};"><i class="bi bi-tag-fill"></i> ${typeLabel}</span>
     ${
       validSerials
         ? `<span><i class="bi bi-barcode"></i> سریال‌ها: ${validSerials}</span>`
         : ""
     }
    </div>`;

      li.innerHTML = `
    ${headerHTML}
    <div class="summary-card-details">
     ${inspectionInfoHTML}
     ${processInfoHTML}
     ${qualityInfoHTML}
     ${defectsAndNotesHTML}
    </div>`;
      mobileSummaryList.appendChild(li);
    });
    updateDefectLegendsSelection();
  }

  function populateMobileForm(item) {
    editingIndex = data.findIndex((d) => d.id === item.id);
    if (mobileDeviceChoice)
      mobileDeviceChoice.setChoiceByValue(item.deviceName || "");

    // ایجاد ردیف خالی در صورت نبود داده (برای ویرایش)
    const safeItem = {
      ...item,
      parts:
        item.parts && item.parts.length > 0
          ? item.parts
          : [{ name: "", description: "" }],
      materials:
        item.materials && item.materials.length > 0
          ? item.materials
          : [{ name: "", description: "", percentage: "" }],
      masterbatches:
        item.masterbatches && item.masterbatches.length > 0
          ? item.masterbatches
          : [{ name: "", description: "", percentage: "" }],
    };

    initializeAllDynamicLists(safeItem);

    document.getElementById("mobile-inspection-type").value =
      item.inspectionType || "initial";
    document.getElementById("mobile-weight").value = item.weight || "";
    document.getElementById("mobile-cycleTime").value = item.cycleTime;

    const serialInputs = document.querySelectorAll(
      "#serial-inputs-wrapper .serial-input"
    );
    serialInputs.forEach((inp, idx) => {
      inp.value = item.serialNumbers[idx] || "";
    });
    document.getElementById("mobile-defects-summary").value =
      item.defectsSummary;
    document.getElementById("mobile-notes").value = item.notes;
    ["appearance", "assembly", "packaging"].forEach((prop) => {
      const group = document.querySelector(
        `.mobile-form-container .check-group[data-prop="${prop}"]`
      );
      if (group)
        (item[prop] || []).forEach((state, i) => {
          const box = group.children[i];
          if (box) box.className = `check-box ${state || ""}`;
        });
    });
    updateDefectLabelRequirement();
    updateFormMode();
    const addBtn = document.getElementById("mobile-add-btn");
    if (addBtn) {
      addBtn.innerHTML = '<i class="bi bi-check-circle-fill"></i> به‌روزرسانی';
      addBtn.style.backgroundColor = "var(--primary-color)";
    }
    updateDefectLegendsSelection();
    document
      .querySelector(".mobile-form-container")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  function resetForm() {
    data = [];
    editingIndex = null;
    finalizedData = {};
    pageElement.classList.remove("form-locked");
    pageElement
      .querySelectorAll("input, button, .choices, select")
      .forEach((el) => {
        el.disabled = false;
      });
    if (mobileDeviceChoice) mobileDeviceChoice.enable();
    const finalizeBtn = pageElement.querySelector("#finalize-btn");
    if (finalizeBtn)
      finalizeBtn.innerHTML = `<i class="bi bi-check2-circle"></i> ثبت نهایی فرم`;
    const exportCsvBtn = pageElement.querySelector("#export-csv-btn");
    if (exportCsvBtn) exportCsvBtn.style.display = "none";
    const exportImgBtn = pageElement.querySelector("#export-img-btn");
    if (exportImgBtn) exportImgBtn.style.display = "none";
    resetMobileForm();
    render();
    setupDate();
  }

  function resetFormWithConfirmation() {
    Swal.fire({
      title: "ریست کردن فرم",
      text: "تمام اطلاعات پاک خواهد شد. مطمئنید؟",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، ریست کن",
      cancelButtonText: "انصراف",
    }).then((result) => {
      if (result.isConfirmed) {
        resetForm();
        showToast("فرم با موفقیت ریست شد", "success");
      }
    });
  }

  function finalizeForm() {
    if (data.length === 0) {
      showToast("هیچ ردیفی برای ثبت نهایی وجود ندارد.", "warning");
      return;
    }
    const errors = [];
    const topFields = [
      { id: "hall_input", message: "انتخاب سالن اجباری است." },
      { id: "shift_input", message: "انتخاب شیفت اجباری است." },
      { id: "time_slot_input", message: "انتخاب ساعت اجباری است." },
    ];
    topFields.forEach((field) => {
      const select = document.getElementById(field.id);
      if (!select.value) {
        errors.push(field.message);
        select.classList.add("required-field-error");
      }
    });
    const approverFields = [
      { id: "approver-qc", message: "نام بازرس QC اجباری است." },
      { id: "approver-prod", message: "نام سرپرست تولید اجباری است." },
      { id: "approver-shift", message: "نام سرپرست کنترل کیفیت اجباری است." },
    ];
    let allApproversFilled = true;
    approverFields.forEach((field) => {
      const input = document.getElementById(field.id);
      if (!input.value.trim()) {
        allApproversFilled = false;
        input.classList.add("required-field-error");
      }
    });
    if (!allApproversFilled)
      errors.push("نام تمام تاییدکنندگان باید وارد شود.");
    if (errors.length > 0) {
      showToast(errors[0]);
      return;
    }
    Swal.fire({
      title: "ثبت نهایی فرم",
      text: "پس از تایید، امکان ویرایش فرم وجود نخواهد داشت. مطمئنید؟",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "بله، ثبت نهایی کن",
      cancelButtonText: "انصراف",
    }).then((result) => {
      if (result.isConfirmed) {
        finalizedData = {
          globalInfo: {
            date: document.getElementById("date_input").value,
            hall: document.getElementById("hall_input").value,
            shift: document.getElementById("shift_input").value,
            time: document.getElementById("time_slot_input").value,
            qc: document.getElementById("approver-qc").value.trim(),
            prod: document.getElementById("approver-prod").value.trim(),
            shiftManager: document
              .getElementById("approver-shift")
              .value.trim(),
          },
          tableData: JSON.parse(JSON.stringify(data)),
        };
        pageElement.classList.add("form-locked");
        pageElement.querySelectorAll("input, button, select").forEach((el) => {
          if (!el.id.startsWith("export-")) {
            el.disabled = true;
          }
        });
        if (mobileDeviceChoice) mobileDeviceChoice.disable();
        partChoices.forEach((c) => c.disable());
        materialChoices.forEach((c) => c.disable());
        masterbatchChoices.forEach((c) => c.disable());

        const finalizeBtn = pageElement.querySelector("#finalize-btn");
        if (finalizeBtn) {
          finalizeBtn.innerHTML = `<i class="bi bi-lock-fill"></i> نهایی شده`;
          finalizeBtn.disabled = true;
        }
        const exportCsvBtn = pageElement.querySelector("#export-csv-btn"),
          exportImgBtn = pageElement.querySelector("#export-img-btn");
        if (exportCsvBtn) exportCsvBtn.style.display = "inline-flex";
        if (exportImgBtn) exportImgBtn.style.display = "inline-flex";
        showToast("فرم با موفقیت ثبت و قفل شد.", "success");
      }
    });
  }

  function exportToCSV() {
    if (Object.keys(finalizedData).length === 0) {
      showToast("لطفا ابتدا فرم را ثبت نهایی کنید.", "warning");
      return;
    }
    const { globalInfo, tableData } = finalizedData;
    const headers = [
      "ردیف",
      "تاریخ",
      "سالن",
      "شیفت",
      "ساعت",
      "نام دستگاه",
      "قطعات (توضیحات)",
      "نوع بازرسی",
      "سریال 1 (اصلی)",
      "سریال 2",
      "سریال 3",
      "سریال 4",
      "سریال 5",
      "وزن (g)",
      "مواد مصرفی",
      "مستربچ",
      "سیکل زمانی (ثانیه)",
      "ظاهری OK",
      "ظاهری NG",
      "مونتاژی OK",
      "مونتاژی NG",
      "بسته‌بندی OK",
      "بسته‌بندی NG",
      "شرح نقص",
      "توضیحات",
      "بازرس کنترل کیفیت",
      "سرپرست شیفت",
      "سرپرست کنترل کیفیت",
    ];
    let csvContent = "\uFEFF" + headers.join(",") + "\r\n";
    tableData.forEach((item, index) => {
      const clean = (cell) => {
        if (cell === null || cell === undefined || cell === "") return '"0"';
        return `"${cell.toString().replace(/"/g, '""')}"`;
      };
      const ok = (prop) => {
        const activeCount = item.inspectionType === "routine" ? 2 : 5;
        return (item[prop] || [])
          .slice(0, activeCount)
          .filter((s) => s === "ok").length;
      };
      const ng = (prop) => {
        const activeCount = item.inspectionType === "routine" ? 2 : 5;
        return (item[prop] || [])
          .slice(0, activeCount)
          .filter((s) => s === "ng").length;
      };

      const partsString = formatPartsList(item.parts);
      const materialsString = formatCompoundList(item.materials);
      const masterbatchesString = formatCompoundList(item.masterbatches);
      const inspectionTypeLabel =
        item.inspectionType === "routine" ? "دوره‌ای" : "اولیه";
      const serial1 = item.serialNumbers[0] ? `\t${item.serialNumbers[0]}` : "";

      const row = [
        index + 1,
        globalInfo.date,
        globalInfo.hall,
        globalInfo.shift,
        globalInfo.time,
        item.deviceName,
        partsString,
        inspectionTypeLabel,
        serial1,
        item.serialNumbers[1],
        item.serialNumbers[2],
        item.serialNumbers[3],
        item.serialNumbers[4],
        item.weight,
        materialsString,
        masterbatchesString,
        item.cycleTime,
        ok("appearance"),
        ng("appearance"),
        ok("assembly"),
        ng("assembly"),
        ok("packaging"),
        ng("packaging"),
        item.defectsSummary,
        item.notes,
        globalInfo.qc,
        globalInfo.prod,
        globalInfo.shiftManager,
      ];
      csvContent += row.map(clean).join(",") + "\r\n";
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a"),
      url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `چک‌لیست_تزریق_${globalInfo.date.replace(/\//g, "-")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function exportToImage() {
    if (Object.keys(finalizedData).length === 0) {
      showToast("لطفا ابتدا فرم را ثبت نهایی کنید.", "warning");
      return;
    }

    const exportButton = pageElement.querySelector("#export-img-btn");
    if (exportButton) {
      exportButton.disabled = true;
      exportButton.innerHTML = "در حال ساخت تصویر...";
    }

    const { globalInfo, tableData } = finalizedData;
    const printContainer = document.querySelector(".print-page-container");

    const PAGE_WIDTH = 800;
    const baseFileName = `چک‌لیست_تزریق_${globalInfo.date.replace(
      /\//g,
      "."
    )}_${globalInfo.shift}`;

    const buildSinglePageHTML = (allItemsHTML) => {
      const originalHeaderClone = document
        .getElementById("main-header")
        .cloneNode(true);
      const topInfoHTML = `
        <div class="export-top-info" style="display: flex; justify-content: space-between; padding: 15px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px; background: #f8f9fa;">
            <div><strong>تاریخ:</strong> ${globalInfo.date}</div>
            <div><strong>سالن:</strong> ${globalInfo.hall}</div>
            <div><strong>شیفت:</strong> ${globalInfo.shift}</div>
            <div><strong>ساعت:</strong> ${globalInfo.time}</div>
        </div>`;
      const approvalHTML = `
        <div class="approvers-container" style="margin-top: 30px; border-top: 2px solid #333; padding-top: 20px;">
            <div class="approver-group"><label>۱. بازرس QC:</label><span class="approver-group-name">${globalInfo.qc}</span></div>
            <div class="approver-group"><label>۲. سرپرست شیفت:</label><span class="approver-group-name">${globalInfo.prod}</span></div>
            <div class="approver-group"><label>۳. سرپرست QC:</label><span class="approver-group-name">${globalInfo.shiftManager}</span></div>
        </div>`;
      return `
        <div style="padding: 20px; background: #fff; direction: rtl; font-family: 'Tahoma', sans-serif;">
            ${originalHeaderClone.outerHTML}
            ${topInfoHTML}
            <div class="export-items-list" style="display: flex; flex-direction: column; gap: 15px;">
                ${allItemsHTML}
            </div>
            ${approvalHTML}
        </div>`;
    };

    const createItemCardHTML = (item, index) => {
      const partNamesText =
        item.parts && item.parts.length > 0
          ? item.parts.map((p) => p.name).join("، ")
          : "قطعه نامشخص";
      const typeLabel = item.inspectionType === "routine" ? "دوره‌ای" : "اولیه";
      const validSerials = item.serialNumbers.filter((s) => s).join(" - ");

      const headerHTML = `
        <div class="summary-card-header" style="border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 8px;">
            <h3 class="summary-card-title" style="margin: 0; font-size: 16px; color: #0d6efd;">${
              index + 1
            }. ${
        item.deviceName
      } = <span style="color: #333;">${partNamesText}</span></h3>
            <span class="summary-timestamp" style="font-size: 12px; color: #666;">${
              item.timestamp
            }</span>
        </div>`;

      const processInfoHTML = `
        <div class="card-details-row" style="font-size: 12px; color: #555; margin-bottom: 5px;">
            ${
              item.parts && item.parts.length > 0
                ? `<span>📦 ${formatPartsList(item.parts)}</span> `
                : ""
            }
            ${item.weight ? `<span>⚖️ ${item.weight}g</span> ` : ""}
            ${
              item.materials && item.materials.length > 0
                ? `<span>🧪 ${formatCompoundList(item.materials)}</span> `
                : ""
            }
            ${
              item.masterbatches && item.masterbatches.length > 0
                ? `<span>🎨 ${formatCompoundList(item.masterbatches)}</span> `
                : ""
            }
            ${item.cycleTime ? `<span>⏱️ ${item.cycleTime}s</span>` : ""}
        </div>`;

      const getCheckSummary = (prop, label) => {
        const activeCount = item.inspectionType === "routine" ? 2 : 5;
        const slicedArr = (item[prop] || []).slice(0, activeCount);
        const ok = slicedArr.filter((s) => s === "ok").length;
        const ng = slicedArr.filter((s) => s === "ng").length;
        if (ok > 0 || ng > 0)
          return `<span style="margin-left: 10px;">${label}: <b style="color:green">OK:${ok}</b> <b style="color:red">NG:${ng}</b></span>`;
        return "";
      };
      const qualityInfoHTML = `
        <div class="card-details-row quality-row" style="font-size: 12px; margin-bottom: 5px;">
            ${getCheckSummary("appearance", "ظاهری")}
            ${getCheckSummary("assembly", "مونتاژی")}
            ${getCheckSummary("packaging", "بسته‌بندی")}
        </div>`;
      const defectsAndNotesHTML =
        item.defectsSummary || item.notes
          ? `<div class="card-details-row notes-row" style="background: #f9f9f9; padding: 5px; border-radius: 4px; font-size: 12px;">
                ${
                  item.defectsSummary
                    ? `<div style="color: #dc3545;">⚠️ نقص: ${item.defectsSummary}</div>`
                    : ""
                }
                ${item.notes ? `<div>📝 ${item.notes}</div>` : ""}
             </div>`
          : "";
      const inspectionInfoHTML = `
        <div class="card-details-row" style="margin-bottom: 5px;">
            <span style="background: #eee; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${typeLabel}</span>
            ${
              validSerials
                ? `<span style="font-size: 12px; margin-right: 5px;">🔢 سریال‌ها: ${validSerials}</span>`
                : ""
            }
        </div>`;

      return `
        <div class="summary-card-item" style="border: 1px solid #ccc; border-right: 4px solid #0d6efd; border-radius: 5px; padding: 10px; background: #fff; page-break-inside: avoid;">
            ${headerHTML}
            <div class="summary-card-details">
                ${inspectionInfoHTML}
                ${processInfoHTML}
                ${qualityInfoHTML}
                ${defectsAndNotesHTML}
            </div>
        </div>`;
    };

    try {
      const allItemsHTML = tableData.map(createItemCardHTML).join("");
      printContainer.innerHTML = buildSinglePageHTML(allItemsHTML);
      printContainer.style.visibility = "visible";
      printContainer.style.display = "block";
      printContainer.style.width = `${PAGE_WIDTH}px`;
      printContainer.style.position = "absolute";
      printContainer.style.top = "0";
      printContainer.style.left = "-9999px";
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(printContainer, {
        useCORS: true,
        scale: 2,
        width: PAGE_WIDTH,
        height: printContainer.scrollHeight + 50,
        windowWidth: printContainer.scrollWidth,
        windowHeight: printContainer.scrollHeight + 100,
        backgroundColor: "#ffffff",
        letterRendering: 1,
        onclone: (clonedDoc) => {
          const container = clonedDoc.querySelector(".print-page-container");
          if (container)
            container.style.fontFamily = "Tahoma, Arial, sans-serif";
        },
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${baseFileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("تصویر فرم با موفقیت دانلود شد.", "success");
    } catch (err) {
      console.error("خطا در ایجاد تصویر:", err);
      showToast("خطا در ایجاد خروجی تصویر.", "error");
    } finally {
      printContainer.style.visibility = "hidden";
      printContainer.style.display = "none";
      printContainer.innerHTML = "";
      if (exportButton) {
        exportButton.disabled = false;
        exportButton.innerHTML = `<i class="bi bi-camera-fill"></i> خروجی تصویر فرم`;
      }
    }
  }

  function initializeChoices() {
    mobileDeviceChoice = new Choices("#mobile-device-name", {
      searchEnabled: true,
      searchPlaceholderValue: "جستجو در دستگاه‌ها...",
      noResultsText: "دستگاهی یافت نشد",
      noChoicesText: "دستگاهی موجود نیست",
      itemSelectText: "",
      shouldSort: false,
      removeItemButton: false,
      searchResultLimit: 1000,
      renderChoiceLimit: 1000,
      maxItemCount: -1,
      loadingText: "در حال بارگذاری...",
      searchFields: ["label", "value"],
      fuseOptions: { threshold: 0.3 },
    });
    mobileDeviceChoice.setChoices(
      getChoicesArray(injectionChecklistData.devices),
      "value",
      "label",
      true
    );
    mobileDeviceChoice.passedElement.element.addEventListener(
      "change",
      onDeviceChange,
      false
    );
  }

  function addSafeEventListener(selector, event, handler) {
    const element = pageElement.querySelector(selector);
    if (element) element.addEventListener(event, handler);
  }

  function handleDefectClick(e) {
    const li = e.target.closest(".legends-list li");
    if (!li) return;
    const defectName = li.dataset.defectName;
    const targetInput = document.getElementById("mobile-defects-summary");
    const currentDefects = new Set(
      targetInput.value ? targetInput.value.split(" | ") : []
    );
    if (currentDefects.has(defectName)) currentDefects.delete(defectName);
    else currentDefects.add(defectName);
    targetInput.value = Array.from(currentDefects).join(" | ");
    updateDefectLegendsSelection();
  }

  function updateDefectLegendsSelection() {
    let activeDefects = new Set();
    const mobileInput = document.getElementById("mobile-defects-summary");
    if (mobileInput && mobileInput.value)
      activeDefects = new Set(mobileInput.value.split(" | "));
    document.querySelectorAll(".legends-list li").forEach((li) => {
      li.classList.toggle("selected", activeDefects.has(li.dataset.defectName));
    });
  }

  function handleCheckClick(e) {
    const checkBox = e.target.closest(".check-box");
    if (
      !checkBox ||
      checkBox.closest(".form-locked") ||
      checkBox.classList.contains("hidden-col")
    )
      return;
    if (checkBox.dataset.longPress) {
      delete checkBox.dataset.longPress;
      return;
    }
    e.preventDefault();
    const currentState = checkBox.className;
    if (currentState.includes("ok")) checkBox.className = "check-box ng";
    else if (currentState.includes("ng")) checkBox.className = "check-box";
    else checkBox.className = "check-box ok";
    updateDefectLabelRequirement();
  }

  function deleteItem(id) {
    const itemIndex = data.findIndex((i) => i.id === id);
    if (itemIndex > -1) {
      const itemName = data[itemIndex].deviceName || `ردیف ${itemIndex + 1}`;
      Swal.fire({
        title: "حذف ردیف",
        text: `آیا از حذف "${itemName}" اطمینان دارید؟`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "بله، حذف کن",
        cancelButtonText: "انصراف",
      }).then((result) => {
        if (result.isConfirmed) {
          data.splice(itemIndex, 1);
          render();
          showToast(`"${itemName}" حذف شد.`, "info");
        }
      });
    }
  }

  function setupAutoSerialIncrement() {
    const serialInputs = document.querySelectorAll(
      "#serial-inputs-wrapper .serial-input"
    );
    const firstInput = serialInputs[0];
    if (!firstInput) return;
    firstInput.addEventListener("blur", function () {
      const rawValue = this.value.trim();
      if (!rawValue || isNaN(rawValue) || rawValue.length < 4) return;
      const lastFourStr = rawValue.slice(-4);
      let currentNum = parseInt(lastFourStr, 10);
      for (let i = 1; i < serialInputs.length; i++) {
        const nextInput = serialInputs[i];
        if (nextInput.classList.contains("hidden-col")) continue;
        currentNum++;
        nextInput.value = String(currentNum).padStart(4, "0");
      }
    });
  }

  // Event Listeners
  addSafeEventListener("#finalize-btn", "click", finalizeForm);
  addSafeEventListener("#export-csv-btn", "click", exportToCSV);
  addSafeEventListener("#export-img-btn", "click", exportToImage);
  addSafeEventListener("#mobile-add-btn", "click", handleMobileSubmit);
  addSafeEventListener("#mobile-inspection-type", "change", updateFormMode);
  legendsMainContainer.addEventListener("click", handleDefectClick);
  pageElement.addEventListener("click", handleCheckClick);
  pageElement.addEventListener("click", (e) => {
    const delBtn = e.target.closest(".summary-delete-btn");
    const editBtn = e.target.closest(".summary-edit-btn");
    if (delBtn) deleteItem(Number(delBtn.closest("[data-id]").dataset.id));
    if (editBtn)
      populateMobileForm(
        data.find(
          (i) => i.id === Number(editBtn.closest("[data-id]").dataset.id)
        )
      );
  });

  pageElement.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".add-material-btn");
    const removeBtn = e.target.closest(".remove-material-btn");
    if (addBtn) {
      const container = addBtn.closest(".dynamic-list-wrapper");
      let newRowHTML = "";
      let listData = [];
      let storageMap = null;

      switch (container.id) {
        case "mobile-parts-container":
          newRowHTML = createPartRowHTML();
          listData = injectionChecklistData.parts;
          storageMap = partChoices;
          break;
        case "mobile-materials-container":
          newRowHTML = createMaterialRowHTML();
          listData = injectionChecklistData.materials;
          storageMap = materialChoices;
          break;
        case "mobile-masterbatches-container":
          newRowHTML = createMasterbatchRowHTML();
          listData = injectionChecklistData.masterbatches;
          storageMap = masterbatchChoices;
          break;
      }

      if (newRowHTML) {
        container.insertAdjacentHTML("beforeend", newRowHTML);
        const newRow = container.lastElementChild;
        const selectElement = newRow.querySelector("select.name-input");
        const choice = new Choices(selectElement, choicesConfig);
        choice.setChoices(getChoicesArray(listData), "value", "label", true);
        storageMap.set(selectElement, choice);
      }
    }
    if (removeBtn) {
      const row = removeBtn.closest(
        ".part-row, .material-row, .masterbatch-row"
      );
      if (row && row.parentElement.children.length > 1) {
        const selectElement = row.querySelector("select.name-input");
        if (partChoices.has(selectElement)) {
          partChoices.get(selectElement).destroy();
          partChoices.delete(selectElement);
        }
        if (materialChoices.has(selectElement)) {
          materialChoices.get(selectElement).destroy();
          materialChoices.delete(selectElement);
        }
        if (masterbatchChoices.has(selectElement)) {
          masterbatchChoices.get(selectElement).destroy();
          masterbatchChoices.delete(selectElement);
        }
        row.remove();
      }
    }
  });

  let touchTimer = null;
  pageElement.addEventListener(
    "touchstart",
    function (e) {
      const checkBox = e.target.closest(".check-box");
      if (!checkBox || checkBox.closest(".form-locked")) return;
      touchTimer = setTimeout(() => {
        checkBox.dataset.longPress = "true";
        if (navigator.vibrate) navigator.vibrate(50);
        checkBox.className = checkBox.className.includes("ng")
          ? "check-box"
          : "check-box ng";
        updateDefectLabelRequirement();
      }, 500);
    },
    { passive: true }
  );
  pageElement.addEventListener("touchend", () => clearTimeout(touchTimer));
  pageElement.addEventListener("touchmove", () => clearTimeout(touchTimer));

  setupDate();
  setupTopControls();
  createMobileCheckboxes();
  populateLegends();
  legendsMobileWrapper.appendChild(legendsMainContainer);
  legendsMainContainer.classList.add("legends-container-compact");
  legendsMainContainer.style.display = "block";
  initializeChoices();
  resetMobileForm();
  render();
  setupAutoSerialIncrement();
  window.activeFormResetter = resetFormWithConfirmation;
}
