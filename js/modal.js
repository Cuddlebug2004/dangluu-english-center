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

// Dùng 1 hàm duy nhất để bắt cả sự kiện bấm ra ngoài VÀ bấm nút Đóng
window.addEventListener("click", (e) => {
  const modal = document.getElementById("successModal");
  
  // Nếu người dùng click vào vùng tối (modal) HOẶC click trúng cái nút có id="closeModal"
  if (e.target === modal || e.target.id === "closeModal") {
    closeSuccessModal();
  }
});
