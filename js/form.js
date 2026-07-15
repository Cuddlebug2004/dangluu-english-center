// ===============================
// REGISTER FORM
// ===============================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
  const fullnameInput = document.getElementById("fullname");
  const phoneInput = document.getElementById("phone");
  const emailInput = document.getElementById("email");
  const courseInput = document.getElementById("course");
  const messageInput = document.getElementById("message");
  const submitButton = registerForm.querySelector(".submit-btn");

  registerForm.addEventListener("submit", handleRegisterSubmit);

  async function handleRegisterSubmit(event) {
    event.preventDefault();

    clearErrors();

    const isFullnameValid = validateFullname(fullnameInput.value);
    const isPhoneValid = validatePhone(phoneInput.value);
    const isEmailValid = validateEmail(emailInput.value);
    const isCourseValid = courseInput.value.trim() !== "";

    if (!isFullnameValid) {
      showError(fullnameInput, "Vui lòng nhập họ và tên phụ huynh.");
    } else {
      showValid(fullnameInput);
    }

    if (!isPhoneValid) {
      showError(phoneInput, "Số điện thoại không hợp lệ. Ví dụ: 0965272724.");
    } else {
      showValid(phoneInput);
    }

    if (!isEmailValid) {
      showError(emailInput, "Email không đúng định dạng.");
    } else if (emailInput.value.trim() !== "") {
      showValid(emailInput);
    }

    if (!isCourseValid) {
      showError(courseInput, "Vui lòng chọn chương trình quan tâm.");
    } else {
      showValid(courseInput);
    }

    const isFormValid =
      isFullnameValid && isPhoneValid && isEmailValid && isCourseValid;

    if (!isFormValid) {
      const firstInvalidField = registerForm.querySelector(".is-invalid");

      if (firstInvalidField) {
        firstInvalidField.focus();
      }

      return;
    }

    const formData = {
      parent: fullnameInput.value.trim(),
      phone: phoneInput.value.trim(),
      email: emailInput.value.trim(),
      course: courseInput.value,
      message: messageInput.value.trim(),
    };

    setSubmittingState(true);

    try {
      const result = await registerStudent(formData);

      if (result.result !== "success") {
        throw new Error(result.message || "Không thể gửi dữ liệu đăng ký.");
      }

      registerForm.reset();
      clearErrors();

      showSuccessModal(
        result.id || "Đang cập nhật",
        result.time || formData.registerTime,
      );
    } catch (error) {
      console.error("Register form error:", error);

      alert(
        "Không thể gửi đăng ký lúc này. Vui lòng thử lại hoặc liên hệ trực tiếp qua số 0965 2727 24.",
      );
    } finally {
      setSubmittingState(false);
    }
  }

  function showError(input, message) {
    const formGroup = input.closest(".form-group");
    const errorElement = formGroup?.querySelector(".form-error");

    input.classList.add("is-invalid");
    input.classList.remove("is-valid");
    input.setAttribute("aria-invalid", "true");

    if (errorElement) {
      errorElement.textContent = message;
    }
  }

  function showValid(input) {
    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
    input.removeAttribute("aria-invalid");
  }

  function clearErrors() {
    registerForm.querySelectorAll(".form-error").forEach((errorElement) => {
      errorElement.textContent = "";
    });

    registerForm.querySelectorAll(".is-invalid, .is-valid").forEach((input) => {
      input.classList.remove("is-invalid", "is-valid");
      input.removeAttribute("aria-invalid");
    });
  }

  function setSubmittingState(isSubmitting) {
    submitButton.disabled = isSubmitting;
    submitButton.textContent = isSubmitting ? "ĐANG GỬI..." : "ĐĂNG KÝ HỌC THỬ";
  }
}
