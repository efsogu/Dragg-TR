import { describe, expect, it } from "vitest";

import { turkishMessages } from "@/lib/i18n/tr";

const REQUIRED_TURKISH_KEYS = [
  "auth.footer",
  "auth.oauthError",
  "transaction.installmentFrequency",
  "transaction.installmentOption.full",
  "transaction.notesPlaceholder",
  "transaction.recordError",
  "transaction.recordSuccess",
] as const;

describe("Turkish production copy", () => {
  it.each(REQUIRED_TURKISH_KEYS)("defines %s without English fallback", (key) => {
    expect(turkishMessages[key]).toBeTruthy();
  });
});
