//validator.js
/**
 * Kiểm tra họ tên
 */
function validateFullname(name) {
  return name.trim().length > 0;
}

/**
 * Kiểm tra số điện thoại Việt Nam
 */
function validatePhone(phone) {
  return /^(0|\+84)[0-9]{9}$/.test(phone.trim());
}

/**
 * Email không bắt buộc
 */
function validateEmail(email) {
  if (email.trim() === "") return true;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
