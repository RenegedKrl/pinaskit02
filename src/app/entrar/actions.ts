"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";

const msg = (path: string, m: string) => redirect(`${path}?erro=${encodeURIComponent(m)}`);

export async function signIn(fd: FormData) {
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email: String(fd.get("email")), password: String(fd.get("password")) });
  if (error) msg("/entrar", "E-mail ou senha incorretos.");
  const to = String(fd.get("redirect") || "/painel");
  redirect(to.startsWith("/painel") ? to : "/painel");
}

// Motivos mais comuns do Supabase Auth, em português simples.
const SIGNUP_ERRORS: Record<string, string> = {
  user_already_exists: "Já existe uma conta com este e-mail. Use “Entrar” ou “Esqueci a senha”.",
  email_exists: "Já existe uma conta com este e-mail. Use “Entrar” ou “Esqueci a senha”.",
  weak_password: "Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.",
  email_address_invalid: "Este e-mail não parece válido. Confira e tente de novo.",
  over_email_send_rate_limit: "Muitos cadastros em pouco tempo. Aguarde alguns minutos e tente de novo.",
  over_request_rate_limit: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.",
};

export async function signUp(fd: FormData) {
  const supabase = await supabaseServer();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL;
  const password = String(fd.get("password"));
  if (password.length < 8) msg("/criar-conta", "A senha precisa ter pelo menos 8 caracteres.");
  const { data, error } = await supabase.auth.signUp({
    email: String(fd.get("email")), password,
    options: { data: { business_name: String(fd.get("business") || ""), full_name: String(fd.get("name") || "") }, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    console.error("signUp", error.code, error.message);
    msg("/criar-conta", SIGNUP_ERRORS[error.code ?? ""] ?? "Não foi possível criar a conta. Verifique os dados.");
  }
  if (!data.session) redirect("/entrar?ok=confirme-email");
  redirect("/painel");
}

export async function signInGoogle() {
  const supabase = await supabaseServer();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL;
  const { data } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${origin}/auth/callback` } });
  if (data.url) redirect(data.url);
  msg("/entrar", "Não foi possível entrar com o Google.");
}

export async function resetPassword(fd: FormData) {
  const supabase = await supabaseServer();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL;
  await supabase.auth.resetPasswordForEmail(String(fd.get("email")), { redirectTo: `${origin}/auth/callback?next=/auth/nova-senha` });
  redirect("/entrar?ok=email-enviado");
}

export async function updatePassword(fd: FormData) {
  const supabase = await supabaseServer();
  const p = String(fd.get("password"));
  if (p.length < 8) msg("/auth/nova-senha", "A senha precisa ter pelo menos 8 caracteres.");
  const { error } = await supabase.auth.updateUser({ password: p });
  if (error) msg("/auth/nova-senha", "Não foi possível alterar a senha.");
  redirect("/painel");
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/entrar");
}
