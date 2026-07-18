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

// ===============================
// HERO IMAGE SLIDER
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  const slider = document.querySelector("[data-hero-slider]");

  if (!slider) {
    return;
  }

  const slides = Array.from(slider.querySelectorAll(".hero-slide"));
  const dots = Array.from(slider.querySelectorAll("[data-slide-to]"));
  const previousButton = slider.querySelector(".hero-slider-prev");
  const nextButton = slider.querySelector(".hero-slider-next");

  if (slides.length < 2) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let currentIndex = 0;
  let autoplayTimer = null;
  let pointerStartX = null;

  function showSlide(nextIndex) {
    currentIndex = (nextIndex + slides.length) % slides.length;

    slides.forEach((slide, index) => {
      const isActive = index === currentIndex;
      slide.classList.toggle("active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    dots.forEach((dot, index) => {
      const isActive = index === currentIndex;
      dot.classList.toggle("active", isActive);
      dot.setAttribute("aria-selected", String(isActive));
    });
  }

  function stopAutoplay() {
    if (autoplayTimer !== null) {
      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function startAutoplay() {
    stopAutoplay();

    if (reduceMotion.matches || document.hidden) {
      return;
    }

    autoplayTimer = window.setInterval(() => {
      showSlide(currentIndex + 1);
    }, 5200);
  }

  previousButton?.addEventListener("click", () => {
    showSlide(currentIndex - 1);
    startAutoplay();
  });

  nextButton?.addEventListener("click", () => {
    showSlide(currentIndex + 1);
    startAutoplay();
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const targetIndex = Number(dot.dataset.slideTo);

      if (Number.isInteger(targetIndex)) {
        showSlide(targetIndex);
        startAutoplay();
      }
    });
  });

  slider.addEventListener("mouseenter", stopAutoplay);
  slider.addEventListener("mouseleave", startAutoplay);
  slider.addEventListener("focusin", stopAutoplay);
  slider.addEventListener("focusout", startAutoplay);

  slider.addEventListener(
    "pointerdown",
    (event) => {
      pointerStartX = event.clientX;
    },
    { passive: true },
  );

  slider.addEventListener(
    "pointerup",
    (event) => {
      if (pointerStartX === null) {
        return;
      }

      const distance = event.clientX - pointerStartX;
      pointerStartX = null;

      if (Math.abs(distance) < 45) {
        return;
      }

      showSlide(distance > 0 ? currentIndex - 1 : currentIndex + 1);
      startAutoplay();
    },
    { passive: true },
  );

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });

  reduceMotion.addEventListener?.("change", startAutoplay);

  showSlide(0);
  startAutoplay();
});
