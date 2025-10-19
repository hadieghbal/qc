// مسیر: js/pages/orgChart.js
import { loadData } from "/js/utils/store.js";

export function init() {
  console.log("Org Chart Initialized with hierarchical logic!");
  const chartContainer = document.getElementById("chart-container");
  const STORAGE_KEY = "personnel_data";
  const personnel = loadData(STORAGE_KEY) || [];

  if (personnel.length === 0) {
    chartContainer.innerHTML = `<p style='text-align:center; color: var(--secondary-color);'>داده‌ای برای نمایش چارت وجود ندارد. لطفاً ابتدا پرسنل را در صفحه "ثبت و مدیریت پرسنل" وارد کنید.</p>`;
    return;
  }

  function createNodeHTML(person) {
    const unitClass = person.unit.replace(/\s/g, "-");
    const unitBadgeHTML = `<div class="node-unit"><span class="unit-badge unit-${unitClass}">${person.unit}</span></div>`;

    let genderIcon = "";
    if (person.gender === "مرد") {
      genderIcon = `<i class="bi bi-gender-male gender-icon male" title="مرد"></i>`;
    } else if (person.gender === "زن") {
      genderIcon = `<i class="bi bi-gender-female gender-icon female" title="زن"></i>`;
    }

    return `<div class="node position-${person.position}">
              <div class="node-name">${genderIcon} ${person.name}</div>
              <div class="node-position">${person.position}</div>
              ${unitBadgeHTML}
            </div>`;
  }

  function buildTreeHTML(managerId) {
    const children = personnel.filter((p) => p.reportsTo === managerId);
    if (children.length === 0) {
      return "";
    }
    let html = "<ul>";
    children.forEach((child) => {
      html += `<li>
                 ${createNodeHTML(child)}
                 ${buildTreeHTML(child.id)} 
               </li>`;
    });
    html += "</ul>";
    return html;
  }

  const rootPersonnel = personnel.filter((p) => !p.reportsTo);

  const chartHTML = `
    <div class="tree">
      <ul>
        ${rootPersonnel
          .map(
            (person) => `
          <li>
            ${createNodeHTML(person)}
            ${buildTreeHTML(person.id)}
          </li>
        `
          )
          .join("")}
      </ul>
    </div>
  `;

  chartContainer.innerHTML = chartHTML;

  if (rootPersonnel.length === 0) {
    chartContainer.innerHTML = `<p style='text-align:center; color: var(--danger-color);'>خطا: هیچ نیروی سطح بالایی (بدون سرپرست) در لیست یافت نشد. چارت قابل رسم نیست.</p>`;
  }
}
