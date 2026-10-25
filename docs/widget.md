# Widget (script de instalação)

Instalação: `<script async src="https://<dominio>/w.js" data-pk="<public_key>"></script>` antes de `</body>`. Mesmo script para todos os modos; config vem do servidor.

## Fluxo
1. `GET /w/config?k=` (cache 60 s) → modo, textos, cores, campos, regras. NUNCA o telefone.
2. Regras de página: all | include | exclude; match contains | exact | starts_with | regex (avançado).
3. Atribuição: utm_source/medium/campaign/content/term, gclid/gbraid/wbraid/fbclid/ttclid/msclkid, referrer. Grava first_touch e last_touch em localStorage (`pk_attr`, 90 dias). `pk_vid` = UUID do visitante.
4. `POST /w/events` em lote via sendBeacon: pageview, widget_view, form_view, click, form_detected.
5. `POST /w/lead` → servidor responde ação: {type:'whatsapp', url} | {type:'message'} | {type:'redirect', url}.
6. Link direto `GET /b/<key>` registra clique e redireciona ao WhatsApp.
7. Consentimento: `window.PinasKitConsent === false` → não dispara pixels.

## Modos
- button: botão flutuante (canto esq/dir), balão de saudação, mini-formulário opcional, atendente com foto.
- form: seção antes do rodapé.
- both: os dois; "ao clicar no botão" = abrir WhatsApp | mini-form | rolar até o formulário. Balão some quando o form está visível. Um contato por visitante/telefone.

## Onde o formulário entra (ordem)
1. `[data-pinas-form]` 2. seletor "inserir antes de" do painel 3. último `footer` visível ou `[role=contentinfo]` 4. id/class com footer|rodape|site-footer 5. fim do `main`, senão do `body`. Reportar o local escolhido em `form_detected`.

## Site com formulário próprio
Detectar `form` com input tel/email e reportar. Opções no painel: conectar (escuta submit, mapeia campos por type/name/autocomplete, envia cópia ao /w/lead, não bloqueia o envio original — Fase 1 por seletor, mapeamento manual Fase 2) | substituir (esconde o dele) | adicionar também.

## Visual
Shadow DOM; `font-family: inherit`; tema auto pela cor de fundo do body (ou forçado); cor de destaque; largura "igual ao conteúdo" ou máx. 640 px; uma coluna no celular; montar só perto da viewport (IntersectionObserver).

## Campos (máx. 6)
WhatsApp (obrigatório, DDI +55 com máscara) · nome (on) · e-mail (off) · pergunta de qualificação com opções e pontos (off) · mensagem (off) · consentimento LGPD (on se houver política).
Modelo da mensagem: `Olá! Sou {nome}. Momento: {opcao}. {mensagem}`.

## Anti-spam no cliente
Honeypot invisível + timestamp de render enviado junto (servidor exige ≥ 2 s).

## Meta
< 12 KB gzip, sem dependências, ES2018.
