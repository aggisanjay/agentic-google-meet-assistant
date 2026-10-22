import { describe, it, expect } from "vitest";
import {
  isValidIanaTimezone,
  resolveTimezone,
  getDayBoundsInTimezone,
  validateTimeRange,
  doIntervalsOverlap,
  getTimezoneOffsetString,
} from "../src/utils/timezone.js";

describe("Timezone Utilities", () => {
  it("validates valid IANA timezones", () => {
    expect(isValidIanaTimezone("America/New_York")).toBe(true);
    expect(isValidIanaTimezone("Europe/London")).toBe(true);
    expect(isValidIanaTimezone("Asia/Kolkata")).toBe(true);
    expect(isValidIanaTimezone("UTC")).toBe(true);
    expect(isValidIanaTimezone("Australia/Sydney")).toBe(true);
  });

  it("rejects invalid timezones", () => {
    expect(isValidIanaTimezone("Invalid/Zone")).toBe(false);
    expect(isValidIanaTimezone("")).toBe(false);
    expect(isValidIanaTimezone(null)).toBe(false);
    expect(isValidIanaTimezone("Mars/Crater")).toBe(false);
  });

  it("resolves timezone with fallback", () => {
    expect(resolveTimezone("Asia/Kolkata")).toBe("Asia/Kolkata");
    expect(resolveTimezone("Invalid/Zone", "UTC")).toBe("UTC");
    expect(resolveTimezone(undefined, "Europe/Paris")).toBe("Europe/Paris");
  });

  it("computes timezone-aware day bounds without server host bias", () => {
    const ref = new Date("2026-10-22T15:00:00Z");
    const kolkataBounds = getDayBoundsInTimezone("Asia/Kolkata", ref);
    expect(kolkataBounds.formattedDate).toBe("2026-10-22");
    // Asia/Kolkata is UTC+05:30. Midnight in Kolkata corresponds to 18:30Z of previous day
    expect(new Date(kolkataBounds.startIso).getUTCHours()).toBe(18);
    expect(new Date(kolkataBounds.startIso).getUTCMinutes()).toBe(30);

    const nyBounds = getDayBoundsInTimezone("America/New_York", ref);
    expect(nyBounds.formattedDate).toBe("2026-10-22");
    // New York is EDT (UTC-4 in October). Midnight corresponds to 04:00Z
    expect(new Date(nyBounds.startIso).getUTCHours()).toBe(4);
    expect(new Date(nyBounds.startIso).getUTCMinutes()).toBe(0);
  });

  it("validates valid time ranges", () => {
    const valid = validateTimeRange(
      "2026-10-23T10:00:00Z",
      "2026-10-23T10:45:00Z",
    );
    expect(valid.valid).toBe(true);
    expect(valid.durationMinutes).toBe(45);
  });

  it("rejects start time later than end time", () => {
    const invalid = validateTimeRange(
      "2026-10-23T11:00:00Z",
      "2026-10-23T10:00:00Z",
    );
    expect(invalid.valid).toBe(false);
    expect(invalid.error).toContain("strictly earlier");
  });

  it("rejects invalid date format strings", () => {
    const invalid = validateTimeRange("not-a-date", "2026-10-23T10:00:00Z");
    expect(invalid.valid).toBe(false);
    expect(invalid.error).toContain("Invalid startIso");
  });

  it("correctly determines interval overlaps", () => {
    // 10:00 - 11:00 vs 10:30 - 11:30 -> overlaps
    expect(
      doIntervalsOverlap(
        "2026-10-23T10:00:00Z",
        "2026-10-23T11:00:00Z",
        "2026-10-23T10:30:00Z",
        "2026-10-23T11:30:00Z",
      ),
    ).toBe(true);

    // 10:00 - 11:00 vs 11:00 - 12:00 -> adjacent, no overlap in half-open interval [start, end)
    expect(
      doIntervalsOverlap(
        "2026-10-23T10:00:00Z",
        "2026-10-23T11:00:00Z",
        "2026-10-23T11:00:00Z",
        "2026-10-23T12:00:00Z",
      ),
    ).toBe(false);

    // 10:00 - 11:00 vs 11:15 - 12:00 -> disjoint
    expect(
      doIntervalsOverlap(
        "2026-10-23T10:00:00Z",
        "2026-10-23T11:00:00Z",
        "2026-10-23T11:15:00Z",
        "2026-10-23T12:00:00Z",
      ),
    ).toBe(false);
  });
});
