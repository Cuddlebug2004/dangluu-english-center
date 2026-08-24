const JSON_LIMIT_BYTES = 256 * 1024;

export class HttpError extends Error {
  constructor(status, message, code = "REQUEST_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function sendJson(res, status, payload) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(status).json(payload);
}

export function method(req, allowed) {
  if (!allowed.includes(req.method)) {
    throw new HttpError(405, "Phương thức không được hỗ trợ.", "METHOD_NOT_ALLOWED");
  }
}

export function readJson(req) {
  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > JSON_LIMIT_BYTES) {
    throw new HttpError(413, "Dữ liệu gửi lên quá lớn.", "PAYLOAD_TOO_LARGE");
  }
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    throw new HttpError(400, "Dữ liệu gửi lên không hợp lệ.", "INVALID_JSON");
  }
  return req.body;
}

export function assertSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) {
    throw new HttpError(403, "Yêu cầu không có nguồn hợp lệ.", "INVALID_ORIGIN");
  }
  let originUrl;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new HttpError(403, "Nguồn yêu cầu không hợp lệ.", "INVALID_ORIGIN");
  }
  const expected = process.env.PUBLIC_SITE_URL;
  if (expected) {
    const expectedUrl = new URL(expected);
    if (originUrl.origin !== expectedUrl.origin) {
      throw new HttpError(403, "Nguồn yêu cầu không hợp lệ.", "INVALID_ORIGIN");
    }
    return;
  }
  const forwardedHost = String(req.headers["x-forwarded-host"] || req.headers.host || "")
    .split(",")[0]
    .trim();
  if (!forwardedHost || originUrl.host !== forwardedHost) {
    throw new HttpError(403, "Nguồn yêu cầu không hợp lệ.", "INVALID_ORIGIN");
  }
}

export function parseCookies(req) {
  const result = {};
  for (const pair of String(req.headers.cookie || "").split(";")) {
    const index = pair.indexOf("=");
    if (index < 1) continue;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    try {
      result[key] = decodeURIComponent(value);
    } catch {
      result[key] = value;
    }
  }
  return result;
}

export function handleApiError(res, error) {
  if (error instanceof HttpError) {
    return sendJson(res, error.status, { ok: false, code: error.code, message: error.message });
  }
  console.error("Learning API error", error);
  return sendJson(res, 500, {
    ok: false,
    code: "INTERNAL_ERROR",
    message: "Hệ thống đang bận. Vui lòng thử lại sau.",
  });
}
