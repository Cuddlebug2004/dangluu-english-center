// ======================================
// REGISTER FORM MODAL
// ======================================

document.addEventListener("DOMContentLoaded", () => {
  const openButtons = document.querySelectorAll("[data-open-register-modal]");

  const formCard = document.getElementById("registerFormCard");
  const overlay = document.getElementById("registerModalOverlay");

  const closeButton = document.getElementById("registerModalClose");

  const successModal = document.getElementById("successModal");

  if (openButtons.length === 0 || !formCard || !overlay || !closeButton) {
    return;
  }

  let savedScrollPosition = 0;
  let lastFocusedElement = null;

  function scrollImmediatelyTo(position) {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;

    root.style.scrollBehavior = "auto";

    window.scrollTo(0, position);

    root.style.scrollBehavior = previousBehavior;
  }

  function isModalOpen() {
    return formCard.classList.contains("register-modal-open");
  }

  function lockPageScroll() {
    savedScrollPosition = window.scrollY;

    document.documentElement.classList.add("register-modal-active");

    document.body.classList.add("register-modal-active");

    document.body.style.top = `-${savedScrollPosition}px`;
  }

  function unlockPageScroll() {
    document.documentElement.classList.remove("register-modal-active");

    document.body.classList.remove("register-modal-active");

    document.body.style.removeProperty("top");

    scrollImmediatelyTo(savedScrollPosition);
  }

  function openRegisterModal(event) {
    event?.preventDefault();

    if (isModalOpen()) {
      return;
    }

    lastFocusedElement = document.activeElement;

    lockPageScroll();

    formCard.classList.add("register-modal-open");
    overlay.classList.add("show");

    overlay.setAttribute("aria-hidden", "false");

    formCard.setAttribute("role", "dialog");
    formCard.setAttribute("aria-modal", "true");
    formCard.setAttribute("aria-labelledby", "registerModalTitle");

    window.requestAnimationFrame(() => {
      const firstInput = formCard.querySelector("input, select, textarea");

      firstInput?.focus();
    });
  }

  function closeRegisterModal({ restoreFocus = true } = {}) {
    if (!isModalOpen()) {
      return;
    }

    formCard.classList.remove("register-modal-open");
    overlay.classList.remove("show");

    overlay.setAttribute("aria-hidden", "true");

    formCard.removeAttribute("role");
    formCard.removeAttribute("aria-modal");
    formCard.removeAttribute("aria-labelledby");

    unlockPageScroll();

    if (restoreFocus && lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
  }

  openButtons.forEach((button) => {
    button.addEventListener("click", openRegisterModal);
  });

  closeButton.addEventListener("click", () => {
    closeRegisterModal();
  });

  overlay.addEventListener("click", () => {
    closeRegisterModal();
  });

  overlay.addEventListener(
    "touchmove",
    (event) => {
      event.preventDefault();
    },
    {
      passive: false,
    },
  );

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isModalOpen()) {
      closeRegisterModal();
    }
  });

  /*
   * Khi modal đăng ký thành công xuất hiện,
   * tự đóng form đăng ký phía sau.
   */
  if (successModal) {
    const successObserver = new MutationObserver(() => {
      if (successModal.classList.contains("show") && isModalOpen()) {
        closeRegisterModal({
          restoreFocus: false,
        });
      }
    });

    successObserver.observe(successModal, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  window.openRegisterModal = openRegisterModal;
  window.closeRegisterModal = closeRegisterModal;
});
