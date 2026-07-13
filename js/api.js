/**
 * api.js
 * Gửi thông tin đăng ký tới Google Apps Script
 * @param {Object} data
 * @returns {Promise<Object>}
 */
async function registerStudent(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8", // Lưu ý: Google Apps Script thường nhận text/plain tốt hơn để tránh lỗi CORS
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `HTTP ${response.status}`);
  }

  return result;
}
