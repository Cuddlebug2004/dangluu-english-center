/**
 * Gửi thông tin đăng ký tới Google Apps Script
 * @param {Object} data
 * @returns {Promise<Object>}
 */
async function registerStudent(data) {
  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.json();
}
