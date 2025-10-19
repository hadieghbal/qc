import { scrapFormData } from "./scrap-form-data.js";

export function init() {
  console.log("Scrap Form Initialized! (BOM System v1.1 - Sticky Model)");
  // --- تعریف متغیرهای اصلی ---
  const Swal = window.Swal,
    Toastify = window.Toastify,
    Choices = window.Choices,
    html2canvas = window.html2canvas;

  const pageElement = document.getElementById("scrap-form-page");
  const tableBody = document.getElementById("main-table-body");
  const legendsContainer = document.getElementById("legends-container");

  if (!pageElement || !tableBody || !legendsContainer) {
    console.error("Core elements for Scrap Form not found.");
    return;
  }

  const mobileForm = {
    bomProductType: document.getElementById("bom-product-type"),
    bomModel: document.getElementById("bom-model"),
    bomPartName: document.getElementById("bom-part-name"),
    bomPartCode: document.getElementById("bom-part-code"),
    totalCount: document.getElementById("mobile-total-count"),
    group: document.getElementById("mobile-group"),
    item: document.getElementById("mobile-item"),
    supplierInjection: document.getElementById("mobile-supplier-injection"),
    supplierPress: document.getElementById("mobile-supplier-press"),
    supplierInternal: document.getElementById("mobile-supplier-internal"),
    supplierExternal: document.getElementById("mobile-supplier-external"),
    sourcePackaging: document.getElementById("mobile-source-packaging"),
    sourceWarehouse: document.getElementById("mobile-source-warehouse"),
    sourceProduction: document.getElementById("mobile-source-production"),
    defectsSummary: document.getElementById("mobile-defects-summary"),
    comments: document.getElementById("mobile-comments"),
    addBtn: document.getElementById("mobile-add-btn"),
    summaryList: document.getElementById("mobile-summary-list"),
  };

  // --- متغیرهای وضعیت ---
  let bomProductTypeChoice, bomModelChoice, bomPartNameChoice;
  let editingRowIndex = null;
  let finalizedFormData = {};
  let bomData = null;

  // --- تنظیمات کتابخانه Choices.js ---
  const choicesConfig = {
    searchPlaceholderValue: "جستجو...",
    removeItemButton: false,
    itemSelectText: "انتخاب",
    noResultsText: "موردی یافت نشد",
    noChoicesText: "گزینه‌ای برای انتخاب وجود ندارد",
    shouldSort: false,
  };

  // ===================================================================
  // BOM (Bill of Materials) Logic
  // ===================================================================
  async function fetchBomData() {
    try {
      const response = await fetch("bom/bom-data.json");
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      bomData = await response.json();
      console.log("BOM data loaded successfully.");
      return bomData;
    } catch (error) {
      console.error("Failed to load BOM data:", error);
      Swal.fire({
        icon: "error",
        title: "خطا در بارگذاری اطلاعات قطعات",
        text: "فایل اطلاعات پایه قطعات (bom-data.json) یافت نشد. لطفاً از ساخت صحیح آن اطمینان حاصل کنید.",
      });
      return null;
    }
  }

  function initializeBomSelectors() {
    fetchBomData().then((data) => {
      if (!data || Object.keys(data).length === 0) {
        bomProductTypeChoice.disable();
        bomProductTypeChoice.setChoices([
          { value: "", label: "اطلاعات BOM یافت نشد", disabled: true },
        ]);
        return;
      }
      populateProductTypes(Object.keys(data));
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
    mobileForm.bomPartCode.value = "";
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
    mobileForm.bomPartCode.value = "";
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
    const selectedType = bomProductTypeChoice.getValue(true);
    const selectedModel = bomModelChoice.getValue(true);
    const selectedPartName = event.detail.value;
    mobileForm.bomPartCode.value = "";
    if (selectedType && selectedModel && selectedPartName) {
      const part = bomData[selectedType][selectedModel].find(
        (p) => p.name === selectedPartName
      );
      if (part) {
        mobileForm.bomPartCode.value = part.code;
      }
    }
  }

  // ===== توابع کمکی =====
  function toEnglishDigits(str) {
    if (!str) return "";
    return str
      .toString()
      .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
  }

  function showToast(message, type = "info") {
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
      style: { background: colors[type] || colors.info },
    }).showToast();
  }

  function toggleButtonLoading(button, isLoading, text) {
    if (button) {
      button.disabled = isLoading;
      button.innerHTML = text;
    }
  }

  function downloadFile(content, fileName, contentType) {
    if (window.AppInventor && window.AppInventor.setWebViewString) {
      let base64data = "";
      if (content.startsWith("data:")) base64data = content.split(",")[1];
      else base64data = btoa(unescape(encodeURIComponent(content)));
      const payload = JSON.stringify({ filename: fileName, data: base64data });
      window.AppInventor.setWebViewString(payload);
    } else {
      const link = document.createElement("a");
      const url =
        contentType && !content.startsWith("data:")
          ? URL.createObjectURL(new Blob([content], { type: contentType }))
          : content;
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (contentType && !content.startsWith("data:")) URL.revokeObjectURL(url);
    }
  }

  async function inlineAllStyles(element) {
    const styleSheets = Array.from(document.styleSheets);
    let cssText = "";
    for (const sheet of styleSheets) {
      if (sheet.href) {
        try {
          const response = await fetch(sheet.href);
          if (response.ok) {
            const text = await response.text();
            cssText += text + "\n";
          }
        } catch (e) {
          console.warn(
            "Could not fetch stylesheet for inlining:",
            sheet.href,
            e
          );
        }
      }
    }
    const styleElement = document.createElement("style");
    styleElement.textContent = cssText;
    element.prepend(styleElement);
  }

  function generateBaseFileName(globalInfo) {
    const date = globalInfo.globalDate.replace(/\//g, ".");
    const line = globalInfo.globalLine.replace(/\s/g, "_");
    const type = globalInfo.wasteType === "برقی" ? "برقی" : "غیربرقی";
    return `گزارش ضایعات ${date} - ${line} - ${type}`;
  }

  // ===== توابع مدیریت فرم =====

  function resetForm() {
    if (tableBody) tableBody.innerHTML = "";
    if (mobileForm.summaryList) mobileForm.summaryList.innerHTML = "";
    resetMobileForm();
    const dateInput = document.getElementById("jalali_date");
    const today = new Date();
    const formatter = new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      calendar: "persian",
    });
    if (dateInput) dateInput.value = formatter.format(today);
    const lineSelect = document.getElementById("line");
    if (lineSelect) lineSelect.selectedIndex = 0;

    const wasteTypeSelect = document.getElementById("waste_type_select");
    if (wasteTypeSelect) wasteTypeSelect.value = "غیربرقی";

    document.getElementById("approver-control").value = "";
    document.getElementById("approver-line").value = "";
    document.getElementById("approver-eng").value = "";
    finalizedFormData = {};
    pageElement.classList.remove("form-locked");
    pageElement
      .querySelectorAll("input, select, button")
      .forEach((el) => (el.disabled = false));

    if (bomProductTypeChoice) bomProductTypeChoice.enable();
    if (bomModelChoice) bomModelChoice.enable();
    if (bomPartNameChoice) bomPartNameChoice.enable();

    const finalizeBtn = pageElement.querySelector(".finalize-btn");
    if (finalizeBtn)
      finalizeBtn.innerHTML = `<i class="bi bi-check2-circle"></i> ثبت نهایی فرم`;
    pageElement.querySelector(".export-btn").style.display = "none";
    pageElement.querySelector(".export-img-btn").style.display = "none";
    pageElement.querySelector(".export-pdf-btn").style.display = "none";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetFormWithConfirmation() {
    Swal.fire({
      title: "ریست کردن فرم",
      text: "آیا مطمئن هستید؟ تمام اطلاعات وارد شده پاک خواهد شد.",
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

  // [جدید] تابع ریست سبک فقط برای فیلدهای قطعه
  function resetPartSpecificFields() {
    editingRowIndex = null;

    // پاک کردن ارورهای ولیدیشن
    document
      .querySelectorAll(
        "#mobile-form-wrapper [data-required-name], #mobile-form-wrapper .choices"
      )
      .forEach((el) => {
        const parent =
          el.closest(".mobile-form-group") || el.closest(".bom-selector-item");
        if (parent) parent.classList.remove("required-field-error");
      });

    // فقط فیلدهای مربوط به قطعه ریست می‌شوند
    if (bomPartNameChoice) bomPartNameChoice.clearInput();
    mobileForm.bomPartCode.value = "";

    const fieldsToReset = [
      "totalCount",
      //"group",
      //"item",
      "supplierInjection",
      "supplierPress",
      "supplierInternal",
      "supplierExternal",
      "sourcePackaging",
      "sourceWarehouse",
      "sourceProduction",
      "defectsSummary",
      "comments",
    ];

    fieldsToReset.forEach((key) => {
      const el = mobileForm[key];
      if (el && el.tagName) {
        if (el.type === "number") el.value = key === "totalCount" ? "1" : "0";
        else if (el.tagName === "SELECT") el.selectedIndex = 0;
        else el.value = "";
      }
    });

    mobileForm.addBtn.innerHTML =
      '<i class="bi bi-check-circle-fill"></i> ثبت و افزودن به لیست';
    mobileForm.addBtn.style.backgroundColor = "var(--success-color)";
    updateDefectLegendsSelection();

    // فوکوس روی فیلد نام قطعه برای ورود سریع بعدی
    setTimeout(() => {
      // ✅ این روش صحیح برای چک کردن وضعیت در کتابخانه Choices.js است
      if (bomPartNameChoice && !mobileForm.bomPartName.disabled) {
        bomPartNameChoice.showDropdown();
        bomPartNameChoice.input.focus();
      }
    }, 100);
  }

  // این تابع برای ریست کامل فرم (مثلا با دکمه ریست کلی) استفاده می‌شود
  function resetMobileForm() {
    editingRowIndex = null;

    document
      .querySelectorAll("#mobile-form-wrapper .required-field-error")
      .forEach((el) => el.classList.remove("required-field-error"));

    if (bomProductTypeChoice) bomProductTypeChoice.clearStore();
    if (bomModelChoice) bomModelChoice.clearStore();
    if (bomPartNameChoice) bomPartNameChoice.clearStore();

    if (bomData && bomProductTypeChoice) {
      populateProductTypes(Object.keys(bomData));
      bomProductTypeChoice.enable();
    }
    if (bomModelChoice) bomModelChoice.disable();
    if (bomPartNameChoice) bomPartNameChoice.disable();

    resetPartSpecificFields();
  }

  function createRowHTML() {
    const groupOptionsHTML = (scrapFormData.groups || [])
      .map((g) => `<option value="${g}">${g}</option>`)
      .join("");
    return `
      <td></td>
      <td><input type="hidden" name="product_type"></td>
      <td><input type="hidden" name="product_model"></td>
      <td><input type="hidden" name="part_code"></td>
      <td><select name="group">${groupOptionsHTML}</select></td>
      <td><input type="number" name="item"></td>
      <td><select name="part_name"></select></td>
      <td><input type="number" name="total_count"></td>
      <td><input type="number" name="supplier_injection"></td>
      <td><input type="number" name="supplier_press"></td>
      <td><input type="number" name="supplier_internal"></td>
      <td><input type="number" name="supplier_external"></td>
      <td><input type="number" name="source_packaging"></td>
      <td><input type="number" name="source_warehouse"></td>
      <td><input type="number" name="source_production"></td>
      <td><input type="text" name="defects_summary" readonly></td>
      <td><input type="text" name="comments"></td>
      <td><input type="hidden" name="timestamp"></td>
      <td></td>
    `;
  }

  function addRow(fromMobileData) {
    const newRow = tableBody.insertRow();
    newRow.innerHTML = createRowHTML();
    Object.keys(fromMobileData).forEach((key) => {
      const input = newRow.querySelector(`[name="${key}"]`);
      if (input) {
        if (key === "part_name" || key === "group") {
          const option = document.createElement("option");
          option.value = fromMobileData[key];
          option.textContent = fromMobileData[key];
          input.innerHTML = "";
          input.appendChild(option);
        }
        input.value = fromMobileData[key];
      }
    });
    Array.from(tableBody.rows).forEach(
      (row, index) => (row.cells[0].textContent = index + 1)
    );
  }

  function deleteRow(rowToDelete) {
    if (!rowToDelete) return;
    rowToDelete.remove();
    updateMobileSummary();
    Array.from(tableBody.rows).forEach(
      (row, index) => (row.cells[0].textContent = index + 1)
    );
  }

  function confirmDeleteRow(rowElement) {
    if (!rowElement) return;
    const partName =
      rowElement.querySelector('[name="part_name"]').value || "این قطعه";
    Swal.fire({
      title: "حذف قطعه",
      text: `آیا از حذف "${partName}" اطمینان دارید؟`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف کن",
      cancelButtonText: "انصراف",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteRow(rowElement);
      }
    });
  }

  async function startEditing(rowToEdit) {
    if (!rowToEdit) return;
    editingRowIndex = Array.from(tableBody.children).indexOf(rowToEdit);
    const data = Object.fromEntries(
      Array.from(rowToEdit.querySelectorAll("input, select")).map((el) => [
        el.name,
        el.value,
      ])
    );

    mobileForm.totalCount.value = data.total_count;
    mobileForm.group.value = data.group;
    mobileForm.item.value = data.item;
    mobileForm.supplierInjection.value = data.supplier_injection;
    mobileForm.supplierPress.value = data.supplier_press;
    mobileForm.supplierInternal.value = data.supplier_internal;
    mobileForm.supplierExternal.value = data.supplier_external;
    mobileForm.sourcePackaging.value = data.source_packaging;
    mobileForm.sourceWarehouse.value = data.source_warehouse;
    mobileForm.sourceProduction.value = data.source_production;
    mobileForm.defectsSummary.value = data.defects_summary;
    mobileForm.comments.value = data.comments;

    await bomProductTypeChoice.setChoiceByValue(data.product_type);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await bomModelChoice.setChoiceByValue(data.product_model);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await bomPartNameChoice.setChoiceByValue(data.part_name);

    mobileForm.bomPartCode.value = data.part_code || "";
    mobileForm.addBtn.innerHTML =
      '<i class="bi bi-check-circle-fill"></i> به‌روزرسانی قطعه';
    mobileForm.addBtn.style.backgroundColor = "var(--primary-color)";
    updateDefectLegendsSelection();
    document
      .querySelector(".mobile-form-container")
      .scrollIntoView({ behavior: "smooth" });
  }

  function getGlobalData() {
    if (Object.keys(finalizedFormData).length > 0) return finalizedFormData;
    const wasteTypeSelect = document.getElementById("waste_type_select");
    return {
      globalDate: document.getElementById("jalali_date").value.trim(),
      globalLine: document.getElementById("line").value,
      wasteType: wasteTypeSelect ? wasteTypeSelect.value : "غیربرقی",
      approverControl: document.getElementById("approver-control").value.trim(),
      approverLine: document.getElementById("approver-line").value.trim(),
      approverEng: document.getElementById("approver-eng").value.trim(),
    };
  }

  function finalizeForm() {
    if (!validateAllForms()) return;
    const controlApprover = document.getElementById("approver-control");
    const lineApprover = document.getElementById("approver-line");
    const engApprover = document.getElementById("approver-eng");
    let firstInvalidApprover = null;
    if (!controlApprover.value.trim()) firstInvalidApprover = controlApprover;
    else if (!lineApprover.value.trim()) firstInvalidApprover = lineApprover;
    else if (!engApprover.value.trim()) firstInvalidApprover = engApprover;
    if (firstInvalidApprover) {
      showToast(
        "برای ثبت نهایی، لطفاً نام تمام تایید کنندگان را وارد کنید.",
        "warning"
      );
      firstInvalidApprover.classList.add("required-field-error");
      firstInvalidApprover.focus();
      return;
    }
    Swal.fire({
      title: "ثبت نهایی و دریافت خروجی‌ها",
      text: "آیا از ثبت نهایی فرم اطمینان دارید؟ پس از تایید، فرم قفل شده و تمام خروجی‌ها به صورت خودکار دانلود خواهند شد.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "بله، ثبت و دانلود کن!",
      cancelButtonText: "انصراف",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const globalData = getGlobalData();
        const tableData = [];
        tableBody.querySelectorAll("tr").forEach((row) => {
          if (row.querySelector('[name="part_name"]').value) {
            const rowData = Object.fromEntries(
              Array.from(row.querySelectorAll("input, select")).map((el) => [
                el.name,
                el.value,
              ])
            );
            tableData.push(rowData);
          }
        });
        finalizedFormData = { ...globalData, tableData };
        lockForm();

        try {
          showToast("فرم ثبت شد. در حال آماده‌سازی خروجی‌ها...", "info");
          await exportToImage();
          await exportToPDF();
          await exportToCSV();
          showToast("تمام خروجی‌ها با موفقیت ایجاد شدند.", "success");
        } catch (error) {
          console.error("خطا در فرآیند دریافت خروجی‌ها:", error);
          showToast("دریافت یکی از خروجی‌ها با خطا مواجه شد.", "error");
        }
      }
    });
  }

  function lockForm() {
    pageElement.classList.add("form-locked");
    pageElement
      .querySelectorAll("input, select")
      .forEach((el) => (el.disabled = true));

    if (bomProductTypeChoice) bomProductTypeChoice.disable();
    if (bomModelChoice) bomModelChoice.disable();
    if (bomPartNameChoice) bomPartNameChoice.disable();

    pageElement
      .querySelectorAll(
        ".action-btn, .action-btn-icon, .summary-actions button, .counter-btn"
      )
      .forEach((btn) => {
        if (
          !btn.classList.contains("export-btn") &&
          !btn.classList.contains("export-img-btn") &&
          !btn.classList.contains("export-pdf-btn")
        ) {
          btn.disabled = true;
        }
      });
    const finalizeBtn = pageElement.querySelector(".finalize-btn");
    finalizeBtn.innerHTML = `<i class="bi bi-lock-fill"></i> نهایی شده`;
    pageElement.querySelector(".export-btn").style.display = "none";
    pageElement.querySelector(".export-img-btn").style.display = "none";
    pageElement.querySelector(".export-pdf-btn").style.display = "none";
  }

  // ===== توابع مربوط به خروجی‌ها =====
  function exportToCSV() {
    return new Promise((resolve, reject) => {
      if (Object.keys(finalizedFormData).length === 0) {
        const err = new Error("Form not finalized before exporting to CSV.");
        showToast("لطفا ابتدا فرم را ثبت نهایی کنید.", "warning");
        return reject(err);
      }

      try {
        const { tableData, ...globalInfo } = finalizedFormData;
        const fileName = generateBaseFileName(globalInfo);
        const headers = [
          "تاریخ",
          "خط",
          "نوع ضایعات",
          "ردیف",
          "نوع محصول",
          "مدل محصول",
          "کد قطعه",
          "نام قطعه",
          "گروه",
          "آیتم",
          "تعداد کل",
          "تامین کننده-تزریق",
          "تامین کننده-پرسکاری",
          "تامین کننده-داخلی",
          "تامین کننده-خارجی",
          "منشا-بسته بندی",
          "منشا-انبار",
          "منشا-حین تولید",
          "شرح ضایعات",
          "توضیحات",
          "تایید کننده کنترل",
          "تایید کننده خط",
          "تایید کننده فنی",
        ];
        let csvContent = "\uFEFF" + headers.join(",") + "\r\n";
        tableData.forEach((data, index) => {
          const cleanCell = (cellData) =>
            `"${(cellData || "").toString().replace(/"/g, '""')}"`;
          const rowDataValues = [
            globalInfo.globalDate,
            globalInfo.globalLine,
            globalInfo.wasteType,
            index + 1,
            data.product_type,
            data.product_model,
            data.part_code,
            data.part_name,
            data.group,
            data.item,
            data.total_count,
            data.supplier_injection,
            data.supplier_press,
            data.supplier_internal,
            data.supplier_external,
            data.source_packaging,
            data.source_warehouse,
            data.source_production,
            data.defects_summary,
            data.comments,
            globalInfo.approverControl,
            globalInfo.approverLine,
            globalInfo.approverEng,
          ];
          csvContent += rowDataValues.map(cleanCell).join(",") + "\r\n";
        });
        downloadFile(csvContent, `${fileName}.csv`, "text/csv;charset=utf-8;");
        resolve();
      } catch (error) {
        console.error("خطا در ایجاد خروجی CSV:", error);
        showToast("دانلود فایل CSV با مشکل مواجه شد.", "error");
        reject(error);
      }
    });
  }

  async function exportToImage() {
    if (Object.keys(finalizedFormData).length === 0) {
      showToast("لطفا ابتدا فرم را ثبت نهایی کنید.", "warning");
      throw new Error("Form not finalized before exporting to Image.");
    }
    const exportButton = pageElement.querySelector(".export-img-btn");
    toggleButtonLoading(exportButton, true, "در حال آماده سازی تصویر...");
    const printContainerOriginal = document.querySelector(
      ".print-page-container"
    );
    const printContainer = printContainerOriginal.cloneNode(true);
    printContainer.style.position = "absolute";
    printContainer.style.left = "-9999px";
    printContainer.style.visibility = "visible";
    printContainer.style.opacity = "1";
    document.body.appendChild(printContainer);

    try {
      const { tableData, ...globalInfo } = finalizedFormData;
      const baseFileName = generateBaseFileName(globalInfo);

      const buildFullPageHTML = (itemsHTML) => {
        const originalHeaderClone = document
          .getElementById("main-header")
          .cloneNode(true);
        const approvalHTML = `<div class="approvers-container"><div class="approver-group"><label>1. نماینده کنترل:</label><span class="approver-group-name">${globalInfo.approverControl}</span></div><div class="approver-group"><label>2. نماینده تولید:</label><span class="approver-group-name">${globalInfo.approverLine}</span></div><div class="approver-group"><label>3. نماینده فنی و مهندسی:</label><span class="approver-group-name">${globalInfo.approverEng}</span></div></div>`;
        const topInfoHTML = `<div class="export-top-info"><div><strong>تاریخ:</strong> ${globalInfo.globalDate}</div><div><strong>خط:</strong> ${globalInfo.globalLine}</div><div><strong>نوع ضایعات:</strong> ${globalInfo.wasteType}</div></div>`;
        const pageFooterHTML = `<footer>صفحه ۱ از ۱</footer>`;
        const footerGroupHTML = `<div class="print-footer-group">${approvalHTML}${pageFooterHTML}</div>`;
        return `${originalHeaderClone.outerHTML}${topInfoHTML}<div class="export-items-list">${itemsHTML}</div>${footerGroupHTML}`;
      };

      const createItemCardHTML = (item, index) => {
        const titleHTML = `${index + 1}. ${
          item.part_name
        } <span style="font-weight: 500; color: var(--secondary-color); font-size: 13px;">(${
          item.product_model
        })</span>`;
        const headerHTML = `<div class="summary-card-header"><h2 class="summary-card-title">${titleHTML}</h2><div class="summary-card-meta" style="display: flex; align-items: center; gap: 12px; font-size: 11px; color: var(--secondary-color);"><span class="summary-timestamp" style="display: flex; align-items: center; gap: 4px;"><i class="bi bi-clock"></i> ${
          item.timestamp || ""
        }</span><span class="summary-card-count count-highlight">تعداد: ${
          item.total_count
        }</span></div></div>`;
        let detailsHTML = "";
        if (item.part_code)
          detailsHTML += `<span><i class="bi bi-upc-scan icon-item"></i> کد: ${item.part_code}</span>`;
        if (item.group)
          detailsHTML += `<span><i class="bi bi-collection icon-group"></i> گروه: ${item.group}</span>`;
        if (item.item)
          detailsHTML += `<span><i class="bi bi-tags icon-item"></i> آیتم: ${item.item}</span>`;
        const supplierParts = [];
        if (item.supplier_injection > 0)
          supplierParts.push(`تزریق: ${item.supplier_injection}`);
        if (item.supplier_press > 0)
          supplierParts.push(`پرسکاری: ${item.supplier_press}`);
        if (item.supplier_internal > 0)
          supplierParts.push(`داخلی: ${item.supplier_internal}`);
        if (item.supplier_external > 0)
          supplierParts.push(`خارجی: ${item.supplier_external}`);
        if (supplierParts.length > 0)
          detailsHTML += `<span><i class="bi bi-house-down icon-supplier"></i> تامین: ${supplierParts.join(
            " | "
          )}</span>`;
        const sourceParts = [];
        if (item.source_packaging > 0)
          sourceParts.push(`بسته‌بندی: ${item.source_packaging}`);
        if (item.source_warehouse > 0)
          sourceParts.push(`انبار: ${item.source_warehouse}`);
        if (item.source_production > 0)
          sourceParts.push(`حین تولید: ${item.source_production}`);
        if (sourceParts.length > 0)
          detailsHTML += `<span><i class="bi bi-graph-down-arrow icon-source"></i> منشا: ${sourceParts.join(
            " | "
          )}</span>`;
        const processInfoHTML = `<div class="card-details-row">${detailsHTML}</div>`;
        const defectsAndNotesHTML =
          item.defects_summary || item.comments
            ? `<div class="card-details-row notes-row">${
                item.defects_summary
                  ? `<span><i class="bi bi-card-text icon-defect"></i> ${item.defects_summary}</span>`
                  : ""
              } ${
                item.comments
                  ? `<span><i class="bi bi-chat-left-text"></i> ${item.comments}</span>`
                  : ""
              }</div>`
            : "";
        return `<div class="summary-card-item">${headerHTML}<div class="summary-card-details">${processInfoHTML}${defectsAndNotesHTML}</div></div>`;
      };

      const allItemsHTML = tableData.map(createItemCardHTML).join("");
      printContainer.innerHTML = buildFullPageHTML(allItemsHTML);

      await inlineAllStyles(printContainer);
      await document.fonts.ready;
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(printContainer, {
        useCORS: true,
        scale: window.devicePixelRatio || 2,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        windowWidth: printContainer.scrollWidth,
        windowHeight: printContainer.scrollHeight,
      });
      downloadFile(canvas.toDataURL("image/png"), `${baseFileName}.png`);
    } catch (err) {
      console.error(`خطا در ایجاد خروجی تصویر:`, err);
      showToast(`دانلود فایل تصویر با مشکل مواجه شد.`, "error");
      throw err;
    } finally {
      if (printContainer) document.body.removeChild(printContainer);
      toggleButtonLoading(
        exportButton,
        false,
        `<i class="bi bi-camera-fill"></i> خروجی تصویر فرم`
      );
    }
  }

  async function loadFontAsBase64(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch font from ${url}: ${response.statusText}`
      );
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const toPersianDigits = (text) => {
    if (text === null || text === undefined) return "";
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return text.toString().replace(/[0-9]/g, (d) => persianDigits[d]);
  };

  const rtl = (text) => {
    if (text === null || text === undefined) return "";
    let str = text.toString();
    str = str.replace(/\s*\((.*?)\)\s*/g, " - $1").trim();
    str = str.replace(/\//g, "، ");
    const rtlRegex = /[\u0600-\u06FF]/;
    if (!rtlRegex.test(str)) {
      return str;
    }
    const words = str.split(/\s+/).filter(Boolean);
    const reversedWords = words.reverse();
    return reversedWords.join(" ");
  };

  const fixBidi = (text) => {
    if (typeof text !== "string" || !text) return text;
    let processedText = text.toString().replace(/\//g, "، ");
    const LRM = "\u200E";
    processedText = processedText.replace(/\d+/g, (match) => LRM + match + LRM);
    const reversedText = processedText
      .split(/\s+/)
      .filter(Boolean)
      .reverse()
      .join(" ");
    const RLM_RTL = "\u200F";
    return RLM_RTL + reversedText;
  };

  async function exportToPDF() {
    if (Object.keys(finalizedFormData).length === 0) {
      showToast("لطفا ابتدا فرم را ثبت نهایی کنید.", "warning");
      throw new Error("Form not finalized before exporting to PDF.");
    }

    const exportButton = pageElement.querySelector(".export-pdf-btn");
    toggleButtonLoading(exportButton, true, "در حال آماده‌سازی فونت...");

    try {
      const { tableData, ...globalInfo } = finalizedFormData;

      const [regularFontBase64, boldFontBase64] = await Promise.all([
        loadFontAsBase64("assets/fonts/Vazirmatn-Regular.ttf"),
        loadFontAsBase64("assets/fonts/Vazirmatn-Bold.ttf"),
      ]);
      toggleButtonLoading(exportButton, true, "در حال ساخت PDF...");
      pdfMake.vfs = {
        "Vazirmatn-Regular.ttf": regularFontBase64,
        "Vazirmatn-Bold.ttf": boldFontBase64,
      };
      pdfMake.fonts = {
        Vazirmatn: {
          normal: "Vazirmatn-Regular.ttf",
          bold: "Vazirmatn-Bold.ttf",
          italics: "Vazirmatn-Regular.ttf",
          bolditalics: "Vazirmatn-Bold.ttf",
        },
      };

      const tableBodyContent = tableData.map((item, index) => {
        const supplierParts = [];
        if (item.supplier_injection > 0)
          supplierParts.push(`تزریق: ${item.supplier_injection}`);
        if (item.supplier_press > 0)
          supplierParts.push(`پرسکاری: ${item.supplier_press}`);
        if (item.supplier_internal > 0)
          supplierParts.push(`داخلی: ${item.supplier_internal}`);
        if (item.supplier_external > 0)
          supplierParts.push(`خارجی: ${item.supplier_external}`);
        const supplierCellData =
          supplierParts.length > 0
            ? supplierParts.map((p) => fixBidi(p)).join("\n")
            : "-";

        const sourceParts = [];
        if (item.source_packaging > 0)
          sourceParts.push(`بسته‌بندی: ${item.source_packaging}`);
        if (item.source_warehouse > 0)
          sourceParts.push(`انبار: ${item.source_warehouse}`);
        if (item.source_production > 0)
          sourceParts.push(`حین تولید: ${item.source_production}`);
        const sourceCellData =
          sourceParts.length > 0
            ? sourceParts.map((p) => fixBidi(p)).join("\n")
            : "-";

        const defectParts = item.defects_summary
          ? item.defects_summary.split("|").map((s) => s.trim())
          : [];
        const defectCellData =
          defectParts.length > 0
            ? defectParts.map((p) => fixBidi(p)).join("\n")
            : "-";

        const partNameCell = {
          stack: [
            { text: rtl(item.part_name), style: "tableCellRight", bold: true },
            {
              text: rtl(item.product_model),
              style: "tableCellRightSmall",
              color: "#555",
            },
          ],
        };

        return [
          { text: rtl(item.comments || "-"), style: "tableCellRight" },
          { text: defectCellData, style: "tableCellRight" },
          { text: sourceCellData, style: "tableCellRight" },
          { text: supplierCellData, style: "tableCellRight" },
          { text: item.total_count, style: ["tableCell", "bold"] },
          { text: item.item, style: "tableCell" },
          { text: item.group, style: "tableCell" },
          { text: item.part_code, style: "tableCell" },
          partNameCell,
          { text: index + 1, style: "tableCell" },
        ];
      });

      const docDefinition = {
        pageSize: "A4",
        pageOrientation: "portrait",
        pageMargins: [20, 120, 20, 75],

        header: {
          margin: [20, 25, 20, 0],
          stack: [
            { text: rtl("فرم گزارش ضایعات روزانه"), style: "headerTitle" },
            {
              columns: [
                { text: "P1-QC-F-001/001", style: "docCode" },
                { text: "Pakshoma", style: "pakshomaLogo" },
              ],
            },
            {
              style: "infoBox",
              table: {
                widths: ["*", "auto", "*", "auto", "*", "auto"],
                body: [
                  [
                    { text: rtl(globalInfo.wasteType), style: "infoText" },
                    { text: rtl("نوع ضایعات:"), style: "infoLabel" },
                    { text: globalInfo.globalDate, style: "infoText" },
                    { text: rtl("تاریخ:"), style: "infoLabel" },
                    { text: rtl(globalInfo.globalLine), style: "infoText" },
                    { text: rtl("خط:"), style: "infoLabel" },
                  ],
                ],
              },
              layout: "noBorders",
            },
          ],
        },

        content: [
          {
            table: {
              headerRows: 1,
              widths: [
                60,
                "*",
                "auto",
                "auto",
                "auto",
                "auto",
                "auto",
                "auto",
                "*",
                "auto",
              ],
              body: [
                [
                  { text: rtl("توضیحات"), style: "tableHeader" },
                  { text: rtl("شرح ضایعات"), style: "tableHeader" },
                  { text: rtl("منشا"), style: "tableHeader" },
                  { text: rtl("تامین کننده"), style: "tableHeader" },
                  { text: rtl("تعداد"), style: "tableHeader" },
                  { text: rtl("آیتم"), style: "tableHeader" },
                  { text: rtl("گروه"), style: "tableHeader" },
                  { text: rtl("کد قطعه"), style: "tableHeader" },
                  { text: rtl("نام قطعه / مدل"), style: "tableHeader" },
                  { text: rtl("ردیف"), style: "tableHeader" },
                ],
                ...tableBodyContent,
              ],
            },
            layout: {
              hLineWidth: (i, node) =>
                i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => "#dddddd",
              vLineColor: () => "#dddddd",
              paddingTop: () => 2,
              paddingBottom: () => 2,
              fillColor: (rowIndex) =>
                rowIndex > 0 && rowIndex % 2 === 0 ? "#f7f9fc" : null,
            },
          },
        ],
        footer: (currentPage, pageCount) => ({
          stack: [
            {
              style: "infoBox",
              margin: [0, 10, 0, 0],
              table: {
                widths: ["*", "*", "*"],
                body: [
                  [
                    {
                      text: [
                        rtl(globalInfo.approverEng || ""),
                        { text: rtl("نماینده فنی و مهندسی: "), bold: true },
                      ],
                      style: "approverBlock",
                    },
                    {
                      text: [
                        rtl(globalInfo.approverLine || ""),
                        { text: rtl("نماینده تولید: "), bold: true },
                      ],
                      style: "approverBlock",
                    },
                    {
                      text: [
                        rtl(globalInfo.approverControl || ""),
                        { text: rtl("نماینده کنترل: "), bold: true },
                      ],
                      style: "approverBlock",
                    },
                  ],
                ],
              },
              layout: "noBorders",
            },
            {
              text: toPersianDigits(
                `${pageCount}  از  ${currentPage.toString()}  صفحه  `
              ),
              alignment: "center",
              fontSize: 9,
              color: "#555555",
              margin: [0, 10, 0, 0],
            },
          ],
          margin: [20, 0, 20, 0],
        }),
        styles: {
          headerTitle: {
            fontSize: 18,
            bold: true,
            alignment: "center",
            color: "#0056b3",
            margin: [0, 0, 0, 5],
          },
          pakshomaLogo: {
            fontSize: 16,
            bold: true,
            alignment: "right",
            color: "#333333",
          },
          docCode: { fontSize: 10, alignment: "left", color: "#777777" },
          infoBox: { margin: [0, 5, 0, 5], fillColor: "#f7f9fc" },
          infoLabel: {
            alignment: "right",
            bold: true,
            fontSize: 10,
            color: "#333",
            margin: [0, 4, 0, 4],
          },
          infoText: {
            alignment: "right",
            fontSize: 10,
            color: "#555",
            margin: [0, 4, 10, 4],
          },
          tableHeader: {
            bold: true,
            fontSize: 8.5,
            color: "#333333",
            fillColor: "#eeeeee",
            alignment: "center",
          },
          tableCell: { fontSize: 8, alignment: "center" },
          tableCellRight: { fontSize: 8, alignment: "right" },
          tableCellRightSmall: { fontSize: 7, alignment: "right" },
          bold: { bold: true },
          approverBlock: {
            alignment: "right",
            fontSize: 10,
            color: "#333",
            margin: [0, 4, 40, 4],
          },
        },
        defaultStyle: { font: "Vazirmatn" },
      };

      const fileName = `${generateBaseFileName(globalInfo)}.pdf`;
      pdfMake.createPdf(docDefinition).download(fileName);
    } catch (err) {
      console.error("خطای جدی در ساخت PDF:", err);
      showToast("دانلود فایل PDF با مشکل مواجه شد.", "error");
      throw err;
    } finally {
      toggleButtonLoading(
        exportButton,
        false,
        `<i class="bi bi-file-earmark-pdf-fill"></i> خروجی PDF`
      );
    }
  }

  // ===== توابع مدیریت لیست و فرم موبایل =====
  function updateMobileSummary() {
    mobileForm.summaryList.innerHTML = "";
    tableBody.querySelectorAll("tr").forEach((row, index) => {
      const data = Object.fromEntries(
        Array.from(row.querySelectorAll("input, select")).map((el) => [
          el.name,
          el.value,
        ])
      );
      if (!data.part_name || !data.total_count || data.total_count <= 0) return;

      const li = document.createElement("li");
      li.dataset.rowIndex = index;

      const titleHTML = `${index + 1}. ${
        data.part_name
      } <span class="summary-product-type">(${data.product_model})</span>`;

      // +++ بخش جدید برای اطلاعات تامین کننده و منشا +++
      const supplierParts = [];
      if (data.supplier_injection > 0)
        supplierParts.push(`تزریق: ${data.supplier_injection}`);
      if (data.supplier_press > 0)
        supplierParts.push(`پرسکاری: ${data.supplier_press}`);
      if (data.supplier_internal > 0)
        supplierParts.push(`داخلی: ${data.supplier_internal}`);
      if (data.supplier_external > 0)
        supplierParts.push(`خارجی: ${data.supplier_external}`);

      const sourceParts = [];
      if (data.source_packaging > 0)
        sourceParts.push(`بسته‌بندی: ${data.source_packaging}`);
      if (data.source_warehouse > 0)
        sourceParts.push(`انبار: ${data.source_warehouse}`);
      if (data.source_production > 0)
        sourceParts.push(`حین تولید: ${data.source_production}`);

      const detailsParts = [
        `<span><i class="bi bi-upc-scan icon-item"></i> کد: ${
          data.part_code || "---"
        }</span>`,
        data.group
          ? `<span><i class="bi bi-collection icon-group"></i> گروه: ${data.group}</span>`
          : "",
        data.item
          ? `<span><i class="bi bi-tags icon-item"></i> آیتم: ${data.item}</span>`
          : "",
        // +++ افزودن اطلاعات جدید به لیست جزئیات +++
        supplierParts.length > 0
          ? `<span><i class="bi bi-house-down icon-supplier"></i> تامین: ${supplierParts.join(
              " | "
            )}</span>`
          : "",
        sourceParts.length > 0
          ? `<span><i class="bi bi-graph-down-arrow icon-source"></i> منشا: ${sourceParts.join(
              " | "
            )}</span>`
          : "",
        data.defects_summary
          ? `<span><i class="bi bi-card-text icon-defect"></i> ${data.defects_summary}</span>`
          : "",
        data.comments
          ? `<span><i class="bi bi-chat-left-text"></i> ${data.comments}</span>`
          : "",
      ];

      li.innerHTML = `
        <div class="summary-main-row">
            <span class="summary-text">${titleHTML}</span>
            <div class="summary-count">تعداد: <strong>${
              data.total_count
            }</strong></div>
            <div class="summary-actions">
                <button type="button" class="summary-edit-btn" title="ویرایش"><i class="bi bi-pencil-square"></i></button>
                <button type="button" class="summary-delete-btn" title="حذف"><i class="bi bi-trash3-fill"></i></button>
            </div>
        </div>
        <div class="summary-details">${detailsParts
          .filter(Boolean)
          .join("")}</div>
      `;
      mobileForm.summaryList.appendChild(li);
    });
  }

  // ===== توابع اعتبارسنجی و محاسباتی =====
  function getDefectsSum(defectsString) {
    if (!defectsString || defectsString.trim() === "") return 0;
    return defectsString.split(" | ").reduce((sum, part) => {
      const count = parseInt(part.split(": ")[1], 10);
      return sum + (isNaN(count) ? 0 : count);
    }, 0);
  }

  function getValidationStatus(data, rowIndex = "") {
    const requiredFields = {
      product_type: "نوع محصول",
      product_model: "مدل",
      part_name: "نام قطعه",
      total_count: "تعداد کل",
      defects_summary: "شرح ضایعات",
    };
    for (const field in requiredFields) {
      if (
        !data[field] ||
        (field === "total_count" && parseInt(data[field], 10) === 0)
      )
        return {
          isValid: false,
          message: `فیلد "${requiredFields[field]}" در ${
            rowIndex ? `ردیف ${rowIndex}` : "فرم"
          } اجباری است.`,
        };
    }
    const totalCount = parseInt(data.total_count, 10) || 0;
    const supplierSum = [
      "supplier_injection",
      "supplier_press",
      "supplier_internal",
      "supplier_external",
    ].reduce((sum, key) => sum + (parseInt(data[key], 10) || 0), 0);
    if (supplierSum !== totalCount)
      return {
        isValid: false,
        message: `مجموع تامین‌کننده (${supplierSum}) با تعداد کل (${totalCount}) در ${
          rowIndex ? `ردیف ${rowIndex}` : "فرم"
        } برابر نیست.`,
      };
    const sourceSum = [
      "source_packaging",
      "source_warehouse",
      "source_production",
    ].reduce((sum, key) => sum + (parseInt(data[key], 10) || 0), 0);
    if (sourceSum !== totalCount)
      return {
        isValid: false,
        message: `مجموع منشا ضایعات (${sourceSum}) با تعداد کل (${totalCount}) در ${
          rowIndex ? `ردیف ${rowIndex}` : "فرم"
        } برابر نیست.`,
      };
    const defectsSum = getDefectsSum(data.defects_summary);
    if (defectsSum !== totalCount)
      return {
        isValid: false,
        message: `مجموع "شرح ضایعات" (${defectsSum}) با تعداد کل (${totalCount}) در ${
          rowIndex ? `ردیف ${rowIndex}` : "فرم"
        } برابر نیست.`,
      };
    return { isValid: true };
  }

  function validateMobileForm() {
    document
      .querySelectorAll(".bom-selector-item, .mobile-form-group")
      .forEach((el) => el.classList.remove("required-field-error"));

    const fieldsToValidate = [
      {
        choice: bomProductTypeChoice,
        el: mobileForm.bomProductType.closest(".mobile-form-group"),
        name: "نوع محصول",
      },
      {
        choice: bomModelChoice,
        el: mobileForm.bomModel.closest(".mobile-form-group"),
        name: "مدل",
      },
      {
        choice: bomPartNameChoice,
        el: mobileForm.bomPartName.closest(".mobile-form-group"),
        name: "نام قطعه",
      },
      {
        el: mobileForm.defectsSummary.closest(".mobile-form-group"),
        value: mobileForm.defectsSummary.value,
        name: "شرح ضایعات",
      },
    ];

    for (const field of fieldsToValidate) {
      const value = field.choice ? field.choice.getValue(true) : field.value;
      if (!value) {
        showToast(`لطفاً فیلد "${field.name}" را تکمیل کنید.`, "error");
        field.el.classList.add("required-field-error");
        field.el.scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
      }
    }
    return true;
  }

  function validateAllForms() {
    const { globalDate, globalLine } = getGlobalData();
    const dateInput = document.getElementById("jalali_date");
    const lineSelect = document.getElementById("line");
    [dateInput, lineSelect].forEach((el) =>
      el.classList.remove("required-field-error")
    );
    let firstInvalidElement = null;
    if (!globalDate) {
      dateInput.classList.add("required-field-error");
      firstInvalidElement = firstInvalidElement || dateInput;
    }
    if (!globalLine) {
      lineSelect.classList.add("required-field-error");
      firstInvalidElement = firstInvalidElement || lineSelect;
    }
    if (firstInvalidElement) {
      showToast(
        "لطفا فیلدهای اصلی بالای فرم (تاریخ، خط) را تکمیل کنید.",
        "error"
      );
      firstInvalidElement.focus();
      return false;
    }
    let validRowCount = 0;
    for (const row of tableBody.rows) {
      const data = Object.fromEntries(
        Array.from(row.querySelectorAll("input, select")).map((el) => [
          el.name,
          el.value,
        ])
      );
      if (data.part_name) {
        const status = getValidationStatus(
          data,
          Array.from(tableBody.rows).indexOf(row) + 1
        );
        if (!status.isValid) {
          showToast(status.message, "error");
          return false;
        }
        validRowCount++;
      }
    }
    if (validRowCount === 0) {
      showToast(
        "هیچ قطعه معتبری برای ثبت وجود ندارد. لطفاً حداقل یک ردیف را کامل کنید.",
        "warning"
      );
      return false;
    }
    return true;
  }

  function updateDefectCount(defectName, changeAmount) {
    if (pageElement.classList.contains("form-locked")) return;
    const targetInput = mobileForm.defectsSummary;
    if (!targetInput) return;
    const defectsMap = new Map(
      targetInput.value
        .split(" | ")
        .map((part) => part.split(": "))
        .filter((p) => p.length === 2)
        .map(([k, v]) => [k.trim(), parseInt(v.trim(), 10)])
    );
    const newCount = (defectsMap.get(defectName) || 0) + changeAmount;
    if (newCount > 0) defectsMap.set(defectName, newCount);
    else defectsMap.delete(defectName);
    targetInput.value = Array.from(
      defectsMap,
      ([text, count]) => `${text}: ${count}`
    ).join(" | ");
    if (targetInput.value) {
      const container =
        targetInput.closest(".mobile-form-group") || targetInput;
      if (container) container.classList.remove("required-field-error");
    }

    updateDefectLegendsSelection();
  }

  // +++ تابع جدید برای وارد کردن تعداد دقیق نقص +++
  function setDefectCount(defectName) {
    if (pageElement.classList.contains("form-locked")) return;
    const targetInput = mobileForm.defectsSummary;
    const defectsMap = new Map(
      (targetInput.value || "")
        .split(" | ")
        .map((part) => part.split(": "))
        .filter((p) => p.length === 2)
        .map(([k, v]) => [k.trim(), parseInt(v.trim(), 10)])
    );
    const currentCount = defectsMap.get(defectName) || 0;

    Swal.fire({
      title: `تعداد نقص "${defectName}"`,
      text: "تعداد دقیق را وارد کنید. برای حذف، عدد 0 را وارد کنید.",
      input: "number",
      inputValue: currentCount,
      showCancelButton: true,
      confirmButtonText: "ثبت",
      cancelButtonText: "انصراف",
      inputValidator: (value) => {
        if (!value || parseInt(value, 10) < 0) {
          return "لطفاً یک عدد معتبر (بزرگتر یا مساوی صفر) وارد کنید.";
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const newCount = parseInt(result.value, 10);
        if (!isNaN(newCount)) {
          if (newCount > 0) {
            defectsMap.set(defectName, newCount);
          } else {
            defectsMap.delete(defectName);
          }
          targetInput.value = Array.from(
            defectsMap,
            ([text, count]) => `${text}: ${count}`
          ).join(" | ");

          if (targetInput.value) {
            const container = targetInput.closest(".mobile-form-group");
            if (container) container.classList.remove("required-field-error");
          }
          updateDefectLegendsSelection();
        }
      }
    });
  }

  function updateDefectLegendsSelection() {
    const defectCounts = new Map(
      (mobileForm.defectsSummary.value || "")
        .split(" | ")
        .map((s) => s.split(":"))
        .filter((p) => p.length === 2)
        .map(([name, count]) => [name.trim(), parseInt(count.trim(), 10)])
    );
    document.querySelectorAll("#legends-list li").forEach((li) => {
      const defectName = li.dataset.defectName;
      if (defectCounts.has(defectName) && defectCounts.get(defectName) > 0) {
        li.classList.add("selected");
      } else {
        li.classList.remove("selected");
      }
    });
  }

  function populateSelect(selectElement, dataArray, selectFirst = false) {
    if (!selectElement) return;
    selectElement.innerHTML = "";
    dataArray.forEach((item, index) => {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = item;
      if (selectFirst && index === 0) option.selected = true;
      selectElement.appendChild(option);
    });
  }

  function populateLegends(ulElement, dataArray) {
    if (!ulElement) return;
    ulElement.innerHTML = "";
    dataArray.forEach((item) => {
      const li = document.createElement("li");
      li.dataset.defectName = item;
      li.textContent = item;
      ulElement.appendChild(li);
    });
  }

  function handleAddItem() {
    if (!validateMobileForm()) return;

    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    const mobileData = {
      product_type: bomProductTypeChoice.getValue(true),
      product_model: bomModelChoice.getValue(true),
      part_name: bomPartNameChoice.getValue(true),
      part_code: mobileForm.bomPartCode.value,
      total_count: mobileForm.totalCount.value,
      group: mobileForm.group.value,
      item: mobileForm.item.value,
      supplier_injection: mobileForm.supplierInjection.value,
      supplier_press: mobileForm.supplierPress.value,
      supplier_internal: mobileForm.supplierInternal.value,
      supplier_external: mobileForm.supplierExternal.value,
      source_packaging: mobileForm.sourcePackaging.value,
      source_warehouse: mobileForm.sourceWarehouse.value,
      source_production: mobileForm.sourceProduction.value,
      defects_summary: mobileForm.defectsSummary.value,
      comments: mobileForm.comments.value,
      timestamp: timeString,
    };

    const status = getValidationStatus(mobileData);
    if (!status.isValid) {
      showToast(status.message, "error");
      return;
    }

    if (editingRowIndex !== null) {
      const rowToUpdate = tableBody.rows[editingRowIndex];
      if (rowToUpdate) {
        Object.keys(mobileData).forEach((key) => {
          const input = rowToUpdate.querySelector(`[name="${key}"]`);
          if (input) input.value = mobileData[key];
        });
        showToast(`قطعه شماره ${editingRowIndex + 1} به‌روز شد.`, "success");
      }
    } else {
      addRow(mobileData);
      showToast(`قطعه (${mobileData.part_name}) با موفقیت ثبت شد.`, "success");
    }
    updateMobileSummary();
    resetPartSpecificFields();
  }

  // --- راه‌اندازی اولیه صفحه ---
  function initializePage() {
    populateSelect(document.getElementById("line"), scrapFormData.lines);
    populateSelect(mobileForm.group, scrapFormData.groups);
    populateLegends(
      document.getElementById("legends-list"),
      scrapFormData.defects
    );

    bomProductTypeChoice = new Choices(
      mobileForm.bomProductType,
      choicesConfig
    );
    bomModelChoice = new Choices(mobileForm.bomModel, choicesConfig);
    bomPartNameChoice = new Choices(mobileForm.bomPartName, {
      ...choicesConfig,
      searchEnabled: true,
      searchResultLimit: 100,
    });

    initializeBomSelectors();
    legendsContainer.style.display = "block";

    const dateInput = document.getElementById("jalali_date");
    if (dateInput) {
      const today = new Date();
      const formatter = new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        calendar: "persian",
      });
      dateInput.value = formatter.format(today);
      if (window.jdp) {
        window.jdp.render(dateInput, {
          usePersianDigits: true,
          format: "YYYY/MM/DD",
        });
      }
    }

    // --- ثبت Event Listener ها ---
    const finalizeBtn = pageElement.querySelector(".finalize-btn");
    if (finalizeBtn) finalizeBtn.addEventListener("click", finalizeForm);

    mobileForm.bomProductType.addEventListener(
      "change",
      handleProductTypeChange
    );
    mobileForm.bomModel.addEventListener("change", handleModelChange);
    mobileForm.bomPartName.addEventListener("change", handlePartNameChange);
    mobileForm.addBtn.addEventListener("click", handleAddItem);

    if (mobileForm.summaryList) {
      mobileForm.summaryList.addEventListener("click", (event) => {
        if (pageElement.classList.contains("form-locked")) return;
        const button = event.target.closest("button");
        if (!button) return;
        const li = button.closest("li[data-row-index]");
        if (!li) return;
        const rowIndex = parseInt(li.dataset.rowIndex, 10);
        const rowElement = tableBody.rows[rowIndex];
        if (!rowElement) return;
        if (button.classList.contains("summary-edit-btn"))
          startEditing(rowElement);
        else if (button.classList.contains("summary-delete-btn"))
          confirmDeleteRow(rowElement);
      });
    }

    // +++ تغییر در منطق مدیریت نقص‌ها با قابلیت تشخیص سه کلیک +++
    let clickTimeout = null;
    let clickCount = 0;
    const clickDelay = 300; // میلی‌ثانیه برای تشخیص چند کلیک

    legendsContainer.addEventListener("click", (e) => {
        const item = e.target.closest("li[data-defect-name]");
        if (!item) return;

        clickCount++;

        if (clickCount === 1) {
            clickTimeout = setTimeout(() => {
                // اگر بعد از 300 میلی‌ثانیه کلیک دیگری نشد، عمل تک کلیک را انجام بده
                updateDefectCount(item.dataset.defectName, 1);
                clickCount = 0;
            }, clickDelay);
        } else if (clickCount === 3) { // +++ تغییر: تشخیص سه کلیک +++
            clearTimeout(clickTimeout);
            setDefectCount(item.dataset.defectName);
            clickCount = 0;
        }
    });

    // لمس طولانی و کلیک راست برای کاهش تعداد
    let touchTimer;
    legendsContainer.addEventListener("contextmenu", (e) => {
      const item = e.target.closest("li[data-defect-name]");
      if (item) {
        e.preventDefault();
        updateDefectCount(item.dataset.defectName, -1);
      }
    });
    legendsContainer.addEventListener("touchstart", (e) => {
      const item = e.target.closest("li[data-defect-name]");
      if(item){
         touchTimer = setTimeout(() => {
            updateDefectCount(item.dataset.defectName, -1);
            navigator.vibrate?.(50);
        }, 500);
      }
    });
    legendsContainer.addEventListener("touchend", () => clearTimeout(touchTimer));
    legendsContainer.addEventListener("touchmove", () => clearTimeout(touchTimer));
    // +++ پایان تغییرات +++
    
    const mobileFormWrapper = document.getElementById("mobile-form-wrapper");
    if (mobileFormWrapper) {
      mobileFormWrapper.addEventListener("click", (e) => {
        if (pageElement.classList.contains("form-locked")) return;
        if (e.target.matches(".counter-btn")) {
          const targetInput = document.getElementById(e.target.dataset.target);
          if (targetInput) {
            let value = parseInt(targetInput.value, 10) || 0;
            const min = parseInt(targetInput.min, 10);
            if (e.target.classList.contains("plus-btn")) value++;
            else if (value > (isNaN(min) ? 0 : min)) value--;
            targetInput.value = value;
          }
        }
      });
    }

    [
      "jalali_date",
      "line",
      "approver-control",
      "approver-line",
      "approver-eng",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el)
        el.addEventListener("input", (e) =>
          e.target.classList.remove("required-field-error")
        );
    });

    window.activeFormResetter = resetFormWithConfirmation;
  }

  initializePage();
}