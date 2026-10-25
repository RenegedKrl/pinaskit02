import "server-only";

const BASE = process.env.ASAAS_BASE_URL || "https://api-sandbox.asaas.com/v3";

export async function asaas<T = Record<string, unknown>>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(BASE + path, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", "User-Agent": "PinasKit", access_token: process.env.ASAAS_API_KEY!, ...init.headers },
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = (body as { errors?: { description: string }[] }).errors?.[0]?.description;
    throw new Error(msg || `Asaas ${r.status}`);
  }
  return body as T;
}

export interface AsaasPayment {
  id: string; status: string; value: number; dueDate: string; paymentDate?: string;
  billingType: string; invoiceUrl: string; bankSlipUrl?: string;
}

export const PAY_STATUS: Record<string, string> = {
  PENDING: "Aguardando pagamento", OVERDUE: "Vencida", RECEIVED: "Paga", CONFIRMED: "Paga",
  RECEIVED_IN_CASH: "Paga", REFUNDED: "Estornada", REFUND_REQUESTED: "Estorno solicitado",
};

export { couponPercent, digits, validDoc } from "./asaas-utils";
