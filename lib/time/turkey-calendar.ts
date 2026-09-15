const TURKEY_TIME_ZONE = "Europe/Istanbul";

const turkeyCalendarFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: TURKEY_TIME_ZONE,
  year: "numeric",
});

function getTurkeyCalendarParts(date: Date) {
  const values = new Map(
    turkeyCalendarFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const year = values.get("year");
  const month = values.get("month");
  const day = values.get("day");

  if (!year || !month || !day) {
    throw new Error("Unable to resolve Turkey calendar date.");
  }

  return { day, month, year };
}

export function getTurkeyDateValue(date = new Date()) {
  const { day, month, year } = getTurkeyCalendarParts(date);
  return `${year}-${month}-${day}`;
}

export function getTurkeyMonthValue(date = new Date()) {
  const { month, year } = getTurkeyCalendarParts(date);
  return `${year}-${month}`;
}
