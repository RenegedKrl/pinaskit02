# Como colocar o Pinas Kit para rodar

Siga na ordem. Cada passo diz onde clicar ou o que digitar. Se travar, peça para a IA: "estou no passo X do COMO-RODAR.md e apareceu este erro: …".

## 1. Programas no seu computador
- Node.js 22 ou mais novo (nodejs.org, versão LTS).
- No terminal, dentro da pasta `Pinas Kit`:
  ```
  npm install
  npx playwright install chromium
  ```

## 2. Supabase (banco, login e API)
1. Crie uma conta grátis em supabase.com → **New project** (região São Paulo). Guarde a senha do banco.
2. Em **Project Settings → API** copie: Project URL, `anon` key e `service_role` key.
3. Copie `.env.example` para `.env.local` e preencha:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (**nunca** mande essa chave para ninguém, nem para a IA)
4. Ligue o projeto e aplique o banco:
   ```
   npx supabase login
   npx supabase link --project-ref SEU_REF
   npx supabase db push
   ```
   (SEU_REF é o código que aparece na URL do projeto: `supabase.com/dashboard/project/SEU_REF`.)
5. Publique a API do widget:
   ```
   npx supabase functions deploy w-config w-events w-lead b-redirect asaas-webhook
   npx supabase secrets set ASAAS_API_KEY=... ASAAS_BASE_URL=https://api-sandbox.asaas.com/v3 ASAAS_WEBHOOK_TOKEN=uma-senha-longa-que-voce-inventa APP_ORIGIN_HOST=localhost
   ```
6. Agendamento do fim do teste: **Database → Extensions** → ative `pg_cron`. Depois em **SQL Editor** rode:
   ```
   select cron.schedule('expire-plans', '5 * * * *', 'select expire_plans()');
   ```
7. Login com Google (opcional): **Authentication → Providers → Google**, cole o Client ID e Secret do Google Cloud. Em **Authentication → URL Configuration** coloque `http://localhost:3000` (e depois o seu domínio) e a URL de retorno `http://localhost:3000/auth/callback`.

## 3. Asaas (pagamentos), primeiro no sandbox
1. Crie conta em sandbox.asaas.com → **Integrações → Chave de API** → gere a chave e coloque em `ASAAS_API_KEY` (no `.env.local` e no `secrets set` acima).
2. **Integrações → Webhooks** → novo webhook:
   - URL: `https://SEU_REF.supabase.co/functions/v1/asaas-webhook`
   - Token de autenticação: o mesmo `ASAAS_WEBHOOK_TOKEN`
   - Eventos: cobranças (PAYMENT_*) e assinaturas (SUBSCRIPTION_*)
3. Quando tiver CNPJ e conta de produção, troque a chave e `ASAAS_BASE_URL=https://api.asaas.com/v3`.

## 4. Rodar
```
npm run dev
```
Abra http://localhost:3000 → Criar conta → crie um botão → copie o código de instalação para uma página de teste.

## 5. Testes
- `npm test` — regras de origem, pontuação, CPF/CNPJ, cupom.
- `npm run e2e` — widget no navegador (7 cenários: botão, formulário antes do rodapé, ambos, marcador, conectar formulário existente…).
- `npm run test:db` — isolamento entre clientes. Use **um banco de teste**, nunca o de produção: `DATABASE_URL=postgres://... npm run test:db` (o teste desfaz tudo no final).

## 6. Publicar (quando o teste ponta a ponta funcionar)
1. Suba a pasta para um repositório privado no GitHub (o `.env.local` fica fora, já está no `.gitignore`).
2. Em vercel.com → **Add New → Project** → importe o repositório → cole as mesmas variáveis do `.env.local`, trocando `NEXT_PUBLIC_APP_URL` pelo seu domínio.
3. Atualize `APP_ORIGIN_HOST` (secrets do Supabase) e as URLs do Authentication para o domínio.
