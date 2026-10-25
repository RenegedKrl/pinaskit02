# Interface (Modelo D, tema claro)

Tokens: primária #7C3AED (hover #6D28D9) · primária clara #EDE9FE · fundo #F8F7FC · superfície #FFFFFF · texto #18152C / #57536B · sucesso/WhatsApp #10B981 · atenção #F59E0B · erro #DC2626. Poppins (títulos) + Inter (texto, tabelas). Raio 12 px cards, 8 px campos/botões. Espaço múltiplo de 4. Tema escuro: Fase 3.

Menu: Início (/painel) · Botões e formulários (/painel/captacao) · Contatos (/painel/contatos) · Funil (/painel/funil) · Configurações (/painel/configuracoes). Celular: barra inferior Início, Contatos, Funil, Mais. Menu lateral recolhível com memória.

Regras:
1. Toda tela: título, frase de propósito, uma ação principal.
2. "Contatos" na interface ("Contatos (leads)" só na 1ª vez). Textos em src/lib/copy.ts.
3. Sem números inventados; estados vazio, carregando, erro e sucesso em toda tela.
4. "O que fazer agora?": sem ponto de contato → criar; não instalado → instalar; instalado sem contato → testar; contatos parados > 24 h → atender.
5. Alvo de toque 44 px, texto mínimo 14 px, contraste AA, sem rolagem horizontal em 360 px.
6. Onboarding 3 passos: negócio + domínio → criar ponto de contato → instalar e confirmar 1º evento.
7. Faixa "Teste grátis: N dias" + card na barra lateral; banner "Precisa de ajuda?" com WhatsApp do suporte.

Landing: header · hero (1 frase + "Começar grátis por 7 dias") · 3 passos · demo marcada como exemplo · 3 modos · preço único Mensal/Anual · FAQ · CTA · rodapé. Sem depoimentos inventados. A landing usa o próprio widget em modo Ambos.
