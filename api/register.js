import { neon } from "@neondatabase/serverless";

const ALLOWED_COURSES = new Set([
  "Pre-Starters",
  "Cambridge Starters",
  "Cambridge Movers",
  "Cambridge Flyers",
  "Cambridge KET",
  "Cambridge PET",
  "IELTS",
]);

function cleanText(value, { maxLength, required = false, fieldName }) {
  const normalized = String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (required && !normalized) {
    throw new Error(`Vui lòng nhập ${fieldName}.`);
  }

  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} không được vượt quá ${maxLength} ký tự.`);
  }

  return normalized;
}

function normalizePhone(value) {
  let phone = String(value ?? "")
    .trim()
    .replace(/[\s().-]/g, "");

  if (phone.startsWith("+84")) {
    phone = `0${phone.slice(3)}`;
  } else if (phone.startsWith("84") && phone.length === 11) {
    phone = `0${phone.slice(2)}`;
  }

  if (!/^0\d{9}$/.test(phone)) {
    throw new Error("Số điện thoại không hợp lệ. Vui lòng nhập 10 số bắt đầu bằng 0.");
  }

  return phone;
}

function normalizeEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();

  if (!email) {
    return null;
  }

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Email không đúng định dạng.");
  }

  return email;
}

function formatVietnamTime(value) {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function parseBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  if (typeof request.body === "string" && request.body.trim()) {
    try {
      return JSON.parse(request.body);
    } catch {
      throw new Error("Dữ liệu gửi lên không hợp lệ.");
    }
  }

  return {};
}

function sendJson(response, status, payload) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  return response.status(status).json(payload);
}

export default async function handler(request, response) {
  if (request.method === "GET") {
    return sendJson(response, 200, {
      result: "ok",
      service: "website-registration",
    });
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    return sendJson(response, 405, {
      result: "error",
      message: "Phương thức không được hỗ trợ.",
    });
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing in Vercel Environment Variables.");
    return sendJson(response, 503, {
      result: "error",
      message: "Hệ thống đăng ký chưa được cấu hình. Vui lòng liên hệ trung tâm.",
    });
  }

  try {
    const body = parseBody(request);

    // Form hiển thị giữ nguyên: phụ huynh, điện thoại, email, chương trình, ghi chú.
    const parentName = cleanText(body.parent ?? body.fullname, {
      maxLength: 120,
      required: true,
      fieldName: "họ tên phụ huynh",
    });
    const phone = normalizePhone(body.phone);
    const email = normalizeEmail(body.email);
    const course = cleanText(body.course, {
      maxLength: 100,
      required: true,
      fieldName: "chương trình quan tâm",
    });
    const note = cleanText(body.note ?? body.message, {
      maxLength: 1000,
      required: false,
      fieldName: "ghi chú",
    });

    if (!ALLOWED_COURSES.has(course)) {
      throw new Error("Chương trình quan tâm không hợp lệ.");
    }

    const sql = neon(process.env.DATABASE_URL);

    // Chỉ chặn một lượt gửi giống hệt trong thời gian ngắn để tránh bấm hai lần.
    // Không chặn phụ huynh đăng ký cho nhiều học viên khác nhau trong cùng ngày.
    const duplicateRows = await sql`
      SELECT registration_code, submitted_at
      FROM website_registrations
      WHERE phone = ${phone}
        AND LOWER(parent_name) = LOWER(${parentName})
        AND course = ${course}
        AND COALESCE(LOWER(email), '') = COALESCE(LOWER(${email}), '')
        AND COALESCE(note, '') = ${note}
        AND submitted_at >= CURRENT_TIMESTAMP - INTERVAL '10 minutes'
      ORDER BY submitted_at DESC
      LIMIT 1
    `;

    if (duplicateRows.length > 0) {
      return sendJson(response, 200, {
        result: "success",
        duplicate: true,
        id: duplicateRows[0].registration_code,
        time: formatVietnamTime(duplicateRows[0].submitted_at),
        message: "Thông tin đã được ghi nhận trước đó.",
      });
    }

    const insertedRows = await sql`
      INSERT INTO website_registrations (
        parent_name,
        phone,
        email,
        course,
        note,
        source,
        status
      )
      VALUES (
        ${parentName},
        ${phone},
        ${email},
        ${course},
        ${note || null},
        'website',
        'new'
      )
      RETURNING registration_code, submitted_at
    `;

    return sendJson(response, 201, {
      result: "success",
      duplicate: false,
      id: insertedRows[0].registration_code,
      time: formatVietnamTime(insertedRows[0].submitted_at),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể lưu đăng ký.";

    console.error("Registration API error:", error);

    if (message.includes("website_registrations") || message.includes("does not exist")) {
      return sendJson(response, 503, {
        result: "error",
        message: "Hệ thống đăng ký đang được cập nhật. Vui lòng thử lại sau.",
      });
    }

    const validationMessages = [
      "Vui lòng",
      "không hợp lệ",
      "không đúng",
      "không được vượt",
      "Dữ liệu gửi lên",
    ];
    const isValidationError = validationMessages.some((text) => message.includes(text));

    return sendJson(response, isValidationError ? 400 : 500, {
      result: "error",
      message: isValidationError
        ? message
        : "Không thể lưu đăng ký lúc này. Vui lòng thử lại sau.",
    });
  }
}
