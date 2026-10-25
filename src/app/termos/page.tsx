import { Legal } from "../legal";
import { brl, PLAN } from "@/lib/plan";

export const metadata = { title: "Termos de uso — Pinas Kit" };

export default function Termos() {
  return (
    <Legal title="Termos de uso">
      <p>Estes termos valem entre você (cliente) e [RAZÃO SOCIAL], CNPJ [CNPJ], responsável pelo Pinas Kit.</p>
      <h2>1. O serviço</h2>
      <p>O Pinas Kit oferece botão de WhatsApp, formulário para sites, registro da origem dos contatos e um painel para organizá-los. Você é responsável pelo conteúdo do seu site e pelo atendimento aos seus contatos.</p>
      <h2>2. Teste e assinatura</h2>
      <p>O teste grátis dura {PLAN.trialDays} dias, sem cartão. Depois, o plano {PLAN.name} custa {brl(PLAN.monthly)} por mês ou {brl(PLAN.yearly)} por ano, pago por cartão, PIX ou boleto por meio do Asaas. Os preços podem mudar com aviso prévio de 30 dias.</p>
      <h2>3. Falta de pagamento e cancelamento</h2>
      <p>Se o pagamento atrasar, mantemos o acesso por 5 dias. Depois disso, ou ao fim do teste sem assinatura, o painel fica somente leitura: você ainda vê e exporta seus contatos, mas o botão e o formulário deixam de registrar novos contatos. Você pode cancelar quando quiser no painel; o acesso continua até o fim do período já pago, sem reembolso proporcional.</p>
      <h2>4. Uso aceitável</h2>
      <p>É proibido usar o serviço para spam, coleta de dados sem autorização, conteúdo ilegal ou tentativa de acessar dados de outros clientes. Podemos suspender contas que violem estes termos.</p>
      <h2>5. Dados dos seus contatos</h2>
      <p>Você é o controlador dos dados dos contatos coletados no seu site; nós somos operadores e tratamos esses dados apenas para prestar o serviço, conforme a nossa Política de Privacidade e a LGPD.</p>
      <h2>6. Disponibilidade e responsabilidade</h2>
      <p>Trabalhamos para manter o serviço no ar, mas não garantimos funcionamento sem interrupções. Nossa responsabilidade fica limitada ao valor pago nos últimos 12 meses.</p>
      <h2>7. Foro</h2>
      <p>Fica eleito o foro de [CIDADE/UF]. Dúvidas: [E-MAIL DE CONTATO].</p>
    </Legal>
  );
}
