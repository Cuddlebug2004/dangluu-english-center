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
    console.warn("Không tìm thấy nút hoặc danh sách mobile menu.");
    return;
  }

  const icon = menuButton.querySelector("i");

  // Tạo lớp nền tối phía sau menu.
  const overlay = document.createElement("div");

  overlay.className = "menu-overlay";
  overlay.setAttribute("aria-hidden", "true");

  document.body.appendChild(overlay);

  /**
   * Kiểm tra menu đang mở hay không.
   */
  function isMenuOpen() {
    return menu.classList.contains("active");
  }

  /**
   * Cập nhật icon và thuộc tính accessibility.
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
   * Mở mobile menu.
   */
  function openMenu() {
    menu.classList.add("active");
    overlay.classList.add("show");
    document.body.classList.add("menu-open");

    updateMenuButtonState(true);

    const firstLink = menu.querySelector("a");

    window.requestAnimationFrame(() => {
      firstLink?.focus();
    });
  }

  /**
   * Đóng mobile menu.
   */
  function closeMenu({ restoreFocus = false } = {}) {
    menu.classList.remove("active");
    overlay.classList.remove("show");
    document.body.classList.remove("menu-open");

    updateMenuButtonState(false);

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
   * Cuộn đến section và trừ chiều cao Header.
   */
  function scrollToSection(targetElement) {
    const headerHeight = header?.offsetHeight || 0;

    const targetPosition =
      targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;

    window.scrollTo({
      top: Math.max(targetPosition, 0),
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

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");

      if (!href || !href.startsWith("#")) {
        closeMenu();
        return;
      }

      const targetElement = document.querySelector(href);

      if (!targetElement) {
        return;
      }

      event.preventDefault();

      setActiveLink(link);
      closeMenu();

      scrollToSection(targetElement);

      // Cập nhật hash mà không làm trình duyệt nhảy vị trí.
      window.history.replaceState(null, "", href);
    });
  });

  // Đóng menu bằng phím Escape.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isMenuOpen()) {
      closeMenu({
        restoreFocus: true,
      });
    }
  });

  // Giữ focus bên trong menu khi menu đang mở.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || !isMenuOpen()) {
      return;
    }

    const focusableElements = [
      menuButton,
      ...menu.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ];

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  });

  // Reset menu khi chuyển từ mobile lên desktop.
  window.addEventListener("resize", () => {
    if (window.innerWidth > BREAKPOINT && isMenuOpen()) {
      closeMenu();
    }
  });

  /**
   * Scroll Spy bằng IntersectionObserver.
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
