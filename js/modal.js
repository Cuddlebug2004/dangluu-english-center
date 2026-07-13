//modal.js
/**
 * Hiển thị modal đăng ký thành công
 * @param {string} id
 * @param {string} time
 */
function showSuccessModal(id, time) {
  const modal = document.getElementById("successModal");

  document.getElementById("registerID").textContent = id;
  document.getElementById("registerTime").textContent = time;

  modal.classList.add("show");
}

/**
 * Đóng modal
 */
function closeSuccessModal() {
  document.getElementById("successModal").classList.remove("show");
}


