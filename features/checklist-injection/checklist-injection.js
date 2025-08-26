import { injectionChecklistData } from "./checklist-injection-data.js";
import { saveData, loadData } from "../../js/utils/store.js";

export function init() {
  console.log("Checklist Injection Initialized! (Mobile-Only)");
  // --- تعریف متغیرهای اصلی ---
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
    console.error(
      "Core elements for Checklist Injection not found. Halting script."
    );
    return;
  }

  // --- متغیرهای وضعیت ---
  let data = [],
    editingIndex = null,
    finalizedData = {};

  let mobileDeviceChoice;

  const choicesConfig = {
    searchPlaceholderValue: "جستجو...",
    removeItemButton: false,
    itemSelectText: "انتخاب",
    noResultsText: "موردی یافت نشد",
    noChoicesText: "گزینه‌ای برای انتخاب وجود ندارد",
    shouldSort: false,
  };

  // --- توابع ---

  function showToast(message, type = "error") {
    const colors = {
      info: "linear-gradient(to right, #0dcaf0, #0d6efd)",
      success: "linear-gradient(to right, #198754, #1D976C)",
      error: "linear-gradient(to right, #dc3545, #ff5f6d)",
      warning: "linear-gradient(to right, #ffc107, #f7b733)",
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
      materials: prefill.materials || [],
      masterbatches: prefill.masterbatches || [],
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
      .map((item) => `${item.name} (${item.percentage}%)`)
      .join(" + ");
  }

  function formatPartsList(partsArray) {
    if (!partsArray || partsArray.length === 0) return "ثبت نشده";
    return partsArray
      .map((part) => `${part.name} (${part.weight}g)`)
      .join("، ");
  }

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
  }

  function createPartRowHTML(part = { name: "", weight: "" }) {
    return `
   <div class="part-row">
    <input type="text" class="name-input" value="${part.name}" placeholder="نام قطعه">
    <input type="number" class="numeric-input" value="${part.weight}" placeholder="وزن (g)">
    <div class="material-buttons">
     <button type="button" class="material-action-btn remove-material-btn">−</button>
     <button type="button" class="material-action-btn add-material-btn">+</button>
    </div>
   </div>`;
  }

  function createMaterialRowHTML(material = { name: "", percentage: "" }) {
    return `
   <div class="material-row">
    <input type="text" class="name-input" value="${material.name}" placeholder="نام ماده">
    <input type="number" class="numeric-input" value="${material.percentage}" placeholder="%">
    <div class="material-buttons">
     <button type="button" class="material-action-btn remove-material-btn">−</button>
     <button type="button" class="material-action-btn add-material-btn">+</button>
    </div>
   </div>`;
  }

  function createMasterbatchRowHTML(
    masterbatch = { name: "", percentage: "" }
  ) {
    return `
   <div class="masterbatch-row">
    <input type="text" class="name-input" value="${masterbatch.name}" placeholder="نام مستربچ">
    <input type="number" class="numeric-input" value="${masterbatch.percentage}" placeholder="%">
    <div class="material-buttons">
     <button type="button" class="material-action-btn remove-material-btn">−</button>
     <button type="button" class="material-action-btn add-material-btn">+</button>
    </div>
   </div>`;
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
     ${
       item.cycleTime
         ? `<span><i class="bi bi-hourglass-split"></i> سیکل: ${item.cycleTime} ثانیه</span>`
         : ""
     }
    </div>`;

      const getCheckSummary = (prop, icon, label) => {
        const ok = (item[prop] || []).filter((s) => s === "ok").length;
        const ng = (item[prop] || []).filter((s) => s === "ng").length;
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

      li.innerHTML = `
    ${headerHTML}
    <div class="summary-card-details">
     ${processInfoHTML}
     ${qualityInfoHTML}
     ${defectsAndNotesHTML}
    </div>`;

      mobileSummaryList.appendChild(li);
    });
    updateDefectLegendsSelection();
  }

  function resetMobileForm() {
    editingIndex = null;
    if (mobileDeviceChoice) mobileDeviceChoice.setChoiceByValue("");

    document.getElementById("mobile-parts-container").innerHTML =
      createPartRowHTML();
    document.getElementById("mobile-materials-container").innerHTML =
      createMaterialRowHTML();
    document.getElementById("mobile-masterbatches-container").innerHTML =
      createMasterbatchRowHTML();

    document.getElementById("mobile-cycleTime").value = "";
    document.getElementById("mobile-defects-summary").value = "";
    document.getElementById("mobile-notes").value = "";

    document
      .querySelectorAll("#mobile-form-wrapper .check-box")
      .forEach((box) => (box.className = "check-box"));

    updateDefectLabelRequirement();

    const addBtn = document.getElementById("mobile-add-btn");
    if (addBtn) {
      addBtn.innerHTML = '<i class="bi bi-check-circle-fill"></i> ثبت و افزودن';
      addBtn.style.backgroundColor = "var(--success-color)";
    }
    updateDefectLegendsSelection();
    document
      .querySelectorAll(".required-field-error")
      .forEach((el) => el.classList.remove("required-field-error"));
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

  function handleCheckClick(e) {
    const checkBox = e.target.closest(".check-box");
    if (!checkBox || checkBox.closest(".form-locked")) return;
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

  function populateMobileForm(item) {
    editingIndex = data.findIndex((d) => d.id === item.id);
    if (mobileDeviceChoice)
      mobileDeviceChoice.setChoiceByValue(item.deviceName || "");

    const partsContainer = document.getElementById("mobile-parts-container");
    partsContainer.innerHTML =
      (item.parts.length > 0 ? item.parts : [{ name: "", weight: "" }])
        .map((part) => createPartRowHTML(part))
        .join("") || createPartRowHTML();

    const materialsContainer = document.getElementById(
      "mobile-materials-container"
    );
    materialsContainer.innerHTML =
      (item.materials.length > 0
        ? item.materials
        : [{ name: "", percentage: "" }]
      )
        .map((mat) => createMaterialRowHTML(mat))
        .join("") || createMaterialRowHTML();

    const masterbatchesContainer = document.getElementById(
      "mobile-masterbatches-container"
    );
    masterbatchesContainer.innerHTML =
      (item.masterbatches.length > 0
        ? item.masterbatches
        : [{ name: "", percentage: "" }]
      )
        .map((mb) => createMasterbatchRowHTML(mb))
        .join("") || createMasterbatchRowHTML();

    document.getElementById("mobile-cycleTime").value = item.cycleTime;
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

  function handleMobileSubmit() {
    const mobileForm = document.querySelector(".mobile-form-container");

    function focusOnInvalidElement(element, message) {
      showToast(message);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        if (element.classList.contains("choices")) {
          element.querySelector("input, select").focus();
        } else if (typeof element.focus === "function") {
          element.focus();
        }
      }
    }

    pageElement
      .querySelectorAll(".required-field-error")
      .forEach((el) => el.classList.remove("required-field-error"));

    const topFields = [
      { id: "date_input", message: "تاریخ اجباری است." },
      { id: "hall_input", message: "انتخاب سالن اجباری است." },
      { id: "shift_input", message: "انتخاب شیفت اجباری است." },
      { id: "time_slot_input", message: "انتخاب ساعت اجباری است." },
    ];
    for (const field of topFields) {
      const element = document.getElementById(field.id);
      if (!element.value.trim()) {
        element.classList.add("required-field-error");
        focusOnInvalidElement(element, field.message);
        return;
      }
    }

    const deviceName = mobileDeviceChoice.getValue(true);
    if (!deviceName) {
      const el = document
        .getElementById("mobile-device-name")
        .closest(".choices");
      el.classList.add("required-field-error");
      focusOnInvalidElement(el, "انتخاب دستگاه اجباری است.");
      return;
    }

    const partRows = document.querySelectorAll(
      "#mobile-parts-container .part-row"
    );
    for (const row of partRows) {
      const nameInput = row.querySelector(".name-input");
      const weightInput = row.querySelector(".numeric-input");
      if (!nameInput.value.trim()) {
        nameInput.classList.add("required-field-error");
        focusOnInvalidElement(nameInput, "نام قطعه اجباری است.");
        return;
      }
      if (!weightInput.value.trim()) {
        weightInput.classList.add("required-field-error");
        focusOnInvalidElement(weightInput, "وزن قطعه اجباری است.");
        return;
      }
    }

    const materialRows = document.querySelectorAll(
      "#mobile-materials-container .material-row"
    );
    for (const row of materialRows) {
      const nameInput = row.querySelector(".name-input");
      const percentInput = row.querySelector(".numeric-input");
      if (!nameInput.value.trim()) {
        nameInput.classList.add("required-field-error");
        focusOnInvalidElement(nameInput, "نام ماده اجباری است.");
        return;
      }
      if (!percentInput.value.trim()) {
        percentInput.classList.add("required-field-error");
        focusOnInvalidElement(percentInput, "درصد ماده اجباری است.");
        return;
      }
    }

    const masterbatchRows = document.querySelectorAll(
      "#mobile-masterbatches-container .masterbatch-row"
    );

    // --- تغییر اصلی اینجاست ---
    // این بلاک کد که مستربچ را اجباری می‌کرد، به طور کامل حذف شد.

    for (const row of masterbatchRows) {
      const nameInput = row.querySelector(".name-input");
      const percentInput = row.querySelector(".numeric-input");
      if (nameInput.value.trim() && !percentInput.value.trim()) {
        percentInput.classList.add("required-field-error");
        focusOnInvalidElement(percentInput, "درصد مستربچ اجباری است.");
        return;
      }
      if (!nameInput.value.trim() && percentInput.value.trim()) {
        nameInput.classList.add("required-field-error");
        focusOnInvalidElement(nameInput, "نام مستربچ اجباری است.");
        return;
      }
    }

    let totalPercentage = 0;
    materialRows.forEach((row) => {
      const percent =
        parseFloat(row.querySelector(".numeric-input").value) || 0;
      totalPercentage += percent;
    });
    masterbatchRows.forEach((row) => {
      // فقط در صورتی درصد مستربچ را حساب کن که نام آن هم وارد شده باشد
      if (row.querySelector(".name-input").value.trim()) {
        const percent =
          parseFloat(row.querySelector(".numeric-input").value) || 0;
        totalPercentage += percent;
      }
    });

    if (Math.abs(totalPercentage - 100) > 0.01) {
      focusOnInvalidElement(
        materialRows[0].querySelector(".numeric-input"),
        `مجموع درصد مواد و مستربچ باید ۱۰۰٪ باشد (مقدار فعلی: ${totalPercentage.toFixed(
          2
        )}٪)`
      );
      return;
    }

    const cycleTimeInput = document.getElementById("mobile-cycleTime");
    if (!cycleTimeInput.value.trim()) {
      cycleTimeInput.classList.add("required-field-error");
      focusOnInvalidElement(cycleTimeInput, "سیکل زمانی اجباری است.");
      return;
    }

    const checkGroups = [
      { prop: "appearance", name: "ظاهری" },
      { prop: "assembly", name: "مونتاژی" },
      { prop: "packaging", name: "بسته‌بندی" },
    ];
    for (const check of checkGroups) {
      const group = mobileForm.querySelector(
        `.check-group[data-prop="${check.prop}"]`
      );
      let allChecked = true;
      for (const box of group.children) {
        if (!box.classList.contains("ok") && !box.classList.contains("ng")) {
          allChecked = false;
          break;
        }
      }
      if (!allChecked) {
        group.classList.add("required-field-error");
        focusOnInvalidElement(
          group,
          `لطفاً تمام موارد چک‌لیست "${check.name}" را مشخص کنید.`
        );
        return;
      }
    }

    const isAnyNgChecked = mobileForm.querySelector(".check-box.ng");
    const defectsInput = document.getElementById("mobile-defects-summary");
    if (isAnyNgChecked && !defectsInput.value.trim()) {
      defectsInput.classList.add("required-field-error");
      focusOnInvalidElement(
        defectsInput,
        "در صورت وجود نقص (NG)، شرح نقص اجباری است."
      );
      return;
    }

    const parts = Array.from(partRows).map((row) => ({
      name: row.querySelector(".name-input").value.trim(),
      weight: parseFloat(row.querySelector(".numeric-input").value),
    }));

    const materials = Array.from(materialRows).map((row) => ({
      name: row.querySelector(".name-input").value.trim(),
      percentage: parseFloat(row.querySelector(".numeric-input").value),
    }));

    const masterbatches = Array.from(masterbatchRows)
      .filter((row) => row.querySelector(".name-input").value.trim())
      .map((row) => ({
        name: row.querySelector(".name-input").value.trim(),
        percentage: parseFloat(row.querySelector(".numeric-input").value),
      }));

    const mobileData = {
      deviceName,
      parts,
      materials,
      masterbatches,
      cycleTime: document.getElementById("mobile-cycleTime").value,
      defectsSummary: defectsInput.value.trim(),
      notes: document.getElementById("mobile-notes").value.trim(),
      appearance: [],
      assembly: [],
      packaging: [],
    };

    ["appearance", "assembly", "packaging"].forEach((prop) => {
      const group = mobileForm.querySelector(
        `.check-group[data-prop="${prop}"]`
      );
      for (let box of group.children) {
        let state = null;
        if (box.classList.contains("ok")) state = "ok";
        else if (box.classList.contains("ng")) state = "ng";
        mobileData[prop].push(state);
      }
    });

    if (editingIndex !== null && data[editingIndex]) {
      data[editingIndex] = { ...data[editingIndex], ...mobileData };
      const successMessage = `${editingIndex + 1}. ${mobileData.deviceName} (${
        mobileData.parts[0].name
      }) با موفقیت به‌روزرسانی شد.`;
      showToast(successMessage, "success");
    } else {
      const successMessage = `${data.length + 1}. ${mobileData.deviceName} (${
        mobileData.parts[0].name
      }) با موفقیت ثبت شد.`;
      data.push(createNewItem(mobileData));
      showToast(successMessage, "success");
    }
    render();
    resetMobileForm();
  }

  function finalizeForm() {
    if (data.length === 0) {
      showToast("هیچ ردیفی برای ثبت نهایی وجود ندارد.", "warning");
      return;
    }

    const errors = [];
    const topControls = document.querySelector(".top-controls");
    const approversContainer = document.querySelector(".approvers-container");

    topControls
      .querySelectorAll(".required-field-error")
      .forEach((el) => el.classList.remove("required-field-error"));
    approversContainer
      .querySelectorAll(".required-field-error")
      .forEach((el) => el.classList.remove("required-field-error"));

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
    if (!allApproversFilled) {
      errors.push("نام تمام تاییدکنندگان باید وارد شود.");
    }

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
      "قطعات و وزن‌ها",
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
      const clean = (cell) =>
        `"${(cell || "").toString().replace(/"/g, '""')}"`;
      const ok = (prop) => (item[prop] || []).filter((s) => s === "ok").length;
      const ng = (prop) => (item[prop] || []).filter((s) => s === "ng").length;

      const partsString = formatPartsList(item.parts);
      const materialsString = formatCompoundList(item.materials);
      const masterbatchesString = formatCompoundList(item.masterbatches);

      const row = [
        index + 1,
        globalInfo.date,
        globalInfo.hall,
        globalInfo.shift,
        globalInfo.time,
        item.deviceName,
        partsString,
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
    toggleButtonLoading(exportButton, true, "در حال آماده سازی...");

    const { globalInfo, tableData } = finalizedData;
    const printContainer = document.querySelector(".print-page-container");

    // --- شروع تغییرات ---
    // مقادیر ثابت رو اینجا تعریف می‌کنیم که خواناتر باشه
    const PAGE_MAX_HEIGHT = 1058;
    const PAGE_WIDTH = 718;
    // --- پایان تغییرات ---

    const baseFileName = `چک‌لیست_تزریق_${globalInfo.date.replace(
      /\//g,
      "."
    )}_${globalInfo.shift}`;

    const buildFullPageHTML = (itemsHTML, currentPage, totalPages) => {
      const originalHeaderClone = document
        .getElementById("main-header")
        .cloneNode(true);
      const approvalHTML = `<div class="approvers-container"><div class="approver-group"><label>۱.بازرس کنترل کیفیت:</label><span class="approver-group-name">${globalInfo.qc}</span></div><div class="approver-group"><label>۲. سرپرست شیفت:</label><span class="approver-group-name">${globalInfo.prod}</span></div><div class="approver-group"><label>۳. سرپرست کنترل کیفیت:</label><span class="approver-group-name">${globalInfo.shiftManager}</span></div></div>`;
      const topInfoHTML = `<div class="export-top-info"><div><strong>تاریخ:</strong> ${globalInfo.date}</div><div><strong>سالن:</strong> ${globalInfo.hall}</div><div><strong>شیفت:</strong> ${globalInfo.shift}</div><div><strong>ساعت:</strong> ${globalInfo.time}</div></div>`;
      const pageFooterHTML = `<footer>صفحه ${currentPage} از ${totalPages}</footer>`;
      const footerGroupHTML = `<div class="print-footer-group">${approvalHTML}${pageFooterHTML}</div>`;
      return `${originalHeaderClone.outerHTML}${topInfoHTML}<div class="export-items-list">${itemsHTML}</div>${footerGroupHTML}`;
    };

    const createItemCardHTML = (item, index) => {
      const partNamesText =
        item.parts && item.parts.length > 0
          ? item.parts.map((p) => p.name).join("، ")
          : "قطعه نامشخص";
      const headerHTML = `
  <div class="summary-card-header">
  <h2 class="summary-card-title">${index + 1}. ${
        item.deviceName
      } = <strong class="summary-part-name">${partNamesText}</strong></h2>
  <span class="summary-timestamp"><i class="bi bi-clock"></i> ${
    item.timestamp
  }</span>
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
  ${
    item.cycleTime
      ? `<span><i class="bi bi-hourglass-split"></i> سیکل: ${item.cycleTime} ثانیه</span>`
      : ""
  }
  </div>`;

      const getCheckSummary = (prop, icon, label) => {
        const ok = (item[prop] || []).filter((s) => s === "ok").length;
        const ng = (item[prop] || []).filter((s) => s === "ng").length;
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

      return `
  <div class="summary-card-item">
  ${headerHTML}
  <div class="summary-card-details">
   ${processInfoHTML}
   ${qualityInfoHTML}
   ${defectsAndNotesHTML}
  </div>
  </div>`;
    };

    const pages = [];
    let currentPageItemsHTML = "";
    const allItemCardsHTML = tableData.map(createItemCardHTML);

    // --- شروع تغییرات ---
    printContainer.style.visibility = "hidden";
    printContainer.style.display = "flex";

    // ۱. ارتفاع را موقتاً auto می‌کنیم تا بتوانیم ارتفاع واقعی محتوا را اندازه بگیریم
    printContainer.style.height = "auto";

    for (const itemHTML of allItemCardsHTML) {
      const potentialHTML = currentPageItemsHTML + itemHTML;
      printContainer.innerHTML = buildFullPageHTML(potentialHTML, 1, 1);
      await new Promise((resolve) => setTimeout(resolve, 0));

      // حالا scrollHeight به درستی کار می‌کند
      if (
        printContainer.scrollHeight > PAGE_MAX_HEIGHT &&
        currentPageItemsHTML !== ""
      ) {
        pages.push(currentPageItemsHTML);
        currentPageItemsHTML = itemHTML;
      } else {
        currentPageItemsHTML = potentialHTML;
      }
    }
    if (currentPageItemsHTML !== "") {
      pages.push(currentPageItemsHTML);
    }

    // ۲. ارتفاع را به حالت اولیه (مقدار تعریف شده در CSS) برمی‌گردانیم
    printContainer.style.height = "";

    const totalPages = pages.length;
    for (let i = 0; i < totalPages; i++) {
      const pageItemsHTML = pages[i];
      const currentPage = i + 1;
      printContainer.innerHTML = buildFullPageHTML(
        pageItemsHTML,
        currentPage,
        totalPages
      );
      printContainer.style.visibility = "visible";
      try {
        await new Promise((resolve) => setTimeout(resolve, 200));

        // ۳. (بهبود): ابعاد را به صورت صریح به html2canvas می‌دهیم تا مطمئن‌تر عمل کند
        const canvas = await html2canvas(printContainer, {
          useCORS: true,
          scale: 2,
          width: PAGE_WIDTH,
          height: PAGE_MAX_HEIGHT,
          windowWidth: printContainer.scrollWidth,
          windowHeight: printContainer.scrollHeight,
        });
        // --- پایان تغییرات ---

        const fileName =
          totalPages > 1
            ? `${baseFileName} (صفحه ${currentPage} از ${totalPages}).png`
            : `${baseFileName}.png`;
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (totalPages > 1)
          await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`خطا در ایجاد تصویر صفحه ${currentPage}:`, err);
        showToast(`خطا در ایجاد خروجی تصویر.`, "error");
      } finally {
        printContainer.style.visibility = "hidden";
      }
    }
    printContainer.style.display = "none";
    printContainer.style.height = ""; // اطمینان از ریست شدن استایل در انتها
    printContainer.innerHTML = "";
    toggleButtonLoading(
      exportButton,
      false,
      `<i class="bi bi-camera-fill"></i> خروجی تصویر فرم`
    );
  }

  function toggleButtonLoading(button, isLoading, text) {
    if (button) {
      button.disabled = isLoading;
      button.innerHTML = text;
    }
  }

  function initializeChoices() {
    mobileDeviceChoice = new Choices(
      document.getElementById("mobile-device-name"),
      choicesConfig
    );
    mobileDeviceChoice.setChoices(
      getChoicesArray(injectionChecklistData.devices),
      "value",
      "label",
      true
    );
  }

  function addSafeEventListener(selector, event, handler) {
    const element = pageElement.querySelector(selector);
    if (element) element.addEventListener(event, handler);
    else console.warn(`Element "${selector}" not found.`);
  }

  function handleDefectClick(e) {
    const li = e.target.closest(".legends-list li");
    if (!li) return;
    const defectName = li.dataset.defectName;
    const targetInput = document.getElementById("mobile-defects-summary");
    const currentDefects = new Set(
      targetInput.value ? targetInput.value.split(" | ") : []
    );
    if (currentDefects.has(defectName)) {
      currentDefects.delete(defectName);
    } else {
      currentDefects.add(defectName);
    }
    targetInput.value = Array.from(currentDefects).join(" | ");
    updateDefectLegendsSelection();
  }

  function updateDefectLegendsSelection() {
    let activeDefects = new Set();
    const mobileInput = document.getElementById("mobile-defects-summary");
    if (mobileInput && mobileInput.value) {
      activeDefects = new Set(mobileInput.value.split(" | "));
    }
    document.querySelectorAll(".legends-list li").forEach((li) => {
      li.classList.toggle("selected", activeDefects.has(li.dataset.defectName));
    });
  }

  // --- راه‌اندازی اولیه و ثبت Event Listener ها ---
  addSafeEventListener("#finalize-btn", "click", finalizeForm);
  addSafeEventListener("#export-csv-btn", "click", exportToCSV);
  addSafeEventListener("#export-img-btn", "click", exportToImage);
  addSafeEventListener("#mobile-add-btn", "click", handleMobileSubmit);

  legendsMainContainer.addEventListener("click", handleDefectClick);
  pageElement.addEventListener("click", handleCheckClick);

  pageElement.addEventListener("click", (e) => {
    const delBtn = e.target.closest(".summary-delete-btn");
    const editBtn = e.target.closest(".summary-edit-btn");
    if (delBtn) {
      const id = Number(delBtn.closest("[data-id]").dataset.id);
      deleteItem(id);
    }
    if (editBtn) {
      const id = Number(editBtn.closest("[data-id]").dataset.id);
      const item = data.find((i) => i.id === id);
      if (item) populateMobileForm(item);
    }
  });

  pageElement.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".add-material-btn");
    const removeBtn = e.target.closest(".remove-material-btn");

    if (addBtn) {
      const container = addBtn.closest(".dynamic-list-wrapper");
      let newRowHTML = "";
      switch (container.id) {
        case "mobile-parts-container":
          newRowHTML = createPartRowHTML();
          break;
        case "mobile-materials-container":
          newRowHTML = createMaterialRowHTML();
          break;
        case "mobile-masterbatches-container":
          newRowHTML = createMasterbatchRowHTML();
          break;
      }
      if (newRowHTML) container.insertAdjacentHTML("beforeend", newRowHTML);
    }

    if (removeBtn) {
      const row = removeBtn.closest(
        ".part-row, .material-row, .masterbatch-row"
      );
      if (row && row.parentElement.children.length > 1) {
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

  // --- اجرای توابع راه‌اندازی ---
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
  window.activeFormResetter = resetFormWithConfirmation;
}
