import { issueSignedToken, presignUrl } from "@vercel/blob";
import { handleApiError, HttpError, method, readJson, sendJson } from "../../_lib/http.js";
import { verifyInternalRequest } from "../../_lib/internal-auth.js";

const RULES = {
  listening_pdf: { contentTypes: ["application/pdf"], maxBytes: 30 * 1024 * 1024 },
  reading_pdf: { contentTypes: ["application/pdf"], maxBytes: 30 * 1024 * 1024 },
  listening_audio: {
    contentTypes: ["audio/mpeg", "audio/mp3", "audio/x-mpeg"],
    maxBytes: 60 * 1024 * 1024,
  },
};

export default async function handler(req, res) {
  try {
    method(req, ["POST"]);
    const body = readJson(req);
    verifyInternalRequest(req, body);
    const role = String(body.role || "");
    const pathname = String(body.pathname || "");
    const contentType = String(body.contentType || "").toLowerCase();
    const size = Number(body.size);
    const rule = RULES[role];
    if (!rule || !/^learning\/[0-9a-f-]{36}\/(listening_pdf|reading_pdf|listening_audio)\/[A-Za-z0-9._-]+$/.test(pathname)) {
      throw new HttpError(400, "Đường dẫn tệp không hợp lệ.", "INVALID_FILE_PATH");
    }
    if (!pathname.includes(`/${role}/`) || !rule.contentTypes.includes(contentType)) {
      throw new HttpError(400, "Định dạng tệp không hợp lệ.", "INVALID_FILE_TYPE");
    }
    if (!Number.isSafeInteger(size) || size < 1 || size > rule.maxBytes) {
      throw new HttpError(400, "Kích thước tệp không hợp lệ.", "INVALID_FILE_SIZE");
    }
    const validUntil = Date.now() + 5 * 60_000;
    const token = await issueSignedToken({
      pathname,
      operations: ["put"],
      validUntil,
      allowedContentTypes: [contentType],
      maximumSizeInBytes: size,
    });
    const { presignedUrl } = await presignUrl(token, {
      access: "private",
      operation: "put",
      pathname,
      validUntil,
      allowedContentTypes: [contentType],
      maximumSizeInBytes: size,
      allowOverwrite: false,
      addRandomSuffix: false,
    });
    return sendJson(res, 200, { ok: true, uploadUrl: presignedUrl, expiresAt: validUntil });
  } catch (error) {
    return handleApiError(res, error);
  }
}
