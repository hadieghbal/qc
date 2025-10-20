// QC/features/home/training/general/group-a.js

// پاسخ‌های صحیح به سوالات (اندیس 0 برای سوال 1، اندیس 1 برای سوال 2 و...)
// هر مقدار نشان‌دهنده اندیس گزینه صحیح است (الف=0، ب=1، ج=2، د=3)
const correctAnswers = [
  2, // سوال ۱: ج
  2, // سوال ۲: ج
  3, // سوال ۳: د
  3, // سوال ۴: د
  3, // سوال ۵: د
  1, // سوال ۶: ب
  3, // سوال ۷: د
  1, // سوال ۸: ب
  1, // سوال ۹: ب
  0, // سوال ۱۰: الف
  0, // سوال ۱۱: الف
  0, // سوال ۱۲: الف
  2, // سوال ۱۳: ج
  1, // سوال ۱۴: ب
  3, // سوال ۱۵: د
  1, // سوال ۱۶: ب
  0, // سوال ۱۷: الف
  2, // سوال ۱۸: ج
  0, // سوال ۱۹: الف
  1, // سوال ۲۰: ب
  3, // سوال ۲۱: د
  2, // سوال ۲۲: ج
  0, // سوال ۲۳: الف
  0, // سوال ۲۴: الف
  2, // سوال ۲۵: ج
  3, // سوال ۲۶: د
  1  // سوال ۲۷: ب
];

// متغیر برای جلوگیری از اجرای مجدد منطق آزمون
let isQuizLocked = false; 

// تابع برای دریافت تاریخ روز به فرمت شمسی
function getPersianDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return now.toLocaleDateString('fa-IR', options);
}

export function init() {
  
  const form = document.getElementById('quiz-form');
  const resultDiv = document.getElementById('quiz-result');
  const questionsContainer = document.getElementById('questions-container');
  const submitButton = form ? form.querySelector('button[type="submit"]') : null;
  const currentDate = getPersianDate();

  if (!form) return;
  
  // ۱. نمایش تاریخ روز
  const dateElement = document.getElementById('current-date');
  if (dateElement) {
      dateElement.textContent = currentDate;
  }

  // تابع قفل کردن سوالات 
  function lockQuiz() {
    if (isQuizLocked) return;

    isQuizLocked = true;
    submitButton.textContent = 'نتایج ثبت شده (آزمون قفل شد)';
    submitButton.disabled = true;

    // غیرفعال کردن تمامی Radio Button ها
    questionsContainer.querySelectorAll('input[type="radio"]').forEach(input => {
        input.disabled = true;
    });

     // غیرفعال کردن فیلد نام
    const userNameInput = document.getElementById('user-name');
    if (userNameInput) {
        userNameInput.disabled = true;
    }
  }
  
  // تابع اصلی بررسی آزمون
  function checkQuiz(e) {
    e.preventDefault();
    
    if (isQuizLocked) {
        window.Swal.fire('توجه', 'آزمون قبلاً ثبت و قفل شده است.', 'warning');
        return;
    }
    
    // ۱. بررسی نام
    const userNameInput = document.getElementById('user-name');
    const userName = userNameInput ? userNameInput.value.trim() : 'ناشناس'; 
    
    if (userNameInput && userName === "") { 
      window.Swal.fire('خطا', 'لطفاً نام و نام خانوادگی خود را وارد کنید.', 'error');
      return;
    }

    let correctCount = 0;
    let unansweredCount = 0; 
    const questions = questionsContainer.querySelectorAll('.quiz-question');
    
    // ۲. نمره‌دهی و هایلایت پاسخ‌ها
    questions.forEach((question, index) => {
      const questionIndex = index + 1;
      const inputs = question.querySelectorAll(`input[name="q${questionIndex}"]`);
      let selectedAnswer = -1;
      
      // ابتدا، تمام کلاس‌های هایلایت را پاک کن
      question.querySelectorAll('.option-label').forEach(label => {
        label.classList.remove('correct', 'incorrect');
      });

      // یافتن پاسخ انتخاب شده
      inputs.forEach((input, inputIndex) => {
        if (input.checked) {
          selectedAnswer = inputIndex;
        }
      });

      // محاسبه سوالات بدون پاسخ
      if (selectedAnswer === -1) {
          unansweredCount++;
      }

      // بررسی پاسخ
      const correctAnswerIndex = correctAnswers[index];
      
      // هایلایت پاسخ صحیح (همیشه)
      const correctLabel = question.querySelectorAll('.option-label')[correctAnswerIndex];
      if (correctLabel) {
          correctLabel.classList.add('correct');
      }

      if (selectedAnswer !== -1) {
        if (selectedAnswer === correctAnswerIndex) {
          correctCount++;
        } else {
          // هایلایت پاسخ اشتباه انتخاب شده
          const selectedLabel = question.querySelector(`input[name="q${questionIndex}"]:checked`).closest('.option-label');
          if (selectedLabel) {
              selectedLabel.classList.add('incorrect');
          }
        }
      }
    });

    // ۳. نمایش نتیجه
    const totalQuestions = correctAnswers.length;
    const incorrectCount = totalQuestions - correctCount - unansweredCount; 
    const percentage = Math.round((correctCount / totalQuestions) * 100); 
    const isSuccess = percentage >= 70; 

    resultDiv.innerHTML = `
      <div class="result-box" id="final-result-box" style="background-color: ${isSuccess ? 'var(--success-bg-color)' : 'var(--danger-bg-color)'}; border-color: ${isSuccess ? 'var(--success-color)' : 'var(--danger-color)'};">
        <h3>نتیجه آزمون نهایی</h3>
        <p><strong>شرکت کننده:</strong> ${userName}</p>
        <p><strong>تاریخ آزمون:</strong> ${currentDate}</p>
        <p><strong>تعداد سوالات:</strong> ${totalQuestions}</p>
        <p><strong>پاسخ‌های صحیح:</strong> <span class="correct-count" style="color: var(--success-color);">${correctCount}</span></p>
        <p><strong>پاسخ‌های نادرست:</strong> <span style="color: var(--danger-color); font-weight: bold;">${incorrectCount}</span></p>
        <p><strong>بدون پاسخ:</strong> <span style="color: var(--warning-color); font-weight: bold;">${unansweredCount}</span></p>
        <p><strong>درصد موفقیت:</strong> <span class="percentage-result" style="color: ${isSuccess ? 'var(--success-color)' : 'var(--danger-color)'};">${percentage}%</span></p>
      </div>
    `;

    // ۴. قفل کردن آزمون پس از اولین بررسی
    lockQuiz();

    // ۵. اسکرول به بخش نتایج
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('submit', checkQuiz);
}