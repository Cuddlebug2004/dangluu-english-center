/**
 * Hiển thị modal đăng ký thành công
 * @param {string} id
 * @param {string} time
 */
function showSuccessModal(id, time) {
  const modal = document.getElementById("successModal");
  const idElement = document.getElementById("registerID");
  const timeElement = document.getElementById("registerTime");

  // Đổ dữ liệu vào HTML (nếu có thẻ)
  if (idElement) idElement.textContent = id;
  if (timeElement) timeElement.textContent = time;

  // Hiển thị modal
  if (modal) {
    modal.classList.add("show");
  }
}

/**
 * Hàm đóng modal
 */
function closeSuccessModal() {
  const modal = document.getElementById("successModal");
  if (modal) {
    modal.classList.remove("show");
  }
}

// ===============================
// XỬ LÝ SỰ KIỆN ĐÓNG MODAL
// ===============================

// 1. Đóng khi bấm nút "Đóng"
const closeModalBtn = document.getElementById("closeModal");
if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeSuccessModal);
}

// 2. Nâng cao: Đóng khi click chuột ra vùng tối xung quanh (backdrop)
window.addEventListener("click", (e) => {
  const modal = document.getElementById("successModal");
  if (e.target === modal) {
    closeSuccessModal();
  }
});
