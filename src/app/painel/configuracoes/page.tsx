import { getSession, isAdmin } from "@/lib/session";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { addDomain, deleteData, invite, removeDomain, removeInvite, removeMember, saveBusiness } from "./actions";

const ROLES: Record<string, string> = { owner: "Dono", admin: "Administrador", member: "Membro", viewer: "Só visualiza" };

export default async function Config() {
  const { supabase, workspace, role, user } = await getSession();
  const admin = isAdmin(role);
  const [{ data: sites }, { data: members }, { data: invites }] = await Promise.all([
    supabase.from("sites").select("id, domain").eq("workspace_id", workspace.id).order("domain"),
    supabase.from("workspace_members").select("user_id, role, email").eq("workspace_id", workspace.id),
    admin ? supabase.from("invites").select("id, email, role").eq("workspace_id", workspace.id) : Promise.resolve({ data: [] as { id: string; email: string; role: string }[] }),
  ]);

  return (
    <>
      <PageHeader title="Configurações" desc="Dados do negócio, sites autorizados e equipe." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-display font-semibold">Seu negócio</h2>
          <form action={saveBusiness} className="space-y-4">
            <Field label="Nome do negócio"><Input name="name" defaultValue={workspace.name} disabled={!admin} /></Field>
            <Field label="Link da sua Política de Privacidade" hint="Aparece na caixa de autorização (LGPD) do formulário.">
              <Input name="privacy" type="url" placeholder="https://seusite.com.br/privacidade" defaultValue={workspace.privacy_policy_url ?? ""} disabled={!admin} />
            </Field>
            {admin && <Button size="sm">Salvar</Button>}
          </form>
        </Card>

        <Card>
          <h2 className="font-display font-semibold">Sites autorizados</h2>
          <p className="mb-4 text-sm text-mute">Só esses sites (e seus subdomínios) podem enviar contatos. Sem nenhum site cadastrado, qualquer site é aceito.</p>
          <ul className="mb-4 space-y-2">
            {(sites ?? []).map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg bg-bg px-3 py-2">
                <span>{s.domain}</span>
                {admin && <form action={removeDomain}><input type="hidden" name="id" value={s.id} /><button className="text-sm text-red-700">Remover</button></form>}
              </li>
            ))}
          </ul>
          {admin && <form action={addDomain} className="flex gap-2"><Input name="domain" placeholder="seusite.com.br" required /><Button size="sm">Adicionar</Button></form>}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="font-display font-semibold">Equipe</h2>
          <p className="mb-4 text-sm text-mute">Usuários ilimitados. Convide pelo e-mail: a pessoa cria a conta com esse mesmo e-mail e entra direto no seu painel.</p>
          <ul className="mb-4 divide-y divide-line">
            {(members ?? []).map((m) => (
              <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>{m.email ?? "Usuário"}{m.user_id === user.id && " (você)"}</span>
                <span className="flex items-center gap-3 text-sm text-mute">{ROLES[m.role]}
                  {admin && m.role !== "owner" && m.user_id !== user.id && <form action={removeMember}><input type="hidden" name="user_id" value={m.user_id} /><button className="text-red-700">Remover</button></form>}
                </span>
              </li>
            ))}
            {(invites ?? []).map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2 py-2 text-mute">
                <span>{i.email} · convite pendente ({ROLES[i.role]})</span>
                <form action={removeInvite}><input type="hidden" name="id" value={i.id} /><button className="text-sm text-red-700">Cancelar</button></form>
              </li>
            ))}
          </ul>
          {admin && (
            <form action={invite} className="grid gap-2 sm:grid-cols-[1fr_200px_auto]">
              <Input name="email" type="email" placeholder="email@exemplo.com" required />
              <Select name="role" defaultValue="member"><option value="admin">Administrador</option><option value="member">Membro</option><option value="viewer">Só visualiza</option></Select>
              <Button size="sm" className="h-11">Convidar</Button>
            </form>
          )}
        </Card>

        {role === "owner" && (
          <Card className="lg:col-span-2 border-red-200">
            <h2 className="font-display font-semibold text-red-800">Apagar dados</h2>
            <p className="mb-4 text-sm text-mute">Apaga permanentemente os dados escolhidos. Botões, formulários e equipe são mantidos. Não dá para desfazer.</p>
            <form action={deleteData} className="space-y-3">
              <label className="flex items-center gap-2"><input type="checkbox" name="kind" value="leads" className="accent-red-600" /> Contatos e histórico</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="kind" value="events" className="accent-red-600" /> Rastreamento (visualizações e cliques)</label>
              <Field label='Digite APAGAR para confirmar'><Input name="confirm" className="max-w-xs" /></Field>
              <Button variant="danger" size="sm">Apagar dados selecionados</Button>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}
