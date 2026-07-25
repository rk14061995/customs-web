/** Raised for both "not configured" and upstream API failures so callers can show a clear message. */
export class CashfreeApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CashfreeApiError";
  }
}

export type PaymentLinkResult = {
  linkId: string;
  linkUrl: string;
  status: string;
};
