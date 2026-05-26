const TimeZonePattern = /(z|[+-]\d{2}:?\d{2})$/i;

export function utcDateInput(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return TimeZonePattern.test(value) ? value : `${value}Z`;
}
