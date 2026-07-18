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

function jsonResponse(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

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

function normalizeAge(value) {
  const age = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isInteger(age) || age < 3 || age > 25) {
    throw new Error("Tuổi học viên phải từ 3 đến 25.");
  }

  return age;
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

async function parseBody(request) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("Yêu cầu phải sử dụng định dạng JSON.");
  }

  try {
    return await request.json();
  } catch {
    throw new Error("Dữ liệu gửi lên không hợp lệ.");
  }
}

export default {
  async fetch(request) {
    if (request.method === "GET") {
      return jsonResponse({
        result: "ok",
        service: "website-registration",
      });
    }

    if (request.method !== "POST") {
      return jsonResponse(
        {
          result: "error",
          message: "Phương thức không được hỗ trợ.",
        },
        405,
      );
    }

    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is missing in Vercel Environment Variables.");
      return jsonResponse(
        {
          result: "error",
          message: "Hệ thống đăng ký chưa được cấu hình. Vui lòng liên hệ trung tâm.",
        },
        503,
      );
    }

    try {
      const body = await parseBody(request);

      // Honeypot: bot thường tự điền trường ẩn này. Trả thành công giả để
      // không tiết lộ cơ chế chống spam, nhưng không ghi dữ liệu vào database.
      if (String(body.website ?? "").trim()) {
        return jsonResponse({
          result: "success",
          id: "DLE-RECEIVED",
          time: formatVietnamTime(new Date()),
        });
      }

      const parentName = cleanText(body.parent, {
        maxLength: 120,
        required: true,
        fieldName: "họ tên phụ huynh",
      });
      const studentName = cleanText(body.student, {
        maxLength: 120,
        required: true,
        fieldName: "họ tên học viên",
      }).toUpperCase();
      const studentAge = normalizeAge(body.age);
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

      const duplicateRows = await sql`
        SELECT registration_code, submitted_at
        FROM website_registrations
        WHERE phone = ${phone}
          AND LOWER(student_name) = LOWER(${studentName})
          AND course = ${course}
          AND submitted_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
        ORDER BY submitted_at DESC
        LIMIT 1
      `;

      if (duplicateRows.length > 0) {
        return jsonResponse({
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
          student_name,
          student_age,
          phone,
          email,
          course,
          note,
          source,
          status
        )
        VALUES (
          ${parentName},
          ${studentName},
          ${studentAge},
          ${phone},
          ${email},
          ${course},
          ${note || null},
          'website',
          'new'
        )
        RETURNING registration_code, submitted_at
      `;

      return jsonResponse(
        {
          result: "success",
          duplicate: false,
          id: insertedRows[0].registration_code,
          time: formatVietnamTime(insertedRows[0].submitted_at),
        },
        201,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể lưu đăng ký.";

      console.error("Registration API error:", error);

      if (
        message.includes("website_registrations") ||
        message.includes("does not exist")
      ) {
        return jsonResponse(
          {
            result: "error",
            message:
              "Hệ thống đăng ký đang được cập nhật. Vui lòng thử lại sau.",
          },
          503,
        );
      }

      const validationMessages = [
        "Vui lòng",
        "không hợp lệ",
        "không đúng",
        "không được vượt",
        "phải từ",
        "phải sử dụng",
        "Dữ liệu gửi lên",
      ];

      const isValidationError = validationMessages.some((prefix) =>
        message.includes(prefix),
      );

      return jsonResponse(
        {
          result: "error",
          message: isValidationError
            ? message
            : "Không thể lưu đăng ký lúc này. Vui lòng thử lại sau.",
        },
        isValidationError ? 400 : 500,
      );
    }
  },
};
