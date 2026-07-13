//form.js
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearErrors();

    let valid = true;

    // Họ tên
    if (!validateFullname(fullname.value)) {
      showError(fullname, "Vui lòng nhập họ và tên.");
      valid = false;
    }

    // Điện thoại
    if (!validatePhone(phone.value)) {
      showError(phone, "Số điện thoại không hợp lệ.");
      valid = false;
    }

    // Email (không bắt buộc)
    if (!validateEmail(email.value)) {
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
      const result = await registerStudent(data);

      if (result.result !== "success") {
        throw new Error(result.message || "Không thể gửi dữ liệu.");
      }
      showSuccessModal(result.id, result.time);

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
