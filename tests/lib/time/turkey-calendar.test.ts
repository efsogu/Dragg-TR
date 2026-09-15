import { describe, expect, it } from "vitest";

import {
  getTurkeyDateValue,
  getTurkeyMonthValue,
} from "@/lib/time/turkey-calendar";

describe("Turkey calendar clock", () => {
  it("uses the Istanbul date during the UTC-to-Turkey early-morning gap", () => {
    const instant = new Date("2026-09-15T21:30:00.000Z");

    expect(getTurkeyDateValue(instant)).toBe("2026-09-16");
    expect(getTurkeyMonthValue(instant)).toBe("2026-09");
  });

  it("rolls into the next month according to Istanbul instead of UTC", () => {
    const instant = new Date("2026-09-30T21:30:00.000Z");

    expect(getTurkeyDateValue(instant)).toBe("2026-10-01");
    expect(getTurkeyMonthValue(instant)).toBe("2026-10");
  });

  it("keeps ordinary daytime instants on the expected Turkey calendar date", () => {
    const instant = new Date("2026-09-16T12:00:00.000Z");

    expect(getTurkeyDateValue(instant)).toBe("2026-09-16");
    expect(getTurkeyMonthValue(instant)).toBe("2026-09");
  });
});
