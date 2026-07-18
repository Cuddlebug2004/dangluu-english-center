/**
 * Gửi thông tin đăng ký tới Vercel Function cùng tên miền.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
async function registerStudent(data) {
  const endpoint =
    typeof API_URL === "string" && API_URL.trim()
      ? API_URL
      : "/api/register";

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15000);

  let response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Hệ thống phản hồi quá lâu. Vui lòng thử lại.");
    }

    throw new Error(
      "Không thể kết nối tới hệ thống đăng ký. Vui lòng kiểm tra mạng.",
    );
  } finally {
    window.clearTimeout(timeoutId);
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
