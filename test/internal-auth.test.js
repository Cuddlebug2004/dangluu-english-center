import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import { canonicalJson, verifyInternalRequest } from "../api/_lib/internal-auth.js";

test("canonical internal request JSON is independent of key order", () => {
  assert.equal(
    canonicalJson({ size: 12, pathname: "a", nested: { z: 1, a: 2 } }),
    '{"nested":{"a":2,"z":1},"pathname":"a","size":12}',
  );
});

test("internal request signature verifies after JSON key reordering", () => {
  const previous = process.env.LEARNING_INTERNAL_SECRET;
  process.env.LEARNING_INTERNAL_SECRET = "test-internal-secret-that-is-at-least-32-bytes-long";
  try {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const body = { role: "reading_pdf", size: 12, pathname: "learning/path" };
    const signature = crypto
      .createHmac("sha256", process.env.LEARNING_INTERNAL_SECRET)
      .update(`${timestamp}.${canonicalJson(body)}`, "utf8")
      .digest("hex");
    assert.doesNotThrow(() =>
      verifyInternalRequest(
        { headers: { "x-dle-timestamp": timestamp, "x-dle-signature": signature } },
        { pathname: "learning/path", role: "reading_pdf", size: 12 },
      ),
    );
  } finally {
    if (previous === undefined) delete process.env.LEARNING_INTERNAL_SECRET;
    else process.env.LEARNING_INTERNAL_SECRET = previous;
  }
});
