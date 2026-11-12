/**
 * Customer / khata rules shared by the POS, Sale Entry, Customers and Khata screens.
 */

/** Digits of a phone number in local form (03001234567), so +92 / 0 / spaces all compare equal. */
export function normalizePhone(v: unknown): string {
  let d = String(v || '').replace(/\D/g, '');
  if (d.startsWith('0092')) d = d.slice(4);
  else if (d.startsWith('92') && d.length === 12) d = d.slice(2);
  if (d.length === 10 && d.startsWith('3')) d = '0' + d;
  return d;
}

export interface CreditAccountLike {
  name: string;
  currentDebt?: number | null;
  creditLimit?: number | null;
}

/**
 * Why `amount` cannot be put on this customer's udhaar, or null when it fits the credit limit.
 * An account with a limit of 0 is a regular (cash) customer and gets no credit.
 */
export function creditLimitProblem(account: CreditAccountLike | undefined | null, amount: number): string | null {
  if (!account) return 'Select the khata customer for a credit sale.';
  // Paid from the customer's own advance (negative balance): not credit at all
  if (Math.round((Number(account.currentDebt || 0) + amount) * 100) / 100 <= 0) return null;
  const limit = account.creditLimit === null || account.creditLimit === undefined ? 50000 : Number(account.creditLimit);
  if (!(limit > 0)) {
    return `"${account.name}" ka credit (udhaar) account nahi hai. Khata page par credit limit set karein.`;
  }
  const debt = Number(account.currentDebt || 0);
  const after = Math.round((debt + amount) * 100) / 100;
  if (after > limit + 0.009) {
    const room = Math.max(0, Math.round((limit - debt) * 100) / 100);
    return `"${account.name}" ki credit limit PKR ${limit.toLocaleString()} hai aur baqi udhaar PKR ${debt.toLocaleString()}. Is sale par sirf PKR ${room.toLocaleString()} udhaar ho sakta hai; baqi raqam cash/online mein lein ya limit barhayein.`;
  }
  return null;
}
