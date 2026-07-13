/**modal.js
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

const modal = document.getElementById("successModal");

if (modal) {
  // Chỉ lắng nghe click trên chính cái modal
  modal.addEventListener("click", (e) => {
    // Chỉ đóng nếu click trúng vùng tối (modal)
    // HOẶC click trúng cái nút có id="closeModal"
    if (e.target === modal || e.target.id === "closeModal") {
      closeSuccessModal();
    }
  });
}
