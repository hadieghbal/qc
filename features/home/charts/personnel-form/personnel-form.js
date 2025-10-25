// مسیر: js/pages/personnelForm.js
import { orgChartData } from "../org-chart/org-chart-data.js";
import { saveData, loadData } from '../../../js/utils/store.js';

export function init() {
  console.log("Personnel Form Initialized with Supervisor Finder!");
  const Swal = window.Swal,
    Toastify = window.Toastify;
  const pageElement = document.getElementById("personnel-form-page");
  if (!pageElement) return;

  const form = document.getElementById("personnel-form");
  const formTitle = document.getElementById("form-title");
  const codeInput = document.getElementById("personnel-code");
  const nameInput = document.getElementById("personnel-name");
  const unitSelect = document.getElementById("personnel-unit");
  const positionSelect = document.getElementById("personnel-position");
  const genderSelect = document.getElementById("personnel-gender");
  const reportsToSelect = document.getElementById("personnel-reportsTo");
  const submitBtn = document.getElementById("submit-btn");
  const personnelList = document.getElementById("personnel-list");

  const STORAGE_KEY = "personnel_data";
  let personnel = [];
  let editingId = null;

  function showToast(message, type = "info") {
    const colors = {
      info: "linear-gradient(to right, #0dcaf0, #0d6efd)",
      success: "linear-gradient(to right, #198754, #1D976C)",
      error: "linear-gradient(to right, #dc3545, #ff5f6d)",
    };
    Toastify({
      text: message,
      duration: 3000,
      close: true,
      gravity: "bottom",
      position: "center",
      style: { background: colors[type] || colors.info },
    }).showToast();
  }

  function findUltimateSupervisor(personId, allPersonnel) {
    let currentPerson = allPersonnel.find((p) => p.id === personId);
    let safetyCounter = 0;

    while (currentPerson && safetyCounter < 20) {
      if (currentPerson.position === "سرپرست") {
        return currentPerson;
      }
      if (!currentPerson.reportsTo) {
        return null;
      }
      currentPerson = allPersonnel.find(
        (p) => p.id === currentPerson.reportsTo
      );
      safetyCounter++;
    }
    return null;
  }

  function populateSelects() {
    const populate = (selectEl, data, placeholder) => {
      selectEl.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
      data.forEach((item) => {
        selectEl.innerHTML += `<option value="${item}">${item}</option>`;
      });
    };
    populate(unitSelect, orgChartData.units, "واحد را انتخاب کنید...");
    populate(positionSelect, orgChartData.positions, "سمت را انتخاب کنید...");
    populate(genderSelect, orgChartData.genders, "جنسیت را انتخاب کنید...");

    reportsToSelect.innerHTML = `<option value="">هیچکدام (سطح بالا)</option>`;
    personnel
      .sort((a, b) => a.name.localeCompare(b.name, "fa"))
      .forEach((p) => {
        if (!editingId || p.id !== editingId) {
          reportsToSelect.innerHTML += `<option value="${p.id}">${p.name} (${p.position})</option>`;
        }
      });
  }

  function renderList() {
    personnel.sort((a, b) => (Number(a.code) || 0) - (Number(b.code) || 0));

    personnelList.innerHTML = "";
    if (personnel.length === 0) {
      personnelList.innerHTML =
        "<p style='text-align:center; color: var(--secondary-color);'>هنوز پرسنلی ثبت نشده است.</p>";
      return;
    }

    personnel.forEach((p, index) => {
      let supervisorHTML = "";
      if (p.position === "سرپرست") {
        const manager = personnel.find(
          (m) => m.id === p.reportsTo && m.position === "مدیر"
        );
        if (manager) {
          supervisorHTML = `<span><i class="bi bi-person-check-fill"></i> مدیر: ${manager.name}</span>`;
        }
      } else if (p.position !== "مدیر") {
        const supervisor = findUltimateSupervisor(p.id, personnel);
        if (supervisor) {
          supervisorHTML = `<span><i class="bi bi-person-check-fill"></i> سرپرست: ${supervisor.name}</span>`;
        }
      }

      const li = document.createElement("li");
      li.dataset.id = p.id;
      li.innerHTML = `
        <div class="summary-main-row">
          <span class="summary-text"><span class="row-number">${
            index + 1
          }.</span> ${p.name}</span>
          <div class="summary-actions">
            <button type="button" class="summary-edit-btn" title="ویرایش"><i class="bi bi-pencil-square"></i></button>
            <button type="button" class="summary-delete-btn" title="حذف"><i class="bi bi-trash3-fill"></i></button>
          </div>
        </div>
        <div class="summary-details">
          <span><i class="bi bi-person-badge"></i> کد: ${p.code}</span>
          <span><i class="bi bi-briefcase-fill"></i> سمت: ${p.position}</span>
          <span><i class="bi bi-building"></i> واحد: ${p.unit}</span>
          <span><i class="bi bi-gender-ambiguous"></i> جنسیت: ${p.gender}</span>
          ${supervisorHTML}
        </div>
      `;
      personnelList.appendChild(li);
    });
  }

  function resetForm() {
    form.reset();
    editingId = null;
    formTitle.innerHTML = '<i class="bi bi-person-plus"></i> افزودن نیروی جدید';
    submitBtn.innerHTML = '<i class="bi bi-check-circle-fill"></i> ثبت';
    submitBtn.style.backgroundColor = "var(--success-color)";
    populateSelects();
    codeInput.focus();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const personData = {
      id: editingId || Date.now(),
      code: codeInput.value.trim(),
      name: nameInput.value.trim(),
      unit: unitSelect.value,
      position: positionSelect.value,
      gender: genderSelect.value,
      reportsTo: reportsToSelect.value ? Number(reportsToSelect.value) : null,
    };
    if (
      !personData.code ||
      !personData.name ||
      !personData.unit ||
      !personData.position ||
      !personData.gender
    ) {
      showToast("لطفاً تمام فیلدها را تکمیل کنید.", "error");
      return;
    }
    if (editingId) {
      const index = personnel.findIndex((p) => p.id === editingId);
      personnel[index] = personData;
      showToast("اطلاعات با موفقیت ویرایش شد.", "success");
    } else {
      personnel.push(personData);
      showToast("نیروی جدید با موفقیت ثبت شد.", "success");
    }
    saveData(STORAGE_KEY, personnel);
    renderList();
    resetForm();
  });

  personnelList.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".summary-edit-btn");
    const deleteBtn = e.target.closest(".summary-delete-btn");
    if (!editBtn && !deleteBtn) return;

    const li = e.target.closest("li[data-id]");
    const id = Number(li.dataset.id);
    const person = personnel.find((p) => p.id === id);

    if (editBtn) {
      editingId = id;
      populateSelects();
      codeInput.value = person.code;
      nameInput.value = person.name;
      unitSelect.value = person.unit;
      positionSelect.value = person.position;
      genderSelect.value = person.gender;
      reportsToSelect.value = person.reportsTo || "";
      formTitle.innerHTML =
        '<i class="bi bi-pencil-square"></i> ویرایش اطلاعات';
      submitBtn.innerHTML =
        '<i class="bi bi-check-circle-fill"></i> به‌روزرسانی';
      submitBtn.style.backgroundColor = "var(--primary-color)";
      form.scrollIntoView({ behavior: "smooth" });
    }
    if (deleteBtn) {
      Swal.fire({
        title: "حذف پرسنل",
        text: `آیا از حذف "${person.name}" اطمینان دارید؟`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "بله، حذف کن",
        cancelButtonText: "انصراف",
      }).then((result) => {
        if (result.isConfirmed) {
          personnel = personnel.filter((p) => p.id !== id);
          saveData(STORAGE_KEY, personnel);
          renderList();
          resetForm();
          showToast(`"${person.name}" حذف شد.`, "info");
        }
      });
    }
  });

  personnel = loadData(STORAGE_KEY) || [];
  populateSelects();
  renderList();
}
