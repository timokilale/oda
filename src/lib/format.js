const currencyFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 2,
});

const compactNumberFormatter = new Intl.NumberFormat("en-KE", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

export function formatCount(value) {
  return compactNumberFormatter.format(Number(value || 0));
}

export function formatDateTime(value) {
  if (!value) {
    return "Unknown time";
  }

  return dateTimeFormatter.format(new Date(value));
}
