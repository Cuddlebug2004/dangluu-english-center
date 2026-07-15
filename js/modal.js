// ===============================
// SUCCESS MODAL
// ===============================

/**
 * Lấy phần tử modal đăng ký thành công.
 *
 * @returns {HTMLElement|null}
 */
function getSuccessModal() {
  return document.getElementById("successModal");
}

/**
 * Hiển thị modal đăng ký thành công.
 *
 * @param {string} id Mã đăng ký
 * @param {string} time Thời gian đăng ký
 */
function showSuccessModal(id, time) {
  const modal = getSuccessModal();
  const idElement = document.getElementById("registerID");
  const timeElement = document.getElementById("registerTime");
  const closeButton = document.getElementById("closeModal");

  if (!modal) {
    console.error('Không tìm thấy phần tử có id="successModal".');
    return;
  }

  if (idElement) {
    idElement.textContent = id || "Đang cập nhật";
  }

  if (timeElement) {
    timeElement.textContent = time || "Đang cập nhật";
  }

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-open");

  // Đưa focus vào nút đóng để hỗ trợ bàn phím.
  requestAnimationFrame(() => {
    closeButton?.focus();
  });
}

/**
 * Đóng modal đăng ký thành công.
 */
function closeSuccessModal() {
  const modal = getSuccessModal();

  if (!modal) {
    return;
  }

  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");

  document.body.classList.remove("modal-open");
}

/**
 * Gắn các sự kiện đóng modal.
 */
function initializeSuccessModal() {
  const modal = getSuccessModal();
  const closeButton = document.getElementById("closeModal");

  if (!modal) {
    console.error('Không tìm thấy phần tử có id="successModal".');
    return;
  }

  // Tránh gắn sự kiện nhiều lần.
  if (modal.dataset.initialized === "true") {
    return;
  }

  modal.dataset.initialized = "true";

  // Bấm nút Đóng.
  closeButton?.addEventListener("click", closeSuccessModal);

  // Bấm vào vùng nền tối bên ngoài hộp nội dung.
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeSuccessModal();
    }
  });

  // Nhấn phím Escape.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("show")) {
      closeSuccessModal();
    }
  });
}

// Bảo đảm HTML đã được tạo trước khi gắn sự kiện.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeSuccessModal);
} else {
  initializeSuccessModal();
}
