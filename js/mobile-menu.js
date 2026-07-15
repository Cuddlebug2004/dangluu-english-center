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

  const menuIcon = menuButton.querySelector("i");

  /*
   * Chỉ tạo overlay nếu chưa tồn tại.
   * Việc này tránh sinh hai overlay nếu script bị gọi nhầm hai lần.
   */
  let overlay = document.querySelector(".menu-overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "menu-overlay";
    overlay.setAttribute("aria-hidden", "true");

    document.body.appendChild(overlay);
  }

  let savedScrollPosition = 0;

  function isMenuOpen() {
    return menu.classList.contains("active");
  }

  /**
   * Cuộn tức thời, không bị ảnh hưởng bởi:
   * html { scroll-behavior: smooth; }
   */
  function scrollImmediatelyTo(position) {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;

    root.style.scrollBehavior = "auto";

    window.scrollTo(0, position);

    root.style.scrollBehavior = previousScrollBehavior;
  }

  /**
   * Khóa trang tại đúng vị trí đang xem.
   */
  function lockPageScroll() {
    savedScrollPosition = window.scrollY;

    document.documentElement.classList.add("menu-open");
    document.body.classList.add("menu-open");

    document.body.style.top = `-${savedScrollPosition}px`;
  }

  /**
   * Mở khóa và trở về đúng vị trí trước khi mở menu.
   */
  function unlockPageScroll() {
    document.documentElement.classList.remove("menu-open");
    document.body.classList.remove("menu-open");

    document.body.style.removeProperty("top");

    scrollImmediatelyTo(savedScrollPosition);
  }

  function updateMenuButtonState(isOpen) {
    menuButton.setAttribute("aria-expanded", String(isOpen));

    menuButton.setAttribute(
      "aria-label",
      isOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng",
    );

    if (!menuIcon) {
      return;
    }

    menuIcon.classList.toggle("fa-bars", !isOpen);
    menuIcon.classList.toggle("fa-xmark", isOpen);
  }

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

  function toggleMenu() {
    if (isMenuOpen()) {
      closeMenu();
    } else {
      openMenu();
    }
  }

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
   * Không cho vuốt trang thông qua vùng overlay.
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

      /*
       * Phải tính vị trí đích trước khi gỡ position: fixed
       * khỏi body.
       */
      const headerHeight = header?.offsetHeight || 0;

      const currentDocumentScroll = isMenuOpen()
        ? savedScrollPosition
        : window.scrollY;

      const targetPosition = Math.max(
        targetElement.getBoundingClientRect().top +
          currentDocumentScroll -
          headerHeight,
        0,
      );

      setActiveLink(link);

      const menuWasOpen = isMenuOpen();

      if (menuWasOpen) {
        /*
         * closeMenu sẽ trả trang về vị trí cũ tức thời,
         * không dùng smooth.
         */
        closeMenu();
      }

      window.history.replaceState(null, "", href);

      /*
       * Chờ body được mở khóa hoàn toàn rồi mới cuộn đến section.
       * Dùng hai frame để tránh trình duyệt phục hồi vị trí cũ
       * và ghi đè lệnh cuộn mới.
       */
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          window.scrollTo({
            top: targetPosition,
            left: 0,
            behavior: "smooth",
          });
        });
      });
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isMenuOpen()) {
      closeMenu({
        restoreFocus: true,
      });
    }
  });

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

  /*
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
            (firstEntry, secondEntry) =>
              secondEntry.intersectionRatio - firstEntry.intersectionRatio,
          );

        if (visibleSections.length === 0) {
          return;
        }

        const visibleSectionId = visibleSections[0].target.id;

        const matchingLink = navLinks.find(
          (link) => link.getAttribute("href") === `#${visibleSectionId}`,
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
