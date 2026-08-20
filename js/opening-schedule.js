// ===============================
// OPENING SCHEDULE COUNTDOWN
// Đổi ngày tại data-opening-date trong index.html.
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  const scheduleSection = document.querySelector("[data-opening-date]");

  if (!scheduleSection) {
    return;
  }

  const targetTime = new Date(scheduleSection.dataset.openingDate).getTime();
  const daysElement = scheduleSection.querySelector("[data-countdown-days]");
  const hoursElement = scheduleSection.querySelector("[data-countdown-hours]");
  const minutesElement = scheduleSection.querySelector("[data-countdown-minutes]");
  const secondsElement = scheduleSection.querySelector("[data-countdown-seconds]");
  const messageElement = scheduleSection.querySelector("[data-countdown-message]");
  const dateTextElement = scheduleSection.querySelector("[data-opening-date-text]");

  if (
    !Number.isFinite(targetTime) ||
    !daysElement ||
    !hoursElement ||
    !minutesElement ||
    !secondsElement
  ) {
    return;
  }

  let countdownTimer = null;

  if (dateTextElement) {
    const openingDate = new Date(targetTime);
    const formattedDate = new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(openingDate);

    dateTextElement.textContent =
      formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    dateTextElement.dateTime = openingDate.toISOString();
  }

  function formatNumber(value) {
    return String(value).padStart(2, "0");
  }

  function updateCountdown() {
    const remainingTime = targetTime - Date.now();

    if (remainingTime <= 0) {
      daysElement.textContent = "00";
      hoursElement.textContent = "00";
      minutesElement.textContent = "00";
      secondsElement.textContent = "00";

      if (messageElement) {
        messageElement.textContent =
          "Khóa học đã khai giảng. Phụ huynh vẫn có thể đăng ký để nhận lịch lớp phù hợp tiếp theo.";
      }

      if (countdownTimer !== null) {
        window.clearInterval(countdownTimer);
      }

      return;
    }

    const totalSeconds = Math.floor(remainingTime / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    daysElement.textContent = formatNumber(days);
    hoursElement.textContent = formatNumber(hours);
    minutesElement.textContent = formatNumber(minutes);
    secondsElement.textContent = formatNumber(seconds);
  }

  updateCountdown();
  countdownTimer = window.setInterval(updateCountdown, 1000);
});
