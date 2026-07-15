// ===============================
// MAIN
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".header");
  const backToTopButton = document.getElementById("backToTop");

  let scrollTicking = false;

  /**
   * Cập nhật giao diện dựa trên vị trí cuộn.
   */
  function updateScrollUI() {
    const scrollPosition = window.scrollY;

    if (header) {
      header.classList.toggle("scrolled", scrollPosition > 50);
    }

    if (backToTopButton) {
      backToTopButton.classList.toggle("show", scrollPosition > 500);
    }

    scrollTicking = false;
  }

  /**
   * Giới hạn số lần xử lý trong lúc cuộn.
   */
  function handleScroll() {
    if (scrollTicking) {
      return;
    }

    scrollTicking = true;

    window.requestAnimationFrame(updateScrollUI);
  }

  window.addEventListener("scroll", handleScroll, {
    passive: true,
  });

  if (backToTopButton) {
    backToTopButton.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  // Thiết lập đúng trạng thái ngay khi tải trang.
  updateScrollUI();
});
