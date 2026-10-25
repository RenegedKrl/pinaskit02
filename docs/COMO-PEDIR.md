# Como pedir tarefas à IA (para economizar tokens)

## Modelo de pedido (copie e preencha)
Leia CLAUDE.md e docs/<módulo>.md.
Tarefa: <uma frase>.
Arquivos: <caminhos>.
Pronto quando: <critério verificável>.
Ao terminar: atualize docs/STATUS.md (até 5 linhas).

## Qual modelo/esforço
1. Se der errado perco dados, dinheiro ou segurança? → Opus, esforço alto (banco/RLS, webhooks, revisão de segurança, bug que já falhou 2x).
2. Preciso decidir um caminho ou desenhar algo novo? → Opus, esforço médio (planejar fase, fluxos).
3. Sei o que quero e há exemplo parecido no projeto? → Sonnet, esforço médio (telas, componentes, testes, bugs com erro claro). ~70% das tarefas.
4. Ajuste pequeno e óbvio? → Haiku ou Sonnet, esforço baixo (textos, CSS, renomear).

## Hábitos
- Uma tarefa por conversa; terminou → conversa nova (/clear).
- Passe caminhos, não cole arquivos. Erro: só as ~20 linhas relevantes.
- Peça revisão de um diff (git diff), nunca "revise tudo".
- Print só se o problema for visual, recortado.
- Commit a cada tarefa; se quebrar, volte com git.
