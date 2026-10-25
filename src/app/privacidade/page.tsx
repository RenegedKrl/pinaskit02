import { Legal } from "../legal";

export const metadata = { title: "Política de privacidade — Pinas Kit" };

export default function Privacidade() {
  return (
    <Legal title="Política de privacidade">
      <p>Esta política explica como [RAZÃO SOCIAL], CNPJ [CNPJ], trata dados pessoais no Pinas Kit, de acordo com a Lei 13.709/2018 (LGPD).</p>
      <h2>1. Dados dos clientes (quem assina)</h2>
      <p>Nome, e-mail, nome do negócio e dados de cobrança (nome, CPF/CNPJ e CEP, enviados ao Asaas). Não armazenamos dados de cartão. Usamos esses dados para criar a conta, cobrar e dar suporte.</p>
      <h2>2. Dados dos visitantes e contatos dos clientes</h2>
      <p>Quando alguém usa o botão ou o formulário em um site cliente, registramos: nome, WhatsApp, e-mail e respostas preenchidos; página, origem da visita (UTMs, identificadores de clique de anúncios e site de origem); identificador anônimo do navegador; data e hora. O endereço IP é usado apenas para evitar abuso e não é exibido. Nesses casos o cliente é o controlador e nós somos operadores.</p>
      <h2>3. Armazenamento local</h2>
      <p>O botão guarda no navegador do visitante um identificador anônimo e a origem da visita por até 90 dias, para atribuir o contato à campanha certa.</p>
      <h2>4. Compartilhamento</h2>
      <p>Usamos fornecedores para operar o serviço: Supabase (banco de dados), Vercel (hospedagem), Asaas (cobrança) e Resend (e-mails). Não vendemos dados.</p>
      <h2>5. Seus direitos</h2>
      <p>Você pode pedir acesso, correção, exportação ou exclusão dos seus dados. Clientes podem apagar contatos e rastreamento diretamente no painel. Pedidos de visitantes devem ser feitos ao site em que preencheram o formulário, ou a nós pelo e-mail [E-MAIL DO ENCARREGADO].</p>
      <h2>6. Retenção e segurança</h2>
      <p>Mantemos os dados enquanto a conta existir. Após o encerramento, apagamos em até 90 dias, salvo obrigação legal. Os dados de cada cliente ficam isolados por regras de acesso no banco de dados.</p>
    </Legal>
  );
}
