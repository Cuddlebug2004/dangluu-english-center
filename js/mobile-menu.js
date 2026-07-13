// ===============================
// MOBILE MENU & SMOOTH SCROLLING
// ===============================

const mobileMenuBtn = document.getElementById("mobile-menu");
const menu = document.querySelector(".menu");
const navLinks = document.querySelectorAll(".nav-link");

// 1. Mở/Đóng Menu trên Mobile
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener("click", () => {
    menu.classList.toggle("active");

    // Đổi Icon Hamburger <-> X
    const icon = mobileMenuBtn.querySelector("i");
    if (menu.classList.contains("active")) {
      icon.classList.replace("fa-bars", "fa-xmark");
    } else {
      icon.classList.replace("fa-xmark", "fa-bars");
    }
  });
}

// 2. Click vào link -> Đóng menu & Cuộn mượt
navLinks.forEach((link) => {
  link.addEventListener("click", function (e) {
    // Trên điện thoại, đóng menu lại
    menu.classList.remove("active");
    if (mobileMenuBtn) {
      mobileMenuBtn.querySelector("i").classList.replace("fa-xmark", "fa-bars");
    }

    // Tự động cuộn đến phần mong muốn (Smooth Scroll)
    e.preventDefault();
    const targetId = this.getAttribute("href").substring(1);
    const targetSection = document.getElementById(targetId);

    if (targetSection) {
      // Cuộn xuống và trừ hao chiều cao của header (72px) để không bị che khuất tiêu đề
      const headerOffset = 72;
      const elementPosition = targetSection.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  });
});

// 3. Scroll Spy: Tự động đổi màu menu khi cuộn trang
const sections = document.querySelectorAll("section[id]");

window.addEventListener("scroll", () => {
  let scrollY = window.pageYOffset;

  sections.forEach((current) => {
    const sectionHeight = current.offsetHeight;
    // Trừ hao thêm 100px để hiệu ứng chuyển sớm hơn một chút khi người dùng cuộn
    const sectionTop = current.offsetTop - 100;
    const sectionId = current.getAttribute("id");
    const currentMenuLink = document.querySelector(
      `.menu a[href*="#${sectionId}"]`,
    );

    if (currentMenuLink) {
      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        currentMenuLink.classList.add("active");
      } else {
        currentMenuLink.classList.remove("active");
      }
    }
  });
});
