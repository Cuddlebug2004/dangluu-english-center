// ===============================
// REGISTER FORM
// ===============================

const form = document.getElementById("registerForm");

if (form) {
  const fullname = document.getElementById("fullname");
  const phone = document.getElementById("phone");
  const email = document.getElementById("email");
  const course = document.getElementById("course");

  const submitBtn = form.querySelector(".submit-btn");

  const phoneRegex = /^(0|\+84)[0-9]{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearErrors();

    let valid = true;

    // Họ tên
    if (fullname.value.trim() === "") {
      showError(fullname, "Vui lòng nhập họ và tên.");
      valid = false;
    }

    // Điện thoại
    if (!phoneRegex.test(phone.value.trim())) {
      showError(phone, "Số điện thoại không hợp lệ.");
      valid = false;
    }

    // Email (không bắt buộc)
    if (email.value.trim() !== "" && !emailRegex.test(email.value.trim())) {
      showError(email, "Email không hợp lệ.");
      valid = false;
    }

    // Khóa học
    if (course.value === "") {
      showError(course, "Vui lòng chọn khóa học.");
      valid = false;
    }

    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Đang gửi...";

    const data = {
      parent: fullname.value.trim(),
      phone: phone.value.trim(),
      email: email.value.trim(),
      course: course.value,
      registerTime: new Date().toLocaleString("vi-VN"),
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Không thể gửi dữ liệu.");
      }

      const result = await response.json();

      const registerID = document.getElementById("registerID");
      const registerTime = document.getElementById("registerTime");

      if (registerID) {
        registerID.textContent = result.id || "#" + Date.now();
      }

      if (registerTime) {
        registerTime.textContent = data.registerTime;
      }

      document.getElementById("successModal")?.classList.add("show");

      form.reset();
    } catch (error) {
      console.error(error);

      alert("Không thể gửi đăng ký. Vui lòng thử lại.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Gửi đăng ký";
    }
  });
}

function showError(input, message) {
  const small = input.parentElement.querySelector("small");

  if (small) {
    small.textContent = message;
  }

  input.style.borderColor = "#e53935";
}

function clearErrors() {
  document.querySelectorAll(".form-group small").forEach((small) => {
    small.textContent = "";
  });

  document
    .querySelectorAll(".form-group input, .form-group select")
    .forEach((input) => {
      input.style.borderColor = "#ddd";
    });
}

const closeModal = document.getElementById("closeModal");

if (closeModal) {
  closeModal.addEventListener("click", () => {
    document.getElementById("successModal")?.classList.remove("show");
  });
}
