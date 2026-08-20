// ===============================
// FLOATING CONTACT & MINI ASSISTANT
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  const contactChoiceTriggers = document.querySelectorAll(
    "[data-open-contact-choice]",
  );
  const contactChoiceOverlay = document.getElementById("contactChoiceOverlay");
  const contactChoiceDialog = document.getElementById("contactChoiceDialog");
  const contactChoiceClose = document.getElementById("contactChoiceClose");

  const assistantPanel = document.getElementById("aiAssistantPanel");
  const assistantLauncher = document.getElementById("aiAssistantLauncher");
  const assistantClose = document.getElementById("aiAssistantClose");
  const assistantMessages = document.getElementById("aiAssistantMessages");
  const assistantForm = document.getElementById("aiAssistantForm");
  const assistantInput = document.getElementById("aiAssistantInput");
  const assistantSuggestions = document.querySelectorAll(
    "[data-assistant-question]",
  );

  let lastContactTrigger = null;

  function isContactChoiceOpen() {
    return contactChoiceOverlay?.classList.contains("show") || false;
  }

  function openContactChoice(event) {
    event?.preventDefault();

    if (!contactChoiceOverlay) {
      return;
    }

    lastContactTrigger = event?.currentTarget || document.activeElement;
    contactChoiceOverlay.classList.add("show");
    contactChoiceOverlay.setAttribute("aria-hidden", "false");

    window.requestAnimationFrame(() => {
      contactChoiceClose?.focus();
    });
  }

  function closeContactChoice({ restoreFocus = true } = {}) {
    if (!contactChoiceOverlay) {
      return;
    }

    contactChoiceOverlay.classList.remove("show");
    contactChoiceOverlay.setAttribute("aria-hidden", "true");

    if (restoreFocus && lastContactTrigger instanceof HTMLElement) {
      lastContactTrigger.focus();
    }
  }

  contactChoiceTriggers.forEach((trigger) => {
    trigger.addEventListener("click", openContactChoice);
  });

  contactChoiceClose?.addEventListener("click", () => {
    closeContactChoice();
  });

  contactChoiceOverlay?.addEventListener("click", (event) => {
    if (event.target === contactChoiceOverlay) {
      closeContactChoice();
    }
  });

  contactChoiceDialog?.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  contactChoiceDialog?.querySelectorAll("a").forEach((contactLink) => {
    contactLink.addEventListener("click", () => {
      closeContactChoice({
        restoreFocus: false,
      });
    });
  });

  function isAssistantOpen() {
    return assistantPanel?.classList.contains("show") || false;
  }

  function openAssistant() {
    if (!assistantPanel || !assistantLauncher) {
      return;
    }

    assistantPanel.classList.add("show");
    assistantPanel.setAttribute("aria-hidden", "false");
    assistantLauncher.setAttribute("aria-expanded", "true");

    window.requestAnimationFrame(() => {
      assistantInput?.focus();
    });
  }

  function closeAssistant({ restoreFocus = true } = {}) {
    if (!assistantPanel || !assistantLauncher) {
      return;
    }

    assistantPanel.classList.remove("show");
    assistantPanel.setAttribute("aria-hidden", "true");
    assistantLauncher.setAttribute("aria-expanded", "false");

    if (restoreFocus) {
      assistantLauncher.focus();
    }
  }

  assistantLauncher?.addEventListener("click", () => {
    if (isAssistantOpen()) {
      closeAssistant();
    } else {
      openAssistant();
    }
  });

  assistantClose?.addEventListener("click", () => {
    closeAssistant();
  });

  const openingDateText =
    document.querySelector("[data-opening-date-text]")?.textContent.trim() ||
    "ngày được thông báo trên mục Lịch khai giảng";

  const assistantAnswers = {
    opening:
      `Khóa mới dự kiến khai giảng vào ${openingDateText}. Phụ huynh có thể bấm “Đăng ký giữ chỗ” để trung tâm tư vấn và sắp xếp lớp phù hợp.`,
    courses:
      "Đăng Lưu hiện có lộ trình từ Pre-Starters, Starters, Movers, Flyers, KET, PET đến IELTS, phù hợp với nhiều độ tuổi và nền tảng khác nhau.",
    trial:
      "Học viên được đăng ký kiểm tra trình độ và học thử miễn phí. Học phí sẽ được tư vấn theo chương trình và thời lượng học phù hợp.",
    address:
      "Trung tâm ở 125 Bùi Ngọc Thu, Phường Chánh Hiệp, TP.HCM. Thời gian hoạt động từ 08:00 đến 21:00, Thứ 2 đến Chủ nhật.",
    classSize:
      "Mỗi lớp tại Đăng Lưu có tối đa 10 học viên để giáo viên theo sát và tăng thời gian tương tác.",
    contact:
      "Phụ huynh có thể gọi 0978 328 610 hoặc liên hệ Zalo cùng số này để được tư vấn nhanh.",
    fallback:
      "Mình chưa hiểu rõ câu hỏi này. Phụ huynh có thể chọn một gợi ý bên dưới hoặc liên hệ Zalo 0978 328 610 để tư vấn viên hỗ trợ chi tiết nhé.",
  };

  const assistantQuestionLabels = {
    opening: "Lịch khai giảng",
    courses: "Chương trình học",
    trial: "Học phí và học thử",
    address: "Địa chỉ trung tâm",
  };

  function addAssistantMessage(message, sender) {
    if (!assistantMessages) {
      return;
    }

    const messageElement = document.createElement("div");
    messageElement.className = `floating-ai-message floating-ai-message-${sender}`;
    messageElement.textContent = message;
    assistantMessages.appendChild(messageElement);
    assistantMessages.scrollTop = assistantMessages.scrollHeight;
  }

  function findAssistantAnswer(question) {
    const normalizedQuestion = question
      .toLocaleLowerCase("vi-VN")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");

    if (/khai giang|khoa moi|bao gio hoc/.test(normalizedQuestion)) {
      return assistantAnswers.opening;
    }

    if (/chuong trinh|khoa hoc|cambridge|ielts|starters|movers/.test(normalizedQuestion)) {
      return assistantAnswers.courses;
    }

    if (/hoc phi|hoc thu|bao nhieu tien|chi phi/.test(normalizedQuestion)) {
      return assistantAnswers.trial;
    }

    if (/dia chi|o dau|duong nao/.test(normalizedQuestion)) {
      return assistantAnswers.address;
    }

    if (/si so|bao nhieu hoc vien|may hoc vien/.test(normalizedQuestion)) {
      return assistantAnswers.classSize;
    }

    if (/lien he|so dien thoai|zalo|goi/.test(normalizedQuestion)) {
      return assistantAnswers.contact;
    }

    return assistantAnswers.fallback;
  }

  function answerAssistantQuestion(question, answer) {
    addAssistantMessage(question, "user");

    window.setTimeout(() => {
      addAssistantMessage(answer, "bot");
    }, 280);
  }

  assistantSuggestions.forEach((suggestion) => {
    suggestion.addEventListener("click", () => {
      const questionKey = suggestion.dataset.assistantQuestion;
      const questionLabel = assistantQuestionLabels[questionKey];
      const answer = assistantAnswers[questionKey];

      if (questionLabel && answer) {
        answerAssistantQuestion(questionLabel, answer);
      }
    });
  });

  assistantForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const question = assistantInput?.value.trim() || "";

    if (!question) {
      assistantInput?.focus();
      return;
    }

    answerAssistantQuestion(question, findAssistantAnswer(question));
    assistantForm.reset();
    assistantInput?.focus();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (isContactChoiceOpen()) {
      closeContactChoice();
      return;
    }

    if (isAssistantOpen()) {
      closeAssistant();
    }
  });
});
