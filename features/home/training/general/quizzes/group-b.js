// QC/features/home/training/general/group-b.js

// پاسخ‌های صحیح به سوالات (اندیس 0 برای سوال 1، اندیس 1 برای سوال 2 و...)
// هر مقدار نشان‌دهنده اندیس گزینه صحیح است (الف=0، ب=1، ج=2، د=3)
const correctAnswers = [
  3, // سوال ۱: د
  1, // سوال ۲: ب
  0, // سوال ۳: الف
  2, // سوال ۴: ج
  1, // سوال ۵: ب
  2, // سوال ۶: ج
  0, // سوال ۷: الف
  3, // سوال ۸: د
  1, // سوال ۹: ب
  0, // سوال ۱۰: الف
  3, // سوال ۱۱: د
  2, // سوال ۱۲: ج
  1, // سوال ۱۳: ب
  0, // سوال ۱۴: الف
  3, // سوال ۱۵: د
  2, // سوال ۱۶: ج
  1, // سوال ۱۷: ب
  0, // سوال ۱۸: الف
  2, // سوال ۱۹: ج
  1, // سوال ۲۰: ب
  1, // سوال ۲۱: ب
  0, // سوال ۲۲: الف
  3, // سوال ۲۳: د
  2, // سوال ۲۴: ج
  1, // سوال ۲۵: ب
  0, // سوال ۲۶: الف
  3  // سوال ۲۷: د
];

// تابع برای دریافت تاریخ روز به فرمت شمسی (جدید)
function getPersianDate() {
    const now = new Date();
    // استفاده از توابع بومی برای تاریخ شمسی (fa-IR)
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return now.toLocaleDateString('fa-IR', options);
}


export function init() {
  const form = document.getElementById('quiz-form');
  const resultDiv = document.getElementById('quiz-result');
  const questionsContainer = document.getElementById('questions-container');

  // اگر فرم وجود نداشت، نیازی به ادامه نیست
  if (!form) return;
  
  // ۱. نمایش تاریخ روز (جدید)
  const dateElement = document.getElementById('current-date');
  if (dateElement) {
      dateElement.textContent = getPersianDate();
  }
  
  // تابع اصلی بررسی آزمون
  function checkQuiz(e) {
    e.preventDefault();
    
    // ۱. بررسی نام
    const userNameInput = document.getElementById('user-name');
    const userName = userNameInput ? userNameInput.value.trim() : 'ناشناس'; 
    
    if (userNameInput && userName === "") { 
      window.Swal.fire('خطا', 'لطفاً نام و نام خانوادگی خود را وارد کنید.', 'error');
      return;
    }

    let correctCount = 0;
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
    const incorrectCount = totalQuestions - correctCount;
    const percentage = Math.round((correctCount / totalQuestions) * 100); 

    resultDiv.innerHTML = `
      <div class="result-box">
        <h3>نتیجه آزمون</h3>
        <p><strong>شرکت کننده:</strong> ${userName}</p>
        <p><strong>تاریخ آزمون:</strong> ${getPersianDate()}</p>
        <p><strong>تعداد سوالات:</strong> ${totalQuestions}</p>
        <p><strong>پاسخ‌های صحیح:</strong> <span class="correct-count">${correctCount}</span></p>
        <p><strong>پاسخ‌های نادرست:</strong> <span style="color: var(--danger-color); font-weight: bold;">${incorrectCount}</span></p>
        <p><strong>درصد موفقیت:</strong> <span class="percentage-result">${percentage}%</span></p>
      </div>
    `;

    // ۴. اسکرول به بخش نتایج (جدید)
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('submit', checkQuiz);
}