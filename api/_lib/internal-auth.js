import crypto from "node:crypto";
import { HttpError } from "./http.js";

export function verifyInternalRequest(req, body) {
  const secret = String(process.env.LEARNING_INTERNAL_SECRET || "");
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("LEARNING_INTERNAL_SECRET must contain at least 32 bytes");
  }
  const timestamp = String(req.headers["x-dle-timestamp"] || "");
  const signature = String(req.headers["x-dle-signature"] || "");
  const unixSeconds = Number(timestamp);
  if (!Number.isInteger(unixSeconds) || Math.abs(Date.now() / 1000 - unixSeconds) > 300) {
    throw new HttpError(401, "Chữ ký đã hết hạn.", "INVALID_SIGNATURE");
  }
  const rawBody = JSON.stringify(body);
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");
  const supplied = Buffer.from(signature, "hex");
  const wanted = Buffer.from(expected, "hex");
  if (supplied.length !== wanted.length || !crypto.timingSafeEqual(supplied, wanted)) {
    throw new HttpError(401, "Chữ ký không hợp lệ.", "INVALID_SIGNATURE");
  }
}
