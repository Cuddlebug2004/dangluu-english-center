/**
 * Gửi thông tin đăng ký tới Google Apps Script.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
async function registerStudent(data) {
  let response;

  try {
    response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(data),
      redirect: "follow",
    });
  } catch (error) {
    throw new Error(
      "Không thể kết nối tới hệ thống đăng ký. Vui lòng kiểm tra mạng.",
    );
  }

  const responseText = await response.text();

  let result;

  try {
    result = JSON.parse(responseText);
  } catch (error) {
    console.error("Invalid API response:", responseText);

    throw new Error("Máy chủ trả về dữ liệu không hợp lệ.");
  }

  if (!response.ok) {
    throw new Error(
      result.message || `Máy chủ phản hồi lỗi HTTP ${response.status}.`,
    );
  }

  return result;
}
