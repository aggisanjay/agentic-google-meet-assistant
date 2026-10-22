/**
 * Timezone and Scheduling Validation Utilities
 * Uses standard ECMAScript Internationalization API (Intl) for robust IANA timezone support.
 */

export const DEFAULT_FALLBACK_TIMEZONE = "UTC";

/**
 * Validates whether a given string is a recognized IANA timezone identifier.
 */
export function isValidIanaTimezone(timeZone?: string | null): boolean {
  if (!timeZone || typeof timeZone !== "string") return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timeZone.trim() });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves a valid IANA timezone or falls back gracefully.
 */
export function resolveTimezone(requested?: string | null, fallback = DEFAULT_FALLBACK_TIMEZONE): string {
  if (requested && isValidIanaTimezone(requested)) {
    return requested.trim();
  }
  return fallback;
}

/**
 * Returns the exact UTC offset string (e.g. "+05:30", "-04:00", "Z") for a given date in an IANA timezone.
 */
export function getTimezoneOffsetString(date: Date, timeZone: string): string {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  });
  const parts = dtf.formatToParts(date);
  const tzPart = parts.find((p) => p.type === "timeZoneName");
  if (!tzPart || !tzPart.value || tzPart.value === "GMT") return "Z";
  // GMT+05:30 -> +05:30
  return tzPart.value.replace(/^GMT/, "");
}

/**
 * Calculates the exact start and end ISO strings for "today" in the specified IANA timezone.
 * Avoids polluting bounds with the server's local host timezone.
 */
export function getDayBoundsInTimezone(
  timeZone: string,
  referenceDate: Date = new Date(),
): { startIso: string; endIso: string; formattedDate: string } {
  const targetTz = resolveTimezone(timeZone);

  // Format year, month, day in target timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: targetTz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const formattedDate = formatter.format(referenceDate); // YYYY-MM-DD in target timezone

  // Determine target timezone offset at midnight of that day
  // To avoid ambiguous transitions, we create a reference UTC point and compute the target day bounds
  const [yearStr, monthStr, dayStr] = formattedDate.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // Construct start of day and end of day in target timezone
  // We determine the offset at noon to find the day's base offset
  const midDayUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const offsetStr = getTimezoneOffsetString(midDayUtc, targetTz);

  // Parse offset in minutes
  let offsetMinutes = 0;
  if (offsetStr !== "Z") {
    const match = offsetStr.match(/^([+-])(\d{2}):(\d{2})$/);
    if (match) {
      const sign = match[1] === "+" ? 1 : -1;
      const hours = parseInt(match[2], 10);
      const mins = parseInt(match[3], 10);
      offsetMinutes = sign * (hours * 60 + mins);
    }
  }

  // 00:00:00 in target timezone converted to UTC Date
  const startUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - offsetMinutes * 60 * 1000;
  const endUtcMs = Date.UTC(year, month - 1, day, 23, 59, 59, 999) - offsetMinutes * 60 * 1000;

  return {
    startIso: new Date(startUtcMs).toISOString(),
    endIso: new Date(endUtcMs).toISOString(),
    formattedDate,
  };
}

export type TimeRangeValidationResult = {
  valid: boolean;
  error?: string;
  startDate?: Date;
  endDate?: Date;
  durationMinutes?: number;
  isPast?: boolean;
};

/**
 * Validates ISO datetime range:
 * - Checks format and parseability
 * - Verifies start is strictly before end
 * - Calculates duration
 * - Checks if event is in the past
 */
export function validateTimeRange(
  startIso: string,
  endIso: string,
  now: Date = new Date(),
): TimeRangeValidationResult {
  if (!startIso || typeof startIso !== "string") {
    return { valid: false, error: "Missing or invalid startIso" };
  }
  if (!endIso || typeof endIso !== "string") {
    return { valid: false, error: "Missing or invalid endIso" };
  }

  const startDate = new Date(startIso);
  const endDate = new Date(endIso);

  if (isNaN(startDate.getTime())) {
    return { valid: false, error: `Invalid startIso datetime format: "${startIso}"` };
  }
  if (isNaN(endDate.getTime())) {
    return { valid: false, error: `Invalid endIso datetime format: "${endIso}"` };
  }

  if (startDate.getTime() >= endDate.getTime()) {
    return {
      valid: false,
      error: `Start time (${startIso}) must be strictly earlier than end time (${endIso})`,
      startDate,
      endDate,
    };
  }

  const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  const isPast = endDate.getTime() < now.getTime();

  return {
    valid: true,
    startDate,
    endDate,
    durationMinutes,
    isPast,
  };
}

/**
 * Checks if two time intervals overlap (half-open interval [start, end)).
 */
export function doIntervalsOverlap(
  start1: Date | string,
  end1: Date | string,
  start2: Date | string,
  end2: Date | string,
): boolean {
  const s1 = typeof start1 === "string" ? new Date(start1).getTime() : start1.getTime();
  const e1 = typeof end1 === "string" ? new Date(end1).getTime() : end1.getTime();
  const s2 = typeof start2 === "string" ? new Date(start2).getTime() : start2.getTime();
  const e2 = typeof end2 === "string" ? new Date(end2).getTime() : end2.getTime();

  return s1 < e2 && s2 < e1;
}
