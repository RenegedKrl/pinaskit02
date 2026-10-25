# Pinas Kit — instruções para a IA

SaaS brasileiro: widget de WhatsApp (botão flutuante e/ou formulário antes do rodapé) que captura contatos com origem (UTM) + CRM simples. Concorrente de referência: CentralKit.

## Regras de economia de contexto (OBRIGATÓRIO)
- NÃO leia o projeto inteiro. Leia só `docs/STATUS.md` + o doc do módulo da tarefa:
  - widget/script/formulário → `docs/widget.md`
  - banco, RLS, migrações → `docs/banco.md`
  - assinatura, Asaas → `docs/pagamentos.md`
  - segurança, testes → `docs/seguranca.md`
  - telas, textos, design → `docs/ui.md`
  - escopo e regras de negócio → `docs/produto.md`
- Abra só os arquivos citados na tarefa. Para achar algo, use busca (grep), não leitura ampla.
- Para tipos do banco, rode `npm run types` e leia `src/types/database.ts` (gerado), não as migrações.
- Respostas curtas: mostre o diff/resultado, sem repetir o código que não mudou.
- Ao terminar uma tarefa: atualize `docs/STATUS.md` em no máximo 5 linhas e sugira a mensagem de commit.

## Stack
Next.js (App Router, TS) + Tailwind + shadcn/ui · Supabase (Postgres, Auth, RLS, Edge Functions) · Vercel · Asaas · Resend · lucide-react · widget em TS puro + esbuild.

## Comandos
- `npm run dev` — painel local
- `npm run build:widget` — gera `public/w.js` (meta: < 12 KB gzip)
- `npm test` — testes de regras · `npm run test:db` — isolamento RLS (precisa de DATABASE_URL) · `npm run e2e` — widget no navegador
- `npx supabase db push` — aplica migrações · `npm run types` — gera tipos do banco

## Regras de código
- Arquivos com no máximo ~300 linhas. Reaproveite `src/components/ui.tsx` antes de criar componente novo.
- Textos em português simples, sem jargão. Nomes de status/temperatura ficam em `src/lib/copy.ts`.
- Campos de cobrança (plan_status, trial, asaas_*) só mudam com `supabaseAdmin()` no servidor ou pelo webhook — o banco bloqueia o resto.
- Nunca usar a chave de serviço do Supabase no navegador. Toda tabela com `workspace_id` tem RLS.
- O telefone de WhatsApp do cliente nunca sai na API pública.
- Não inventar dados nem métricas na interface; estados vazios honestos.
- Toda mudança em banco, RLS, API pública ou pagamento exige teste correspondente em `tests/`.

## Pastas
`src/app/page.tsx` landing · `src/app/entrar|criar-conta|recuperar-senha` login · `src/app/painel` painel · `src/lib` sessão, plano, Asaas · `widget/src` script · `supabase/functions` API pública e webhook · `supabase/migrations` SQL · `tests/`
