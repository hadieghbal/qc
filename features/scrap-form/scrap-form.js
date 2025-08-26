// مسیر: js/pages/scrapForm.js
import { scrapFormData } from "./scrap-form-data.js";

export function init() {
  console.log("Scrap Form Initialized! (Mobile-Only)");
  // --- تعریف متغیرهای اصلی ---
  const Swal = window.Swal,
    Toastify = window.Toastify,
    Choices = window.Choices,
    html2canvas = window.html2canvas,
    jdp = window.jdp;

  const pageElement = document.getElementById("scrap-form-page");
  const tableBody = document.getElementById("main-table-body");
  const productTypeSelect = document.getElementById("product_type");
  const legendsContainer = document.getElementById("legends-container");

  if (!pageElement || !tableBody || !productTypeSelect || !legendsContainer) {
    console.error("Core elements for Scrap Form not found.");
    return;
  }
  // --- المان‌های فرم موبایل ---
  const mobileForm = {
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

  // ===== تابع جدید برای آپدیت کردن ظاهر دکمه‌های نقص =====
  function updateDefectLegendsSelection() {
    const targetInput = mobileForm.defectsSummary;
    if (!targetInput) return;
    const activeDefects = new Set(
      targetInput.value
        .split(" | ")
        .map((part) => part.split(":")[0].trim())
        .filter((name) => name)
    );
    document.querySelectorAll("#legends-list li").forEach((li) => {
      const defectName = li.dataset.defectName;
      li.classList.toggle("selected", activeDefects.has(defectName));
    });
  }

  // --- توابع کمکی ---
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
      gravity: "bottom",
      position: "center",
      stopOnFocus: true,
      style: { background: colors[type] || colors.info },
    }).showToast();
  }

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
    if (productTypeSelect) productTypeSelect.selectedIndex = 0;
    const nonElectricalRadio = document.querySelector(
      'input[name="waste_type"][value="غیربرقی"]'
    );
    if (nonElectricalRadio) nonElectricalRadio.checked = true;
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
    const exportBtn = pageElement.querySelector(".export-btn");
    if (exportBtn) exportBtn.style.display = "none";
    const exportImgBtn = pageElement.querySelector(".export-img-btn");
    if (exportImgBtn) exportImgBtn.style.display = "none";
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

    // فراخوانی تابع برای آپدیت ظاهر دکمه‌ها
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
    const wasteTypeEl = document.querySelector(
      'input[name="waste_type"]:checked'
    );
    return {
      globalDate: document.getElementById("jalali_date").value.trim(),
      globalLine: document.getElementById("line").value,
      globalProductType: productTypeSelect.value,
      wasteType: wasteTypeEl ? wasteTypeEl.value : "",
      approverControl: document.getElementById("approver-control").value.trim(),
      approverLine: document.getElementById("approver-line").value.trim(),
      approverEng: document.getElementById("approver-eng").value.trim(),
    };
  }

  function finalizeForm() {
    if (!validateAllForms()) return;
    const controlApprover = document.getElementById("approver-control"),
      lineApprover = document.getElementById("approver-line"),
      engApprover = document.getElementById("approver-eng");
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
      title: "ثبت نهایی فرم",
      text: "آیا از ثبت نهایی فرم اطمینان دارید؟ پس از تایید، امکان ویرایش وجود نخواهد داشت.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "بله، ثبت نهایی کن!",
      cancelButtonText: "انصراف",
    }).then((result) => {
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
        showToast(
          "فرم با موفقیت ثبت و قفل شد. اکنون می‌توانید خروجی بگیرید.",
          "success"
        );
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
          !btn.classList.contains("export-img-btn")
        )
          btn.disabled = true;
      });
    const finalizeBtn = pageElement.querySelector(".finalize-btn");
    finalizeBtn.innerHTML = `<i class="bi bi-lock-fill"></i> نهایی شده`;
    pageElement.querySelector(".export-btn").style.display = "inline-flex";
    pageElement.querySelector(".export-img-btn").style.display = "inline-flex";
  }

  function exportToCSV() {
    if (Object.keys(finalizedFormData).length === 0) {
      showToast("لطفا ابتدا فرم را ثبت نهایی کنید.", "warning");
      return;
    }
    const {
      globalDate,
      globalLine,
      globalProductType,
      wasteType,
      approverControl,
      approverLine,
      approverEng,
      tableData,
    } = finalizedFormData;
    const fileName = `گزارش ضایعات ${globalDate.replace(
      /\//g,
      "."
    )} - ${globalLine.replace(/\s/g, "_")} - ${globalProductType} - ${
      wasteType === "برقی" ? "برقی" : "غیربرقی"
    }`;
    const headers = [
      "تاریخ",
      "خط",
      "نوع محصول",
      "نوع ضایعات",
      "ردیف",
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
        globalDate,
        globalLine,
        globalProductType,
        wasteType,
        index + 1,
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
        approverControl,
        approverLine,
        approverEng,
      ];
      csvContent += rowDataValues.map(cleanCell).join(",") + "\r\n";
    });
    downloadFile(csvContent, `${fileName}.csv`, "text/csv;charset=utf-8;");
  }

  async function exportToImage() {
    if (Object.keys(finalizedFormData).length === 0) {
      showToast("لطفا ابتدا فرم را ثبت نهایی کنید.", "warning");
      return;
    }
    const exportButton = pageElement.querySelector(".export-img-btn");
    toggleButtonLoading(exportButton, true, "در حال آماده سازی...");
    const {
      globalDate,
      globalLine,
      globalProductType,
      wasteType,
      approverControl,
      approverLine,
      approverEng,
      tableData,
    } = finalizedFormData;
    const baseFileName = `گزارش ضایعات ${globalDate.replace(
      /\//g,
      "."
    )} - ${globalLine.replace(/\s/g, "_")} - ${globalProductType} - ${
      wasteType === "برقی" ? "برقی" : "غیربرقی"
    }`;
    const itemsPerPage = 10;
    const totalPages = Math.ceil(tableData.length / itemsPerPage);
    const dataChunks = [];
    for (let i = 0; i < tableData.length; i += itemsPerPage) {
      dataChunks.push(tableData.slice(i, i + itemsPerPage));
    }
    for (let i = 0; i < dataChunks.length; i++) {
      const chunk = dataChunks[i];
      const currentPage = i + 1;
      const pageContainer = document.querySelector(".print-page-container");
      pageContainer.style.display = "flex";
      try {
        const wasteTypeText = document
          .querySelector(`input[name="waste_type"][value="${wasteType}"]`)
          .parentElement.textContent.trim();
        const originalHeaderClone = document
          .getElementById("main-header")
          .cloneNode(true);
        originalHeaderClone.querySelector(".page-menu")?.remove();
        originalHeaderClone.querySelector(".back-button")?.remove();
        let itemsHTML = "";
        chunk.forEach((data, index) => {
          const itemIndexInTotal = i * itemsPerPage + index + 1;
          let detailsFinalHTML = "";
          if (data.product_model)
            detailsFinalHTML += `<span><i class="bi bi-textarea-t icon-model"></i> مدل: ${data.product_model}</span>`;
          if (data.group)
            detailsFinalHTML += `<span><i class="bi bi-collection icon-group"></i> گروه: ${data.group}</span>`;
          if (data.item)
            detailsFinalHTML += `<span><i class="bi bi-tags icon-item"></i> آیتم: ${data.item}</span>`;
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
            detailsFinalHTML += `<span><i class="bi bi-house-down icon-supplier"></i> ${supplierParts.join(
              " | "
            )}</span>`;
          const sourceParts = [];
          if (data.source_packaging > 0)
            sourceParts.push(`بسته‌بندی: ${data.source_packaging}`);
          if (data.source_warehouse > 0)
            sourceParts.push(`انبار: ${data.source_warehouse}`);
          if (data.source_production > 0)
            sourceParts.push(`حین تولید: ${data.source_production}`);
          if (sourceParts.length > 0)
            detailsFinalHTML += `<span><i class="bi bi-graph-down-arrow icon-source"></i> ${sourceParts.join(
              " | "
            )}</span>`;
          if (data.defects_summary)
            detailsFinalHTML += `<span><i class="bi bi-card-text icon-defect"></i> ${data.defects_summary}</span>`;
          if (data.comments)
            detailsFinalHTML += `<span><i class="bi bi-chat-left-text"></i> ${data.comments}</span>`;
          itemsHTML += `<div class="export-item-card"><div class="export-item-header"><h2 class="export-item-title">${itemIndexInTotal}. ${data.part_name}</h2><span class="export-item-count">تعداد: ${data.total_count}</span></div><div class="export-item-details">${detailsFinalHTML}</div></div>`;
        });
        let approvalHTML = "";
        if (approverControl || approverLine || approverEng) {
          approvalHTML = `<div class="approvers-container"><h4></h4><div class="approver-group"><label>1. نماینده کنترل:</label><span class="approver-group-name">${
            approverControl || " "
          }</span></div><div class="approver-group"><label>2. نماینده تولید:</label><span class="approver-group-name">${
            approverLine || " "
          }</span></div><div class="approver-group"><label>3. نماینده فنی و مهندسی:</label><span class="approver-group-name">${
            approverEng || " "
          }</span></div></div>`;
        }
        const pageFooterHTML = `<footer>صفحه ${currentPage} از ${totalPages}</footer>`;
        const pageContentHTML = `${originalHeaderClone.outerHTML}<div class="export-top-info"><div><strong>تاریخ :</strong> ${globalDate}</div><div><strong>خط :</strong> ${globalLine}</div><div><strong>نوع محصول :</strong> ${globalProductType}</div><div><strong>نوع ضایعات :</strong> ${wasteTypeText}</div></div><div class="export-items-list">${itemsHTML}</div>${approvalHTML}${pageFooterHTML}`;
        pageContainer.innerHTML = pageContentHTML;
        await new Promise((resolve) => setTimeout(resolve, 100));
        const canvas = await html2canvas(pageContainer, {
          useCORS: true,
          scale: 2,
          backgroundColor: "#ffffff",
        });
        const fileName =
          totalPages > 1
            ? `${baseFileName} (صفحه ${currentPage} از ${totalPages}).png`
            : `${baseFileName}.png`;
        downloadFile(canvas.toDataURL("image/png"), fileName);
      } catch (err) {
        console.error(`خطا در ایجاد تصویر صفحه ${currentPage}:`, err);
        showToast(
          `متاسفانه در ایجاد خروجی تصویر صفحه ${currentPage} خطایی رخ داد.`,
          "error"
        );
      } finally {
        pageContainer.style.display = "none";
        pageContainer.innerHTML = "";
      }
    }
    toggleButtonLoading(
      exportButton,
      false,
      `<i class="bi bi-camera-fill"></i> خروجی تصویر فرم`
    );
  }

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
      const mainRowHTML = ` <div class="summary-main-row" style="grid-template-columns: 1fr auto auto;"> <span class="summary-text">${
        index + 1
      }. ${
        data.part_name
      }</span> <div class="summary-actions"> <button type="button" class="summary-edit-btn" title="ویرایش"><i class="bi bi-pencil-square"></i></button> <button type="button" class="summary-delete-btn" title="حذف"><i class="bi bi-trash3-fill"></i></button> </div> <span class="summary-count">تعداد: ${
        data.total_count
      }</span> </div>`;
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
          el.id === "mobile-part-name"
            ? el.closest(".mobile-form-group")
            : el.closest(".counter-input-group") || el;
        if (container) container.classList.remove("required-field-error");
      });
    if (mobilePartNameChoice) mobilePartNameChoice.setChoiceByValue("");
    Object.keys(mobileForm).forEach((key) => {
      const el = mobileForm[key];
      if (el && el.tagName && key !== "partName") {
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
      mobileForm.productModel.value = lastValidRow.querySelector(
        '[name="product_model"]'
      ).value;
      mobileForm.group.value =
        lastValidRow.querySelector('[name="group"]').value;
      mobileForm.item.value = lastValidRow.querySelector('[name="item"]').value;
    } else {
      mobileForm.productModel.value = "";
      mobileForm.group.value = scrapFormData.groups[0] || "";
      mobileForm.item.value = "";
    }
    mobileForm.addBtn.innerHTML =
      '<i class="bi bi-check-circle-fill"></i> ثبت و افزودن به لیست';
    mobileForm.addBtn.style.backgroundColor = "var(--success-color)";

    // فراخوانی تابع برای آپدیت ظاهر دکمه‌ها
    updateDefectLegendsSelection();

    if (focusOnPartName && window.innerWidth < 992) {
      mobilePartNameChoice.showDropdown();
    }
  }

  function updateAllPartNameDropdowns() {
    const productType = productTypeSelect.value;
    const newParts = scrapFormData.parts[productType] || [];
    const choicesArray = [
      { value: "", label: "انتخاب قطعه...", placeholder: true, disabled: true },
    ].concat(newParts.map((name) => ({ value: name, label: name })));
    if (mobilePartNameChoice) {
      const currentVal = mobilePartNameChoice.getValue(true);
      mobilePartNameChoice.setChoices(choicesArray, "value", "label", true);
      if (newParts.includes(currentVal))
        mobilePartNameChoice.setChoiceByValue(currentVal);
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
    const { globalDate, globalLine, globalProductType } = getGlobalData();
    const dateInput = document.getElementById("jalali_date"),
      lineSelect = document.getElementById("line");
    [dateInput, lineSelect, productTypeSelect].forEach((el) =>
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
    if (!globalProductType) {
      productTypeSelect.classList.add("required-field-error");
      firstInvalidElement = firstInvalidElement || productTypeSelect;
    }
    if (firstInvalidElement) {
      showToast(
        "لطفا فیلدهای اصلی بالای فرم (تاریخ، خط، نوع محصول) را تکمیل کنید.",
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

    // فراخوانی تابع برای آپدیت ظاهر دکمه‌ها
    updateDefectLegendsSelection();
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

  function toggleButtonLoading(button, isLoading, text) {
    button.disabled = isLoading;
    button.innerHTML = text;
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
  populateSelect(productTypeSelect, scrapFormData.productTypes, true);
  populateSelect(mobileForm.group, scrapFormData.groups);
  populateLegends(
    document.getElementById("legends-list"),
    scrapFormData.defects
  );
  mobilePartNameChoice = new Choices(mobileForm.partName, choicesConfig);
  updateAllPartNameDropdowns();
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
    if (jdp) {
      jdp.render(dateInput, { usePersianDigits: true, format: "YYYY/MM/DD" });
    }
  }

  // --- ثبت Event Listener ها ---
  addSafeEventListener(".finalize-btn", "click", finalizeForm);
  addSafeEventListener(".export-btn", "click", exportToCSV);
  addSafeEventListener(".export-img-btn", "click", exportToImage);

  if (mobileForm.addBtn) {
    mobileForm.addBtn.addEventListener("click", () => {
      const requiredElements = document.querySelectorAll(
        "#mobile-form-wrapper [data-required-name]"
      );
      let firstInvalidElement = null;
      requiredElements.forEach((el) => {
        const container =
          el.id === "mobile-part-name"
            ? el.parentElement.querySelector(".choices")
            : el.closest(".counter-input-group") ||
              el.closest(".mobile-form-group") ||
              el;
        if (container) container.classList.remove("required-field-error");
      });
      for (const el of requiredElements) {
        if (!el.value || (el.id === "mobile-total-count" && el.value === "0")) {
          const container =
            el.id === "mobile-part-name"
              ? el.parentElement.querySelector(".choices")
              : el.closest(".counter-input-group") ||
                el.closest(".mobile-form-group") ||
                el;
          if (container) container.classList.add("required-field-error");
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
        if (accordionContent) {
          accordionContent.style.display = "flex";
          accordionContent.previousElementSibling.classList.add("active");
        }
        return;
      }
      const mobileData = {
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
      const rowIndex = parseInt(li.dataset.rowIndex, 10),
        rowElement = tableBody.rows[rowIndex];
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
  productTypeSelect.addEventListener("change", updateAllPartNameDropdowns);

  [
    "jalali_date",
    "line",
    "product_type",
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
