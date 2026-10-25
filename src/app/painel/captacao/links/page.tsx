import { PageHeader } from "@/components/ui";
import { UtmBuilder } from "@/components/captacao/utm-builder";

export default function Links() {
  return (
    <>
      <PageHeader title="Criar link com origem" desc="Use este link nos seus anúncios para o Pinas Kit saber de qual campanha veio cada contato." />
      <UtmBuilder />
    </>
  );
}
