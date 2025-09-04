// مسیر: features/scrap-form/scrap-form.js
import { scrapFormData } from "./scrap-form-data.js";

export function init() {
  console.log(
    "Scrap Form Initialized! (Mobile-Only with Per-Item Product Type v3)"
  );
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
  // --- المان‌های فرم موبایل ---
  const mobileForm = {
    productType: document.getElementById("mobile-product-type"),
    partName: document.getElementById("mobile-part-name"),
    totalCount: document.getElementById("mobile-total-count"),
    productModel: document.getElementById("mobile-product-model"),
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
  let mobilePartNameChoice;
  let editingRowIndex = null;
  let finalizedFormData = {};

  // --- تنظیمات کتابخانه Choices.js ---
  const choicesConfig = {
    searchPlaceholderValue: "جستجو...",
    removeItemButton: false,
    itemSelectText: "انتخاب",
    noResultsText: "موردی یافت نشد",
    noChoicesText: "گزینه‌ای برای انتخاب وجود ندارد",
    shouldSort: false,
  };

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

  // =====> کد جدید را اینجا اضافه کنید <=====
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

    // *** تغییر کلیدی اینجاست ***
    // تمام تگ‌های <link> استایل‌شیت را از عنصر کلون شده حذف می‌کنیم
    const linkElements = element.querySelectorAll('link[rel="stylesheet"]');
    linkElements.forEach((link) => link.remove());

    // سپس تگ <style> جدید با تمام محتوای CSS را اضافه می‌کنیم
    const styleElement = document.createElement("style");
    styleElement.textContent = cssText;
    element.prepend(styleElement);
  }
  // =====> پایان کد جدید <=====

  // تابع جدید برای ساخت نام یکسان برای همه فایل‌ها
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
    resetMobileForm({ focusOnPartName: false });
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
    if (mobilePartNameChoice) mobilePartNameChoice.enable();
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

  function createRowHTML() {
    const groupOptionsHTML = (scrapFormData.groups || [])
      .map((g) => `<option value="${g}">${g}</option>`)
      .join("");
    return `
    <td>${tableBody.rows.length + 1}</td>
    <td><input type="text" name="product_model"></td>
    <td><select name="group">${groupOptionsHTML}</select></td>
    <td><input type="number" name="item"></td>
    <td><select name="part_name"></select></td>
    <td><input type="number" name="total_count" value="0"></td>
    <td><input type="number" name="supplier_injection" value="0"></td>
    <td><input type="number" name="supplier_press" value="0"></td>
    <td><input type="number" name="supplier_internal" value="0"></td>
    <td><input type="number" name="supplier_external" value="0"></td>
    <td><input type="number" name="source_packaging" value="0"></td>
    <td><input type="number" name="source_warehouse" value="0"></td>
    <td><input type="number" name="source_production" value="0"></td>
    <td><input type="text" name="defects_summary" readonly></td>
    <td><input type="text" name="comments"></td>
    <td><input type="hidden" name="timestamp"></td>
    <td><input type="hidden" name="product_type"></td>
    <td></td>`;
  }

  function addRow(fromMobileData) {
    const newRow = tableBody.insertRow();
    newRow.innerHTML = createRowHTML();
    if (fromMobileData) {
      Object.keys(fromMobileData).forEach((key) => {
        const input = newRow.querySelector(`[name="${key}"]`);
        if (input) {
          if (key === "part_name") {
            const option = document.createElement("option");
            option.value = fromMobileData[key];
            option.textContent = fromMobileData[key];
            input.appendChild(option);
          }
          input.value = fromMobileData[key];
        }
      });
    }
  }

  function deleteRow(rowToDelete) {
    if (!rowToDelete) return;
    rowToDelete.remove();
    updateMobileSummary();
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

  function startEditing(rowToEdit) {
    if (!rowToEdit) return;
    editingRowIndex = Array.from(tableBody.children).indexOf(rowToEdit);
    const data = Object.fromEntries(
      Array.from(rowToEdit.querySelectorAll("input, select")).map((el) => [
        el.name,
        el.value,
      ])
    );

    mobileForm.productType.value =
      data.product_type || scrapFormData.productTypes[0];
    updatePartNameDropdownForMobile();

    mobilePartNameChoice.setChoiceByValue(data.part_name || "");
    mobileForm.totalCount.value = data.total_count;
    mobileForm.productModel.value = data.product_model;
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
    mobileForm.addBtn.innerHTML =
      '<i class="bi bi-check-circle-fill"></i> به‌روزرسانی قطعه';
    mobileForm.addBtn.style.backgroundColor = "var(--primary-color)";
    updateDefectLegendsSelection();
    const mobileFormContainer = document.querySelector(
      ".mobile-form-container"
    );
    mobileFormContainer.scrollIntoView({ behavior: "smooth" });
    const firstAccordionContent =
      mobileFormContainer.querySelector(".accordion-content");
    if (
      firstAccordionContent &&
      firstAccordionContent.style.display === "none"
    ) {
      firstAccordionContent.previousElementSibling.click();
    }
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

          // +++ تغییر کلیدی: ترتیب دانلود عوض شد +++
          // 1. اول تصویر که به رندر صحیح وابسته است
          await exportToImage();

          // 2. سپس PDF
          await exportToPDF();

          // 3. در آخر CSV که سبک‌ترین است
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
    if (mobilePartNameChoice) mobilePartNameChoice.disable();
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
    // دکمه‌های خروجی دیگر نمایش داده نمی‌شوند چون دانلود خودکار است
    pageElement.querySelector(".export-btn").style.display = "none";
    pageElement.querySelector(".export-img-btn").style.display = "none";
    pageElement.querySelector(".export-pdf-btn").style.display = "none";
  }

  // ===== توابع مربوط به خروجی‌ها =====
  function exportToCSV() {
    // +++ تغییر: کل تابع داخل یک Promise قرار گرفت تا با async/await هماهنگ باشد +++
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
          "گروه",
          "آیتم",
          "نام قطعه",
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
            data.group,
            data.item,
            data.part_name,
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
        resolve(); // در صورت موفقیت، Promise را resolve می‌کنیم
      } catch (error) {
        console.error("خطا در ایجاد خروجی CSV:", error);
        showToast("دانلود فایل CSV با مشکل مواجه شد.", "error");
        reject(error); // در صورت خطا، Promise را reject می‌کنیم
      }
    });
  }

  // =====> این تابع را به طور کامل جایگزین کنید <=====
  async function exportToImage() {
    if (Object.keys(finalizedFormData).length === 0) {
      showToast("لطفا ابتدا فرم را ثبت نهایی کنید.", "warning");
      throw new Error("Form not finalized before exporting to Image.");
    }

    const exportButton = pageElement.querySelector(".export-img-btn");
    toggleButtonLoading(exportButton, true, "در حال آماده سازی تصویر...");

    // یک کپی از کانتینر اصلی می‌سازیم تا روی صفحه اصلی تغییری ایجاد نشود
    const printContainerOriginal = document.querySelector(
      ".print-page-container"
    );
    const printContainer = printContainerOriginal.cloneNode(true);

    // کپی را به صورت مخفی به صفحه اضافه می‌کنیم تا قابل رندر باشد
    printContainer.style.position = "absolute";
    printContainer.style.left = "-9999px";
    printContainer.style.visibility = "visible"; // باید visible باشد تا html2canvas آن را ببیند
    printContainer.style.opacity = "1";
    document.body.appendChild(printContainer);

    try {
      const { tableData, ...globalInfo } = finalizedFormData;
      const baseFileName = generateBaseFileName(globalInfo);

      // --- توابع داخلی برای ساخت HTML (بدون تغییر) ---
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
          item.product_type
        })</span>`;
        const headerHTML = `<div class="summary-card-header"><h2 class="summary-card-title">${titleHTML}</h2><div class="summary-card-meta" style="display: flex; align-items: center; gap: 12px; font-size: 11px; color: var(--secondary-color);"><span class="summary-timestamp" style="display: flex; align-items: center; gap: 4px;"><i class="bi bi-clock"></i> ${
          item.timestamp || ""
        }</span><span class="summary-card-count count-highlight">تعداد: ${
          item.total_count
        }</span></div></div>`;
        let detailsHTML = "";
        if (item.product_model)
          detailsHTML += `<span><i class="bi bi-textarea-t icon-model"></i> مدل: ${item.product_model}</span>`;
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
      // --- پایان توابع داخلی ---

      const allItemsHTML = tableData.map(createItemCardHTML).join("");
      printContainer.innerHTML = buildFullPageHTML(allItemsHTML);

      // +++ تغییر اصلی اینجاست +++
      // قبل از فراخوانی html2canvas، تمام استایل‌ها را داخلی می‌کنیم
      await inlineAllStyles(printContainer);
      // +++ پایان تغییر اصلی +++

      // منتظر می‌مانیم تا فونت‌ها و استایل‌ها کاملا اعمال شوند
      await document.fonts.ready;
      await new Promise((resolve) => setTimeout(resolve, 100)); // یک تاخیر کوچک برای اطمینان

      const canvas = await html2canvas(printContainer, {
        useCORS: true,
        scale: window.devicePixelRatio || 2, // استفاده از رزولوشن دستگاه برای کیفیت بهتر
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
      // کپی مخفی را در هر صورت از صفحه حذف می‌کنیم
      if (printContainer) {
        document.body.removeChild(printContainer);
      }
      toggleButtonLoading(
        exportButton,
        false,
        `<i class="bi bi-camera-fill"></i> خروجی تصویر فرم`
      );
    }
  }
  // =====> پایان تابع جایگزین شده <=====
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

  // مسیر: QC 33/features/scrap-form/scrap-form.js
  // ... (کدهای دیگر فایل را دست نخورده باقی بگذارید) ...

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
              text: rtl(item.product_type),
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
          { text: item.product_model, style: "tableCell" },
          partNameCell,
          { text: index + 1, style: "tableCell" },
        ];
      });

      const docDefinition = {
        pageSize: "A4",
        pageOrientation: "portrait",
        // +++ تغییر کلیدی: حاشیه بالا برای جلوگیری از تداخل هدر و جدول افزایش یافت
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
                80,
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
                  { text: rtl("مدل"), style: "tableHeader" },
                  { text: rtl("نام قطعه"), style: "tableHeader" },
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
  // ... (بقیه کدهای فایل را دست نخورده باقی بگذارید) ...

  // ... (بقیه کدهای فایل را دست نخورده باقی بگذارید) ...
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
      let detailsHTML = "";
      if (data.product_model)
        detailsHTML += `<span><i class="bi bi-textarea-t icon-model"></i> مدل: ${data.product_model}</span>`;
      if (data.group)
        detailsHTML += `<span><i class="bi bi-collection icon-group"></i> گروه: ${data.group}</span>`;
      if (data.item)
        detailsHTML += `<span><i class="bi bi-tags icon-item"></i> آیتم: ${data.item}</span>`;
      const supplierParts = [];
      if (data.supplier_injection > 0)
        supplierParts.push(`تزریق: ${data.supplier_injection}`);
      if (data.supplier_press > 0)
        supplierParts.push(`پرسکاری: ${data.supplier_press}`);
      if (data.supplier_internal > 0)
        supplierParts.push(`داخلی: ${data.supplier_internal}`);
      if (data.supplier_external > 0)
        supplierParts.push(`خارجی: ${data.supplier_external}`);
      if (supplierParts.length > 0)
        detailsHTML += `<span><i class="bi bi-house-down icon-supplier"></i> ${supplierParts.join(
          "، "
        )}</span>`;
      const sourceParts = [];
      if (data.source_packaging > 0)
        sourceParts.push(`بسته‌بندی: ${data.source_packaging}`);
      if (data.source_warehouse > 0)
        sourceParts.push(`انبار: ${data.source_warehouse}`);
      if (data.source_production > 0)
        sourceParts.push(`حین تولید: ${data.source_production}`);
      if (sourceParts.length > 0)
        detailsHTML += `<span><i class="bi bi-graph-down-arrow icon-source"></i> ${sourceParts.join(
          "، "
        )}</span>`;
      if (data.defects_summary)
        detailsHTML += `<span><i class="bi bi-card-text icon-defect"></i> ${data.defects_summary}</span>`;
      if (data.comments)
        detailsHTML += `<span><i class="bi bi-chat-left-text"></i> ${data.comments}</span>`;

      const titleHTML = `${index + 1}. ${
        data.part_name
      } <span class="summary-product-type">(${data.product_type})</span>`;

      const mainRowHTML = `
      <div class="summary-main-row" style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
        <span class="summary-text" style="font-weight: bold; flex-grow: 1;">${titleHTML}</span>
        <div class="summary-controls" style="display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--secondary-color);">
            <span class="summary-timestamp" style="display: flex; align-items: center; gap: 4px;">
                <i class="bi bi-clock"></i>
                ${data.timestamp || ""}
            </span>
            <span class="summary-count">تعداد: ${data.total_count}</span>
            <div class="summary-actions" style="display: flex; gap: 0;">
                <button type="button" class="summary-edit-btn" title="ویرایش"><i class="bi bi-pencil-square"></i></button>
                <button type="button" class="summary-delete-btn" title="حذف"><i class="bi bi-trash3-fill"></i></button>
            </div>
        </div>
      </div>`;

      li.innerHTML = `${mainRowHTML}<div class="summary-details">${detailsHTML}</div>`;
      mobileForm.summaryList.appendChild(li);
    });
  }

  function resetMobileForm(options = {}) {
    const { focusOnPartName = true } = options;
    editingRowIndex = null;
    document
      .querySelectorAll("#mobile-form-wrapper [data-required-name]")
      .forEach((el) => {
        const container =
          el.id === "mobile-part-name" || el.id === "mobile-product-type"
            ? el.closest(".mobile-form-group")
            : el.closest(".counter-input-group") || el;
        if (container) container.classList.remove("required-field-error");
      });

    const fieldsToReset = [
      "partName",
      "totalCount",
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
    if (mobilePartNameChoice) mobilePartNameChoice.setChoiceByValue("");

    fieldsToReset.forEach((key) => {
      const el = mobileForm[key];
      if (el && el.tagName) {
        if (el.type === "number")
          el.value = key === "totalCount" ? 1 : el.min || 0;
        else if (el.tagName === "SELECT") el.selectedIndex = 0;
        else if (el.type === "text" || el.type === "textarea") el.value = "";
      }
    });

    const lastValidRow =
      tableBody &&
      [...tableBody.rows]
        .reverse()
        .find((row) => row.querySelector('[name="part_name"]').value);

    if (lastValidRow) {
      mobileForm.productType.value = lastValidRow.querySelector(
        '[name="product_type"]'
      ).value;
      mobileForm.productModel.value = lastValidRow.querySelector(
        '[name="product_model"]'
      ).value;
      mobileForm.group.value =
        lastValidRow.querySelector('[name="group"]').value;
      mobileForm.item.value = lastValidRow.querySelector('[name="item"]').value;
    } else {
      mobileForm.productType.selectedIndex = 0;
      mobileForm.productModel.value = "";
      mobileForm.group.value = scrapFormData.groups[0] || "";
      mobileForm.item.value = "";
    }

    updatePartNameDropdownForMobile();

    mobileForm.addBtn.innerHTML =
      '<i class="bi bi-check-circle-fill"></i> ثبت و افزودن به لیست';
    mobileForm.addBtn.style.backgroundColor = "var(--success-color)";
    updateDefectLegendsSelection();

    if (focusOnPartName && window.innerWidth < 992) {
      setTimeout(() => {
        mobilePartNameChoice.showDropdown();
        const searchInput =
          mobilePartNameChoice.containerOuter.element.querySelector(
            "input.choices__input"
          );
        if (searchInput) {
          searchInput.focus();
        }
      }, 50);
    }
  }

  // ===== توابع اعتبارسنجی و محاسباتی =====
  function updatePartNameDropdownForMobile() {
    const productType = mobileForm.productType.value;
    const newParts = scrapFormData.parts[productType] || [];
    const choicesArray = [
      { value: "", label: "انتخاب قطعه...", placeholder: true, disabled: true },
    ].concat(newParts.map((name) => ({ value: name, label: name })));
    if (mobilePartNameChoice) {
      const currentVal = mobilePartNameChoice.getValue(true);
      mobilePartNameChoice.setChoices(choicesArray, "value", "label", true);
      if (newParts.includes(currentVal)) {
        mobilePartNameChoice.setChoiceByValue(currentVal);
      }
    }
  }

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
      part_name: "نام قطعه",
      total_count: "تعداد کل",
      product_model: "مدل محصول",
      group: "گروه",
      item: "آیتم",
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

  // ===== توابع عمومی و راه‌اندازی اولیه =====
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

  function addSafeEventListener(
    selector,
    event,
    handler,
    parent = pageElement
  ) {
    const element = parent.querySelector(selector);
    if (element) {
      element.addEventListener(event, handler);
    } else {
      console.warn(`Element "${selector}" not found.`);
    }
  }

  // --- راه‌اندازی اولیه صفحه ---
  populateSelect(document.getElementById("line"), scrapFormData.lines);
  populateSelect(mobileForm.productType, scrapFormData.productTypes, true);
  populateSelect(mobileForm.group, scrapFormData.groups);
  populateLegends(
    document.getElementById("legends-list"),
    scrapFormData.defects
  );
  mobilePartNameChoice = new Choices(mobileForm.partName, choicesConfig);
  updatePartNameDropdownForMobile();
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
  addSafeEventListener(".finalize-btn", "click", finalizeForm);
  // این سه خط حذف یا کامنت می‌شوند چون دیگر به صورت تکی استفاده نمی‌شوند
  // addSafeEventListener(".export-btn", "click", exportToCSV);
  // addSafeEventListener(".export-img-btn", "click", exportToImage);
  // addSafeEventListener(".export-pdf-btn", "click", exportToPDF);

  if (mobileForm.productType) {
    mobileForm.productType.addEventListener(
      "change",
      updatePartNameDropdownForMobile
    );
  }

  if (mobileForm.addBtn) {
    mobileForm.addBtn.addEventListener("click", () => {
      const requiredElements = document.querySelectorAll(
        "#mobile-form-wrapper [data-required-name]"
      );
      let firstInvalidElement = null;
      requiredElements.forEach((el) => {
        const container =
          el.id === "mobile-part-name" || el.id === "mobile-product-type"
            ? el.parentElement
            : el.closest(".counter-input-group") ||
              el.closest(".mobile-form-group") ||
              el;
        if (container) container.classList.remove("required-field-error");

        const choicesWrapper = container.querySelector(".choices");
        if (choicesWrapper)
          choicesWrapper.classList.remove("required-field-error");
      });
      for (const el of requiredElements) {
        if (!el.value || (el.id === "mobile-total-count" && el.value === "0")) {
          const container =
            el.id === "mobile-part-name" || el.id === "mobile-product-type"
              ? el.parentElement
              : el.closest(".counter-input-group") ||
                el.closest(".mobile-form-group") ||
                el;

          if (container) {
            const choicesWrapper = container.querySelector(".choices");
            if (choicesWrapper) {
              choicesWrapper.classList.add("required-field-error");
            } else {
              container.classList.add("required-field-error");
            }
          }

          if (!firstInvalidElement) firstInvalidElement = el;
        }
      }
      if (firstInvalidElement) {
        showToast(
          `لطفا فیلد "${firstInvalidElement.dataset.requiredName}" را پر کنید.`,
          "error"
        );
        if (firstInvalidElement.id === "mobile-part-name")
          mobilePartNameChoice.showDropdown();
        else firstInvalidElement.focus();
        const accordionContent =
          firstInvalidElement.closest(".accordion-content");
        if (accordionContent && accordionContent.style.display === "none") {
          accordionContent.style.display = "flex";
          accordionContent.previousElementSibling.classList.add("active");
        }
        return;
      }

      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

      const mobileData = {
        product_type: mobileForm.productType.value,
        product_model: mobileForm.productModel.value,
        group: mobileForm.group.value,
        item: mobileForm.item.value,
        part_name: mobileForm.partName.value,
        total_count: mobileForm.totalCount.value,
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
            if (input) {
              input.value = mobileData[key];
            }
          });
          showToast(`قطعه شماره ${editingRowIndex + 1} به‌روز شد.`, "success");
        }
      } else {
        addRow(mobileData);
        showToast(
          `قطعه شماره ${tableBody.rows.length} (${mobileData.part_name}) ثبت شد.`,
          "success"
        );
      }
      updateMobileSummary();
      resetMobileForm();
    });
  }
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
  let touchTimer,
    isLongPress = false;
  legendsContainer.addEventListener("touchstart", (event) => {
    const item = event.target.closest("li[data-defect-name]");
    if (item) {
      isLongPress = false;
      touchTimer = setTimeout(() => {
        isLongPress = true;
        updateDefectCount(item.dataset.defectName, -1);
        navigator.vibrate?.(50);
      }, 500);
    }
  });
  legendsContainer.addEventListener("touchend", (e) => {
    clearTimeout(touchTimer);
    if (isLongPress) e.preventDefault();
  });
  legendsContainer.addEventListener("touchmove", () =>
    clearTimeout(touchTimer)
  );
  legendsContainer.addEventListener("click", (e) => {
    const item = e.target.closest("li[data-defect-name]");
    if (item && !isLongPress) updateDefectCount(item.dataset.defectName, 1);
  });
  legendsContainer.addEventListener("contextmenu", (e) => {
    const item = e.target.closest("li[data-defect-name]");
    if (item) {
      e.preventDefault();
      updateDefectCount(item.dataset.defectName, -1);
    }
  });
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
