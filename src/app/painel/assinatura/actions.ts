"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, isAdmin } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { asaas, couponPercent, digits, validDoc, type AsaasPayment } from "@/lib/asaas";
import { PLAN, cycleById } from "@/lib/plan";

function back(msg: string): never {
  redirect(`/painel/assinatura?erro=${encodeURIComponent(msg)}`);
}
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

export async function subscribe(fd: FormData) {
  const { workspace: w, role, user } = await getSession();
  if (!isAdmin(role)) back("Só o dono ou um administrador pode assinar.");
  if (w.asaas_subscription_id && w.plan_status !== "canceled" && w.plan_status !== "read_only") back("Você já tem uma assinatura.");

  const plan = cycleById(String(fd.get("cycle"))); // ciclo desconhecido cai no mensal
  const cycle = plan.id;
  const billingType = ["CREDIT_CARD", "PIX", "BOLETO"].includes(String(fd.get("method"))) ? String(fd.get("method")) : "PIX";
  const name = String(fd.get("name") || "").trim();
  const doc = validDoc(String(fd.get("doc") || ""));
  const cep = digits(String(fd.get("cep") || ""));
  const off = couponPercent(String(fd.get("coupon") || ""));
  if (name.length < 3) back("Informe o nome completo ou a razão social.");
  if (!doc) back("CPF ou CNPJ inválido.");
  if (cep.length !== 8) back("CEP inválido.");
  if (off < 0) back("Cupom inválido.");

  const base = plan.price;
  const value = Math.round(base * (100 - off)) / 100;
  // Quem está no teste só paga a 1ª cobrança no fim do teste; os outros pagam hoje.
  const trialEnd = new Date(w.trial_ends_at).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const due = w.plan_status === "trial" && trialEnd > today() ? trialEnd : today();

  const admin = supabaseAdmin();
  const { data: ws } = await admin.from("workspaces").select("asaas_customer_id").eq("id", w.id).single();
  let invoice = "";
  try {
    let customer = ws?.asaas_customer_id as string | null;
    if (customer) {
      await asaas(`/customers/${customer}`, { method: "PUT", body: JSON.stringify({ name, cpfCnpj: doc, postalCode: cep }) });
    } else {
      const c = await asaas<{ id: string }>("/customers", {
        method: "POST",
        body: JSON.stringify({ name, cpfCnpj: doc, email: user.email, postalCode: cep, externalReference: w.id, notificationDisabled: false }),
      });
      customer = c.id;
    }
    const sub = await asaas<{ id: string }>("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        customer, billingType, value, cycle, nextDueDate: due, externalReference: w.id,
        description: `Pinas Kit ${PLAN.name} (${plan.label.toLowerCase()})${off ? ` – cupom ${off}%` : ""}`,
      }),
    });
    await admin.from("workspaces").update({ asaas_customer_id: customer, asaas_subscription_id: sub.id }).eq("id", w.id);
    await admin.from("audit_log").insert({ workspace_id: w.id, user_id: user.id, action: "subscribe", meta: { cycle, billingType, value } });
    const p = await asaas<{ data: AsaasPayment[] }>(`/subscriptions/${sub.id}/payments`);
    invoice = p.data[0]?.invoiceUrl ?? "";
  } catch (e) {
    back(`Não foi possível criar a assinatura: ${(e as Error).message}`);
  }
  revalidatePath("/painel", "layout");
  // A página de pagamento do Asaas recebe cartão, PIX ou boleto. Nunca tocamos nos dados do cartão.
  redirect(invoice || "/painel/assinatura?ok=1");
}

export async function cancel(fd: FormData) {
  const { workspace: w, role, user } = await getSession();
  if (role !== "owner") back("Só o dono pode cancelar a assinatura.");
  if (fd.get("confirm") !== "on") back("Marque a confirmação para cancelar.");
  if (!w.asaas_subscription_id) back("Não há assinatura para cancelar.");
  try {
    await asaas(`/subscriptions/${w.asaas_subscription_id}`, { method: "DELETE" });
  } catch (e) {
    back(`Não foi possível cancelar: ${(e as Error).message}`);
  }
  await supabaseAdmin().from("audit_log").insert({ workspace_id: w.id, user_id: user.id, action: "cancel_subscription", meta: { reason: String(fd.get("reason") || "").slice(0, 300) } });
  // O status muda quando o Asaas avisar pelo webhook (SUBSCRIPTION_DELETED).
  redirect("/painel/assinatura?cancelada=1");
}
