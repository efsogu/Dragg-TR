const TURKEY_TIME_ZONE = "Europe/Istanbul";

const turkeyCalendarFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: TURKEY_TIME_ZONE,
  year: "numeric",
});

type TurkeyCalendarParts = {
  day: string;
  month: string;
  year: string;
};

function getTurkeyCalendarParts(date: Date): TurkeyCalendarParts {
  const values = Object.fromEntries(
    turkeyCalendarFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as TurkeyCalendarParts;

  return {
    day: values.day,
    month: values.month,
    year: values.year,
  };
}

export function getTurkeyDateValue(date = new Date()) {
  const { day, month, year } = getTurkeyCalendarParts(date);
  return `${year}-${month}-${day}`;
}

export function getTurkeyMonthValue(date = new Date()) {
  const { month, year } = getTurkeyCalendarParts(date);
  return `${year}-${month}`;
}
