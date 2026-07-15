// ===============================
// MOBILE MENU & NAVIGATION
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  const BREAKPOINT = 992;

  const menuButton = document.getElementById("mobile-menu");
  const menu = document.getElementById("primary-menu");
  const header = document.querySelector(".header");

  const navLinks = Array.from(document.querySelectorAll(".nav-link"));

  if (!menuButton || !menu) {
    console.warn("Không tìm thấy mobile menu.");
    return;
  }

  const icon = menuButton.querySelector("i");

  const overlay = document.createElement("div");

  overlay.className = "menu-overlay";
  overlay.setAttribute("aria-hidden", "true");

  document.body.appendChild(overlay);

  let savedScrollPosition = 0;

  /**
   * Kiểm tra menu đang mở.
   */
  function isMenuOpen() {
    return menu.classList.contains("active");
  }

  /**
   * Khóa trang tại đúng vị trí cuộn hiện tại.
   */
  function lockPageScroll() {
    savedScrollPosition = window.scrollY;

    document.documentElement.classList.add("menu-open");
    document.body.classList.add("menu-open");

    document.body.style.top = `-${savedScrollPosition}px`;
  }

  /**
   * Mở khóa trang và trả lại đúng vị trí cuộn.
   */
  function unlockPageScroll() {
    document.documentElement.classList.remove("menu-open");
    document.body.classList.remove("menu-open");

    document.body.style.removeProperty("top");

    window.scrollTo({
      top: savedScrollPosition,
      left: 0,
      behavior: "auto",
    });
  }

  /**
   * Cập nhật nút hamburger.
   */
  function updateMenuButtonState(isOpen) {
    menuButton.setAttribute("aria-expanded", String(isOpen));

    menuButton.setAttribute(
      "aria-label",
      isOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng",
    );

    if (!icon) {
      return;
    }

    icon.classList.toggle("fa-bars", !isOpen);
    icon.classList.toggle("fa-xmark", isOpen);
  }

  /**
   * Mở menu.
   */
  function openMenu() {
    if (isMenuOpen()) {
      return;
    }

    lockPageScroll();

    menu.classList.add("active");
    overlay.classList.add("show");

    overlay.setAttribute("aria-hidden", "false");

    updateMenuButtonState(true);
  }

  /**
   * Đóng menu.
   */
  function closeMenu({ restoreFocus = false } = {}) {
    if (!isMenuOpen()) {
      return;
    }

    menu.classList.remove("active");
    overlay.classList.remove("show");

    overlay.setAttribute("aria-hidden", "true");

    updateMenuButtonState(false);
    unlockPageScroll();

    if (restoreFocus) {
      menuButton.focus();
    }
  }

  /**
   * Mở hoặc đóng menu.
   */
  function toggleMenu() {
    if (isMenuOpen()) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  /**
   * Cuộn tới section và trừ chiều cao header.
   */
  function scrollToSection(targetElement) {
    const headerHeight = header?.offsetHeight || 0;

    const targetPosition =
      targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;

    window.scrollTo({
      top: Math.max(targetPosition, 0),
      left: 0,
      behavior: "smooth",
    });
  }

  /**
   * Cập nhật link active.
   */
  function setActiveLink(activeLink) {
    navLinks.forEach((link) => {
      const isActive = link === activeLink;

      link.classList.toggle("active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  menuButton.addEventListener("click", toggleMenu);

  overlay.addEventListener("click", () => {
    closeMenu({
      restoreFocus: true,
    });
  });

  /*
   * Chặn thao tác kéo trên overlay.
   * passive: false là bắt buộc để preventDefault hoạt động.
   */
  overlay.addEventListener(
    "touchmove",
    (event) => {
      event.preventDefault();
    },
    {
      passive: false,
    },
  );

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");

      if (!href || !href.startsWith("#")) {
        closeMenu();
        return;
      }

      const targetElement = document.querySelector(href);

      if (!targetElement) {
        closeMenu();
        return;
      }

      event.preventDefault();

      setActiveLink(link);
      closeMenu();

      window.requestAnimationFrame(() => {
        scrollToSection(targetElement);
      });

      window.history.replaceState(null, "", href);
    });
  });

  /**
   * Đóng bằng phím Escape.
   */
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isMenuOpen()) {
      closeMenu({
        restoreFocus: true,
      });
    }
  });

  /**
   * Reset khi đổi từ mobile lên desktop.
   */
  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth > BREAKPOINT && isMenuOpen()) {
        closeMenu();
      }
    },
    {
      passive: true,
    },
  );

  /**
   * Scroll Spy.
   */
  const observedSections = navLinks
    .map((link) => {
      const href = link.getAttribute("href");

      if (!href || !href.startsWith("#")) {
        return null;
      }

      return document.querySelector(href);
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              second.intersectionRatio - first.intersectionRatio,
          );

        if (visibleSections.length === 0) {
          return;
        }

        const sectionId = visibleSections[0].target.id;

        const matchingLink = navLinks.find(
          (link) => link.getAttribute("href") === `#${sectionId}`,
        );

        if (matchingLink) {
          setActiveLink(matchingLink);
        }
      },
      {
        root: null,
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0, 0.1, 0.25, 0.5],
      },
    );

    observedSections.forEach((section) => {
      sectionObserver.observe(section);
    });
  }

  updateMenuButtonState(false);
});
