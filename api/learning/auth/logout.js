import { clearSessionCookie, revokeCurrentSession } from "../../_lib/learning-auth.js";
import { assertSameOrigin, handleApiError, method, sendJson } from "../../_lib/http.js";

export default async function handler(req, res) {
  try {
    method(req, ["POST"]);
    assertSameOrigin(req);
    await revokeCurrentSession(req);
    clearSessionCookie(res);
    return sendJson(res, 200, { ok: true });
  } catch (error) {
    clearSessionCookie(res);
    return handleApiError(res, error);
  }
}
