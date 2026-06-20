// All monetary values are integer kobo (1 NGN = 100 kobo). Format only at display time.
export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);
}
