type CurrencyFormatOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

type CompactCurrencyOptions = {
  thousandDigits?: number;
  millionDigits?: number;
  thousandSuffix?: string;
  millionSuffix?: string;
};

function trimTrailingZeroes(value: string) {
  return value.replace(/\.0$/, "");
}

export function formatCurrencyTHB(
  value: number,
  {
    minimumFractionDigits,
    maximumFractionDigits = 0,
  }: CurrencyFormatOptions = {},
) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

export function formatCompactCurrencyTHB(
  value: number,
  {
    thousandDigits = 0,
    millionDigits = 1,
    thousandSuffix = "K",
    millionSuffix = "M",
  }: CompactCurrencyOptions = {},
) {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absolute >= 1_000_000) {
    return `${sign}฿${trimTrailingZeroes(
      (absolute / 1_000_000).toFixed(millionDigits),
    )}${millionSuffix}`;
  }

  if (absolute >= 1_000) {
    return `${sign}฿${trimTrailingZeroes(
      (absolute / 1_000).toFixed(thousandDigits),
    )}${thousandSuffix}`;
  }

  return `${sign}฿${Math.round(absolute)}`;
}
