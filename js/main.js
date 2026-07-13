//main.js
window.addEventListener("scroll", () => {
  const nav = document.querySelector(".navbar");

  if (window.scrollY > 20) {
    nav.style.height = "72px";

    nav.style.backdropFilter = "blur(18px)";

    nav.style.boxShadow = "0 8px 30px rgba(0,0,0,.08)";
  } else {
    nav.style.height = "82px";

    nav.style.boxShadow = "none";
  }
});
//==============================
// BACK TO TOP
//==============================

const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  if (window.scrollY > 500) {
    backToTop.classList.add("show");
  } else {
    backToTop.classList.remove("show");
  }
});

backToTop.addEventListener("click", () => {
  window.scrollTo({
    top: 0,

    behavior: "smooth",
  });
});

//==============================
// HEADER
//==============================

const header = document.querySelector(".header");

window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});
