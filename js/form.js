// ===============================
// REGISTER FORM
// ===============================

const form = document.getElementById("registerForm");

const fullname = document.getElementById("fullname");
const phone = document.getElementById("phone");
const email = document.getElementById("email");
const course = document.getElementById("course");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  let isValid = true;

  clearErrors();

  // Họ tên
  if (fullname.value.trim() === "") {
    showError(fullname, "Vui lòng nhập họ và tên.");
    isValid = false;
  }

  // Số điện thoại
  const phoneRegex = /^(0|\+84)[0-9]{9}$/;

  if (!phoneRegex.test(phone.value.trim())) {
    showError(phone, "Số điện thoại không hợp lệ.");
    isValid = false;
  }

  // Email
  const emailValue = email.value.trim();

  if (emailValue !== "" && !emailRegex.test(emailValue)) {
    showError(email, "Email không hợp lệ.");

    isValid = false;
  }

  // Khóa học
  if (course.value === "") {
    showError(course, "Vui lòng chọn khóa học.");
    isValid = false;
  }

  if (isValid) {
    const btn = document.querySelector(".submit-btn");

    btn.disabled = true;

    btn.innerHTML = "Đang gửi...";

    const data = {
      parent: fullname.value.trim(),

      student: student.value.trim(),

      age: age.value,

      phone: phone.value.trim(),

      course: course.value,

      email: email.value.trim(),

      note: message.value.trim(),
    };
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((data) => {
        document.getElementById("registerID").textContent = data.id;

        document.getElementById("successModal").classList.add("show");

        form.reset();
      })
      .catch(() => {
        alert("Có lỗi xảy ra.");
      })
      .finally(() => {
        btn.disabled = false;
        btn.innerHTML = "Gửi đăng ký";
      });
  }
});

function showError(input, message) {
  const small = input.parentElement.querySelector("small");

  small.innerText = message;

  input.style.borderColor = "red";
}

function clearErrors() {
  document.querySelectorAll(".form-group small").forEach((small) => {
    small.innerText = "";
  });

  document
    .querySelectorAll(".form-group input, .form-group select")
    .forEach((input) => {
      input.style.borderColor = "#ddd";
    });
}
document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("successModal").classList.remove("show");
});
