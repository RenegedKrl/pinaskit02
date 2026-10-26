import "server-only";
import { headers } from "next/headers";

// Endereço público do Pinas Kit (links mandados para clientes). Nunca localhost: o cliente não acessa o computador de quem copiou.
const PUBLIC_APP_URL = "https://pinaskit.vercel.app";
export async function appUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env && !/localhost|127\.0\.0\.1/.test(env)) return env.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  if (host && !/localhost|127\.0\.0\.1/.test(host)) return `https://${host}`;
  return PUBLIC_APP_URL;
}
