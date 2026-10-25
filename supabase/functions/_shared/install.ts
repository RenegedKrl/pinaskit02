// Quando uma requisição do widget prova que ele está instalado num site real (testável).

/** true se a origem é um site publicado: http(s), não é localhost nem o próprio painel (prévia). */
export function countsAsInstall(origin: string | null, appHost: string | null): boolean {
  if (!origin) return false;
  let u: URL;
  try { u = new URL(origin); } catch { return false; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host.endsWith(".localhost")) return false;
  return !appHost || host !== appHost.toLowerCase();
}
