function createCurrencyFormatter(currency) {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
}

const compactNumberFormatter = new Intl.NumberFormat("en-TZ", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-TZ", {
  dateStyle: "medium",
  timeStyle: "short",
});

const formatterCache = {};

export function formatCurrency(value, currency = "TZS") {
  if (!formatterCache[currency]) {
    formatterCache[currency] = createCurrencyFormatter(currency);
  }
  return formatterCache[currency].format(Number(value || 0));
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
