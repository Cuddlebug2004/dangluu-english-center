import { issueSignedToken, presignUrl } from "@vercel/blob";
import { getSql } from "../../_lib/db.js";
import { handleApiError, HttpError, method, readJson, sendJson } from "../../_lib/http.js";
import { verifyInternalRequest } from "../../_lib/internal-auth.js";

const PDF_PATH = /^learning\/[0-9a-f-]{36}\/(listening_pdf|reading_pdf)\/[A-Za-z0-9._-]+$/i;

export default async function handler(req, res) {
  try {
    method(req, ["POST"]);
    const body = readJson(req);
    verifyInternalRequest(req, body);

    const pathname = String(body.pathname || "");
    if (!PDF_PATH.test(pathname)) {
      throw new HttpError(400, "Đường dẫn PDF không hợp lệ.", "INVALID_FILE_PATH");
    }

    // Never mint a URL just because a caller knows a Blob pathname. The path
    // must be attached to a real test record in the shared database.
    const sql = getSql();
    const rows = await sql`
      SELECT EXISTS (
        SELECT 1
          FROM learning_tests
         WHERE listening_pdf_path = ${pathname}
            OR reading_pdf_path = ${pathname}
      ) AS allowed
    `;
    if (!rows[0]?.allowed) {
      throw new HttpError(404, "Không tìm thấy PDF của đề kiểm tra.", "FILE_NOT_FOUND");
    }

    const validUntil = Date.now() + 3 * 60_000;
    const token = await issueSignedToken({
      pathname,
      operations: ["get"],
      validUntil,
    });
    const { presignedUrl } = await presignUrl(token, {
      access: "private",
      operation: "get",
      pathname,
      validUntil,
      useCache: false,
    });
    return sendJson(res, 200, {
      ok: true,
      downloadUrl: presignedUrl,
      expiresAt: validUntil,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
