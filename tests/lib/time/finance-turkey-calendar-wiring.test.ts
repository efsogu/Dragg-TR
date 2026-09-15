import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("finance core Turkey calendar wiring", () => {
  it("uses the Istanbul calendar helpers for the current day and month", () => {
    const source = readFileSync(
      new URL("../../../lib/finance/transactions.ts", import.meta.url),
      "utf8",
    );

    expect(source).toContain(
      'import { getTurkeyDateValue, getTurkeyMonthValue } from "@/lib/time/turkey-calendar";',
    );
    expect(source).toMatch(
      /function getCurrentMonthValue\(\) {\s+return getTurkeyMonthValue\(\);\s+}/,
    );
    expect(source).toMatch(
      /function getTodayValue\(\) {\s+return getTurkeyDateValue\(\);\s+}/,
    );
    expect(source).not.toContain("new Date().toISOString().slice(0, 10)");
  });
});
