/**
 * Kiểm tra họ tên
 */
function validateFullname(name) {
  const normalized = String(name ?? "").trim();
  return normalized.length >= 2 && normalized.length <= 120;
}

/**
 * Kiểm tra tuổi học viên
 */
function validateStudentAge(age) {
  const parsedAge = Number.parseInt(String(age ?? ""), 10);
  return Number.isInteger(parsedAge) && parsedAge >= 3 && parsedAge <= 25;
}

/**
 * Kiểm tra số điện thoại Việt Nam.
 * Cho phép khoảng trắng, dấu chấm, dấu gạch và đầu +84.
 */
function validatePhone(phone) {
  let normalized = String(phone ?? "")
    .trim()
    .replace(/[\s().-]/g, "");

  if (normalized.startsWith("+84")) {
    normalized = `0${normalized.slice(3)}`;
  }

  return /^0[0-9]{9}$/.test(normalized);
}

/**
 * Email không bắt buộc
 */
function validateEmail(email) {
  if (String(email ?? "").trim() === "") return true;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}
